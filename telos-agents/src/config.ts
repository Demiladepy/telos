import "dotenv/config";

export const STELLAR_TESTNET_CAIP2 = "stellar:testnet" as const;
export type StellarNetwork = typeof STELLAR_TESTNET_CAIP2;

export interface NetworkConfig {
  network: StellarNetwork;
  serverStellarAddress: string;
  stellarRpcUrl: string;
  facilitatorUrl: string;
  facilitatorApiKey: string | undefined;
}

const ADDR = /^(?:[GC][ABCD][A-Z2-7]{54}|M[ABCD][A-Z2-7]{67})$/;

function readTestnetConfig(): NetworkConfig | undefined {
  const serverStellarAddress = process.env.TESTNET_SERVER_STELLAR_ADDRESS?.trim();
  if (!serverStellarAddress) return undefined;
  if (!ADDR.test(serverStellarAddress)) {
    throw new Error(`TESTNET_SERVER_STELLAR_ADDRESS is not a valid Stellar address`);
  }
  const facilitatorUrl = process.env.TESTNET_FACILITATOR_URL?.trim();
  if (!facilitatorUrl) {
    throw new Error("TESTNET_FACILITATOR_URL is required when paywall is enabled");
  }
  const facilitatorApiKey = process.env.TESTNET_FACILITATOR_API_KEY?.trim() || undefined;
  const stellarRpcUrl =
    process.env.TESTNET_STELLAR_RPC_URL?.trim() ?? "https://soroban-testnet.stellar.org";

  return {
    network: STELLAR_TESTNET_CAIP2,
    serverStellarAddress,
    stellarRpcUrl,
    facilitatorUrl,
    facilitatorApiKey,
  };
}

export const PAYWALL_DISABLED = process.env.PAYWALL_DISABLED?.toLowerCase() === "true";

export const PORT = (() => {
  const raw = process.env.PORT ?? "3100";
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) throw new Error(`Invalid PORT: ${raw}`);
  return n;
})();

export const PAYMENT_PRICE = process.env.PAYMENT_PRICE?.trim() ?? "0.01";

/**
 * Optional per-agent merchant address (G...). When unset, falls back to `TESTNET_SERVER_STELLAR_ADDRESS`.
 * Must match the `payTo` you register for that agent in telos-registry.
 */
export function payToOrDefault(envName: string, fallback: string): string {
  const v = process.env[envName]?.trim();
  if (!v) return fallback;
  if (!ADDR.test(v)) {
    throw new Error(`${envName} must be a valid Stellar destination (G... / C... / M...)`);
  }
  return v;
}

/** Optional: OpenRouter for POST /summarize/testnet */
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();

export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL?.trim() ?? "openai/gpt-4o-mini";

/** Model for POST /deep-research/testnet (defaults to OPENROUTER_MODEL). Prefer a capable model for quality. */
export const DEEP_RESEARCH_MODEL =
  process.env.DEEP_RESEARCH_MODEL?.trim() ?? OPENROUTER_MODEL;

/** Base URL of this service for server-to-server x402 calls (must match how clients reach you). */
export const AGENTS_PUBLIC_BASE_URL = (process.env.AGENTS_PUBLIC_BASE_URL ?? "http://localhost:3100").replace(
  /\/+$/,
  "",
);

/** Full URL for POST `{ "prompt" }` deep-research hire. Defaults to local `/deep-research/testnet`. */
export function getDeepResearchHireUrl(): string {
  const custom = process.env.HIRE_DEEP_RESEARCH_URL?.trim();
  if (custom) return custom;
  return `${AGENTS_PUBLIC_BASE_URL}/deep-research/testnet`;
}

/**
 * telos-registry base (no trailing slash). Used for `hireFromRegistry` / `hire_registry_agent_id`.
 */
export const REGISTRY_URL = (() => {
  const r = process.env.REGISTRY_URL?.trim();
  if (!r) return undefined;
  return r.replace(/\/+$/, "");
})();

function normalizeOrigin(input: string): string {
  const s = input.trim();
  if (!s) return "";
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    return u.origin;
  } catch {
    return "";
  }
}

/**
 * Origins the hiring wallet may pay (http/https). If unset, defaults to AGENTS_PUBLIC_BASE_URL + deep-research URL origins.
 * Add partner agents: HIRING_ALLOWED_ORIGINS=http://localhost:3200,https://their-agent.example
 */
