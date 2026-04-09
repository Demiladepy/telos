/**
 * Registers one telos-registry row per logical agent (same baseUrl, different payTo).
 * Loads ../.env — set REGISTRY_URL, AGENTS_PUBLIC_BASE_URL, PAY_TO_*.
 *
 * Usage: pnpm register:agents
 */
import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const REGISTRY_URL = (process.env.REGISTRY_URL ?? "http://localhost:4010").replace(/\/+$/, "");
const BASE_URL = (process.env.AGENTS_PUBLIC_BASE_URL ?? "http://localhost:3100").replace(/\/+$/, "");
const NETWORK = "stellar:testnet";
const PRICE = process.env.PAYMENT_PRICE?.trim() ?? "0.01";

const AGENTS = [
  { id: "weather-oracle", name: "Weather Oracle", capabilities: ["weather"], payEnv: "PAY_TO_WEATHER" },
  { id: "mathsolver", name: "Math Solver", capabilities: ["math"], payEnv: "PAY_TO_MATH" },
  { id: "summarizer-pro", name: "Summarizer Pro", capabilities: ["summarization"], payEnv: "PAY_TO_SUMMARIZE" },
  { id: "crypto-sentiment", name: "Crypto Sentiment", capabilities: ["crypto_sentiment"], payEnv: "PAY_TO_CRYPTO_SENTIMENT" },
  { id: "deepresearchai", name: "Deep Research AI", capabilities: ["deep_research"], payEnv: "PAY_TO_DEEP_RESEARCH" },
  { id: "market-oracle", name: "Market Oracle", capabilities: ["market"], payEnv: "PAY_TO_MARKET" },
  { id: "website-builder", name: "Website Builder", capabilities: ["website_builder"], payEnv: "PAY_TO_WEBSITE_BUILDER" },
];

const STELLAR_G = /^G[A-Z0-9]{55}$/;

function requirePayTo(envName) {
  const v = process.env[envName]?.trim();
  if (!v || !STELLAR_G.test(v)) {
    throw new Error(`Missing or invalid ${envName} in .env (Stellar public key G...)`);
  }
  return v;
}

async function main() {
  console.log(`Registry: ${REGISTRY_URL}`);
  console.log(`baseUrl:  ${BASE_URL}\n`);

  for (const a of AGENTS) {
    const payTo = requirePayTo(a.payEnv);
    const body = {
      id: a.id,
      name: a.name,
      description: `TELOS demo agent — ${a.capabilities[0]}`,
      capabilities: a.capabilities,
      baseUrl: BASE_URL,
      payTo,
      suggestedPrice: PRICE,
      network: NETWORK,
    };

    const url = `${REGISTRY_URL}/v1/agents/${encodeURIComponent(a.id)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`PUT ${a.id} failed HTTP ${res.status}: ${t.slice(0, 500)}`);
    }
    console.log(`✓ registered ${a.id} → ${a.payEnv}`);
  }

  console.log("\nDone. List: GET " + REGISTRY_URL + "/v1/agents");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
