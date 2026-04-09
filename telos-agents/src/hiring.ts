import {
  REGISTRY_URL,
  assertHiringUrlAllowed,
  getDeepResearchHireUrl,
} from "./config.js";
import { agentPaidFetch } from "./agentPaidFetch.js";

export type HirePaidResult = {
  response: unknown;
  settlement?: { transaction?: string; transactionUrl?: string };
};

function joinUrl(base: string, p: string): string {
  const b = base.replace(/\/+$/, "");
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${b}${path}`;
}

function parsePaidResponse(
  bodyText: string,
  contentType: string | null,
): unknown {
  const ct = contentType ?? "";
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(bodyText) as unknown;
    } catch {
      return bodyText;
    }
  }
  return bodyText;
}

/**
 * Pay any x402-protected URL using AGENT_HIRING_STELLAR_SECRET. Origin must be allowlisted.
 */
export async function hirePaidAgent(urlStr: string, init: RequestInit = {}): Promise<HirePaidResult> {
  assertHiringUrlAllowed(urlStr);
  const result = await agentPaidFetch(urlStr, init);
  return {
    response: parsePaidResponse(result.bodyText, result.contentType),
    settlement: {
      transaction: result.transaction,
      transactionUrl: result.transactionUrl,
    },
  };
}

/** POST `{ prompt, depth? }` to the configured deep-research endpoint (local or external). */
export async function hireDeepResearch(
  prompt: string,
  depth?: "fast" | "standard" | "deep",
): Promise<HirePaidResult> {
  const body: Record<string, unknown> = { prompt };
  if (depth) body.depth = depth;
  return hirePaidAgent(getDeepResearchHireUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type RegistryHireOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

/**
 * Resolve `baseUrl` from telos-registry, then pay that agent's path via x402.
 */
export async function hireRegistryAgent(
  agentId: string,
  path: string,
  options: RegistryHireOptions = {},
): Promise<HirePaidResult> {
  if (!REGISTRY_URL) {
    throw new Error("REGISTRY_URL is not set; cannot hire by registry id");
  }
  const res = await fetch(`${REGISTRY_URL}/v1/agents/${encodeURIComponent(agentId)}`);
  if (res.status === 404) {
    throw new Error(`Registry has no agent "${agentId}"`);
  }
  if (!res.ok) {
    throw new Error(`Registry lookup failed: HTTP ${res.status}`);
  }
  const row = (await res.json()) as { baseUrl?: string };
  if (!row.baseUrl || typeof row.baseUrl !== "string") {
    throw new Error("Registry agent missing baseUrl");
  }
  const url = joinUrl(row.baseUrl, path);
  const method = options.method ?? "POST";
  const init: RequestInit = { method };
  if (method === "POST" && options.body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  return hirePaidAgent(url, init);
}
