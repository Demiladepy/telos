/**
 * End-to-end: telos-manager pays an x402 agent (facilitator + agent server must be up).
 *
 * Prereqs:
 *   1. Facilitator (x402-stellar/examples/facilitator) on TESTNET_FACILITATOR_URL (e.g. :4022)
 *   2. telos-agents with PAYWALL_DISABLED=false, same TESTNET_FACILITATOR_URL, funded payTo keys
 *   3. telos-registry with agents registered (e.g. pnpm register:agents from telos-agents)
 *   4. telos-manager with STELLAR_PRIVATE_KEY (payer, funded + USDC trustline), REGISTRY_URL
 *
 * Usage (from telos-manager):
 *   pnpm try:paid
 *   pnpm try:paid weather "/weather/testnet?city=London"
 *   pnpm try:paid market "/market/testnet?symbol=BTC"
 */
import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const MANAGER_URL = (process.env.TRY_MANAGER_URL ?? `http://localhost:${process.env.PORT ?? "4020"}`).replace(
  /\/+$/,
  "",
);
const REGISTRY_URL = (process.env.REGISTRY_URL ?? "http://localhost:4010").replace(/\/+$/, "");

const [capability, path] = (() => {
  const a = process.argv.slice(2);
  if (a.length >= 2) return [a[0], a[1]];
  return ["market", "/market/testnet?symbol=BTC"];
})();

async function main() {
  console.log("=== x402 paid execute smoke test ===\n");
  console.log(`Manager:  ${MANAGER_URL}`);
  console.log(`Registry: ${REGISTRY_URL}`);
  console.log(`Call:     capability=${capability} path=${path}\n`);

  const h = await fetch(`${MANAGER_URL}/health`);
  if (!h.ok) {
    throw new Error(`Manager /health failed HTTP ${h.status}. Start: cd telos-manager && pnpm dev`);
  }
  console.log("✓ manager /health\n");

  const agentsRes = await fetch(`${REGISTRY_URL}/v1/agents`);
  if (!agentsRes.ok) {
    throw new Error(`Registry /v1/agents failed HTTP ${agentsRes.status}. Start telos-registry.`);
  }
  const { agents = [] } = await agentsRes.json();
  const match = agents.filter((a) =>
    (a.capabilities ?? []).some((c) => String(c).toLowerCase().includes(capability.toLowerCase())),
  );
  if (match.length === 0) {
    throw new Error(
      `No registry agent with capability matching "${capability}". Run: cd telos-agents && pnpm register:agents`,
    );
  }
  console.log(`✓ registry: ${agents.length} agent(s), ${match.length} match "${capability}" (${match[0].id})\n`);

  const body = {
    mode: "by_capability",
    capability,
    path,
    method: "GET",
  };

  console.log("POST /v1/execute … (manager wallet pays x402 → facilitator settles → agent payTo)\n");

  const exec = await fetch(`${MANAGER_URL}/v1/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await exec.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text.slice(0, 800));
    process.exit(1);
  }

  console.log(JSON.stringify(json, null, 2));

  if (!exec.ok) {
    process.exit(1);
  }

  if (json.settlement?.transactionUrl) {
    console.log("\n→ Settlement:", json.settlement.transactionUrl);
  }
  console.log("\nDone. If you saw 502 / insufficient balance: fund manager STELLAR_PRIVATE_KEY with testnet USDC + trustline.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