export function getHiringAllowedOrigins(): string[] {
  const raw = process.env.HIRING_ALLOWED_ORIGINS?.trim();
  if (raw) {
    const list = raw
      .split(",")
      .map(normalizeOrigin)
      .filter(Boolean);
    return [...new Set(list)];
  }
  const out = new Set<string>();
  try {
    out.add(new URL(AGENTS_PUBLIC_BASE_URL).origin);
  } catch {
    /* ignore */
  }
  try {
    out.add(new URL(getDeepResearchHireUrl()).origin);
  } catch {
    /* ignore */
  }
  return [...out];
}

export function assertHiringUrlAllowed(urlStr: string): void {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    throw new Error("Invalid hire URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Hire URL must use http or https");
  }
  const allowed = getHiringAllowedOrigins();
  if (allowed.length === 0) {
    throw new Error("No HIRING_ALLOWED_ORIGINS could be derived; set AGENTS_PUBLIC_BASE_URL");
  }
  if (!allowed.includes(u.origin)) {
    throw new Error(
      `Hire blocked: origin ${u.origin} is not in HIRING_ALLOWED_ORIGINS (or default allowlist).`,
    );
  }
}

/**
 * Secret key for paying other agents (math/market → deep-research). Fund with testnet USDC + trustline.
 * Separate from per-route payTo merchants: this wallet is the "employer" treasury.
 */
export const AGENT_HIRING_SECRET = process.env.AGENT_HIRING_STELLAR_SECRET?.trim();

const HIRING_NETWORK_MAP: Record<string, `stellar:${string}`> = {
  testnet: "stellar:testnet",
  mainnet: "stellar:pubnet",
};

export const AGENT_HIRING_NETWORK_KEY = process.env.AGENT_HIRING_NETWORK?.trim() ?? "testnet";
export const AGENT_HIRING_STELLAR_NETWORK = HIRING_NETWORK_MAP[AGENT_HIRING_NETWORK_KEY];

export const STELLAR_EXPERT_TX: Record<string, string> = {
  testnet: "https://stellar.expert/explorer/testnet/tx",
  mainnet: "https://stellar.expert/explorer/public/tx",
};

export function isHiringWalletConfigured(): boolean {
  return Boolean(AGENT_HIRING_SECRET && AGENT_HIRING_STELLAR_NETWORK);
}

/** When true, every PAY_TO_* must be set (no fallback to TESTNET_SERVER_STELLAR_ADDRESS). */
export const REQUIRE_SEPARATE_AGENT_PAY_TO =
  process.env.REQUIRE_SEPARATE_AGENT_PAY_TO?.toLowerCase() === "true";

export const PAY_TO_ENV_KEYS = [
  "PAY_TO_WEATHER",
  "PAY_TO_MATH",
  "PAY_TO_SUMMARIZE",
  "PAY_TO_CRYPTO_SENTIMENT",
  "PAY_TO_DEEP_RESEARCH",
  "PAY_TO_MARKET",
  "PAY_TO_WEBSITE_BUILDER",
] as const;

export function assertSeparatePayTosIfRequired(): void {
  if (!REQUIRE_SEPARATE_AGENT_PAY_TO) return;
  const missing: string[] = [];
  for (const key of PAY_TO_ENV_KEYS) {
    if (!process.env[key]?.trim()) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `REQUIRE_SEPARATE_AGENT_PAY_TO=true but missing: ${missing.join(", ")}. ` +
        "Set one Stellar address per logical agent so x402 payTo matches each registry row.",
    );
  }
}

export function getNetworkConfig(): NetworkConfig | undefined {
  return readTestnetConfig();
}

export function requireNetworkConfig(): NetworkConfig {
  const c = getNetworkConfig();
  if (!c) {
    throw new Error("TESTNET_SERVER_STELLAR_ADDRESS is required when paywall is enabled");
  }
  return c;
}

export async function validateFacilitator(cfg: NetworkConfig): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.facilitatorApiKey) {
    headers.Authorization = `Bearer ${cfg.facilitatorApiKey}`;
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${cfg.facilitatorUrl}/supported`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`GET /supported returned HTTP ${res.status}`);
    }
  } finally {
    clearTimeout(t);
  }
}
