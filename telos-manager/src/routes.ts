import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { z } from "zod";
import { OPENROUTER_API_KEY, REGISTRY_URL } from "./config.js";
import { planPromptWithOpenRouter } from "./openRouterPlanner.js";
import { paidFetch } from "./paidFetch.js";
import { getAgent, listAgents, searchByCapability } from "./registryClient.js";

const executeBody = z
  .object({
    mode: z.enum(["by_agent_id", "by_capability", "by_url"]),
    agentId: z.string().min(1).optional(),
    capability: z.string().min(1).optional(),
    url: z.string().url().optional(),
    /** Appended to agent baseUrl (e.g. /weather/testnet?city=SF) */
    path: z.string().min(1).optional(),
    method: z.enum(["GET", "POST"]).default("GET"),
    body: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "by_url" && !data.url) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "by_url requires url" });
    }
    if (data.mode === "by_agent_id" && !data.agentId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "by_agent_id requires agentId" });
    }
    if (data.mode === "by_capability" && !data.capability) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "by_capability requires capability" });
    }
    if (data.mode !== "by_url" && !data.path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "path is required when resolving via registry (e.g. /weather/testnet?city=SF)",
      });
    }
  });

type ExecuteInput = z.infer<typeof executeBody>;

const promptBody = z.object({
  prompt: z.string().min(1).max(8000),
});

function joinUrl(base: string, p: string): string {
  const baseTrim = base.replace(/\/+$/, "");
  const pathTrim = p.startsWith("/") ? p : `/${p}`;
  return `${baseTrim}${pathTrim}`;
}

type ExecuteFailure =
  | { error: "agent_not_found"; agentId: string; status: 404 }
  | { error: "no_agent_for_capability"; capability: string; status: 404 };

type ExecuteSuccess = {
  ok: boolean;
  targetUrl: string;
  agent: { id: string; baseUrl: string; payTo: string } | null;
  httpStatus: number;
  settlement: { transaction?: string; transactionUrl?: string };
  response: unknown;
};

async function runExecute(data: ExecuteInput): Promise<ExecuteSuccess | ExecuteFailure> {
  const { mode, agentId, capability, url, path, method, body } = data;

  let targetUrl: string;
  let chosenAgent: { id: string; baseUrl: string; payTo: string } | null = null;

  if (mode === "by_url") {
    targetUrl = url!;
  } else if (mode === "by_agent_id") {
    const agent = await getAgent(agentId!);
    if (!agent) {
      return { error: "agent_not_found", agentId: agentId!, status: 404 };
    }
    chosenAgent = { id: agent.id, baseUrl: agent.baseUrl, payTo: agent.payTo };
    targetUrl = joinUrl(agent.baseUrl, path!);
  } else {
    const matches = await searchByCapability(capability!);
    if (matches.length === 0) {
      return { error: "no_agent_for_capability", capability: capability!, status: 404 };
    }
    const agent = matches[0]!;
    chosenAgent = { id: agent.id, baseUrl: agent.baseUrl, payTo: agent.payTo };
    targetUrl = joinUrl(agent.baseUrl, path!);
  }

  const init: RequestInit = { method };
  if (method === "POST" && body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }

  const result = await paidFetch(targetUrl, init);

  let jsonBody: unknown = undefined;
  const ct = result.contentType ?? "";
  if (ct.includes("application/json")) {
    try {
      jsonBody = JSON.parse(result.bodyText) as unknown;
    } catch {
      jsonBody = undefined;
    }
  }

  return {
    ok: result.status >= 200 && result.status < 300,
    targetUrl,
    agent: chosenAgent,
    httpStatus: result.status,
    settlement: {
      transaction: result.transaction,
      transactionUrl: result.transactionUrl,
    },
    response: jsonBody ?? result.bodyText,
  };
}

export function apiRouter(): Router {
  const r = createRouter();

  r.get("/registry/agents", async (_req: Request, res: Response) => {
    try {
      const agents = await listAgents();
      res.json({ agents, source: REGISTRY_URL });
    } catch (e) {
      res.status(502).json({ error: "registry_unreachable", message: String(e) });
    }
  });

  r.post("/execute", async (req: Request, res: Response) => {
    const parsed = executeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    try {
      const out = await runExecute(parsed.data);
      if ("error" in out) {
        res.status(out.status).json(out);
        return;
      }
      res.json(out);
    } catch (e) {
      res.status(502).json({ error: "execute_failed", message: String(e) });
    }
  });

  /** MVP planner: keyword routing without LLM. */
  r.post("/prompt", async (req: Request, res: Response) => {
    const parsed = promptBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const text = parsed.data.prompt.toLowerCase();

    let capability: string | undefined;
    let path: string | undefined;
    let interpretedSource: "openrouter" | "keywords" | undefined;

    if (OPENROUTER_API_KEY) {
      try {
        const agents = await listAgents();
        const caps = [...new Set(agents.flatMap((a) => a.capabilities))];
        const planned = await planPromptWithOpenRouter(parsed.data.prompt, caps);
        capability = planned.capability;
        path = planned.path;
        interpretedSource = "openrouter";
      } catch (e) {
        console.warn("[telos-manager] OpenRouter planner failed, using keyword fallback:", e);
      }
    }

    if (!capability || !path) {
      if (text.includes("weather") || text.includes("forecast")) {
        capability = "weather";
        const m = parsed.data.prompt.match(/\bin\s+([A-Za-z][A-Za-z\s]+)$/i);
        const city = m?.[1]?.trim().replace(/\s+/g, "+") ?? "San+Francisco";
        path = `/weather/testnet?city=${city}`;
        interpretedSource = "keywords";
      }
    }

    if (!capability || !path) {
      res.status(400).json({
        error: "prompt_not_understood",
        hint: OPENROUTER_API_KEY
          ? "Could not plan this prompt (OpenRouter failed and keyword fallback did not match). Use POST /v1/execute with mode by_capability or by_agent_id."
          : "Without OPENROUTER_API_KEY, only weather/forecast prompts are understood. Set the key for LLM routing, or use POST /v1/execute.",
      });
      return;
    }

    try {
      const out = await runExecute({
        mode: "by_capability",
        capability,
        path,
        method: "GET",
      });
      if ("error" in out) {
        res.status(out.status).json(out);
        return;
      }
      res.json({
        interpreted: { capability, path, source: interpretedSource },
        ...out,
      });
    } catch (e) {
      res.status(502).json({ error: "execute_failed", message: String(e) });
    }
  });

  return r;
}
