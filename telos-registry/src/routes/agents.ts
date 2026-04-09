import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { agentRegisterSchema } from "../types.js";
import { deleteAgent, getAgent, listAgents, upsertAgent } from "../store.js";

export function agentsRouter(): Router {
  const r = createRouter();

  r.get("/", async (_req: Request, res: Response) => {
    const agents = await listAgents();
    res.json({ agents, count: agents.length });
  });

  /** Must be registered before /:id so "search" is not captured as an id */
  r.get("/search/capability/:q", async (req: Request, res: Response) => {
    const qParam = req.params.q;
    const q = (typeof qParam === "string" ? qParam : "").toLowerCase();
    if (!q) {
      res.status(400).json({ error: "empty_query" });
      return;
    }
    const agents = await listAgents();
    const filtered = agents.filter((a) =>
      a.capabilities.some((c) => c.toLowerCase().includes(q)),
    );
    res.json({ agents: filtered, count: filtered.length, query: q });
  });

  r.get("/:id", async (req: Request, res: Response) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const agent = await getAgent(id);
    if (!agent) {
      res.status(404).json({ error: "not_found", message: `No agent "${id}"` });
      return;
    }
    res.json(agent);
  });

  r.put("/:id", async (req: Request, res: Response) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const parsed = agentRegisterSchema.safeParse({ ...req.body, id });
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const saved = await upsertAgent(parsed.data);
    res.status(201).json(saved);
  });

  r.delete("/:id", async (req: Request, res: Response) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const ok = await deleteAgent(id);
    if (!ok) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.status(204).send();
  });

  return r;
}
