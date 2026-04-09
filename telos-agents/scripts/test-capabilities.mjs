/**
 * Smoke-test agent HTTP routes (no x402 payment).
 * Set PAYWALL_DISABLED=true in .env and run telos-agents, then: pnpm test:capabilities
 */
import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const BASE = (process.env.AGENTS_PUBLIC_BASE_URL ?? "http://localhost:3100").replace(/\/+$/, "");

async function safeFetch(url, init) {
  try {
    return await fetch(url, init);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const cause = err.cause;
    const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
    const hint =
      code === "ECONNREFUSED" || /ECONNREFUSED|fetch failed/i.test(err.message)
        ? "\n  (connection refused — is telos-agents running on this host/port?)"
        : "";
    throw new Error(
      `${err.message}${hint}\n\n` +
        "Start the server in another terminal:\n" +
        "  cd telos-agents && pnpm dev\n\n" +
        "For smoke tests without x402 payment, set in .env:\n" +
        "  PAYWALL_DISABLED=true\n",
    );
  }
}

async function req(label, url, init = {}) {
  const res = await safeFetch(url, init);
  const ct = res.headers.get("content-type") ?? "";
  let preview = "";
  const buf = await res.text();
  if (ct.includes("application/json")) {
    try {
      preview = JSON.stringify(JSON.parse(buf), null, 0).slice(0, 200);
    } catch {
      preview = buf.slice(0, 200);
    }
  } else {
    preview = buf.slice(0, 120);
  }
  const ok = res.ok ? "OK" : `HTTP ${res.status}`;
  console.log(`[${ok}] ${label}`);
  console.log(`    ${preview}${buf.length > 200 ? "…" : ""}\n`);
  if (res.status === 402) {
    console.log(
      "    → Got 402 Payment Required. Set PAYWALL_DISABLED=true in .env for unpaid capability checks.\n",
    );
  }
  return res.ok;
}

async function main() {
  console.log(`Testing ${BASE}\n`);

  await req("health", `${BASE}/health`);

  const results = [];

  results.push(
    await req("weather", `${BASE}/weather/testnet?city=London`),
  );

  results.push(
    await req(
      "math",
      `${BASE}/math/testnet`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expr: "sqrt(16) + 2" }),
      },
    ),
  );

  results.push(
    await req(
      "summarize",
      `${BASE}/summarize/testnet`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Short text to summarize." }),
      },
    ),
  );

  results.push(
    await req(
      "crypto-sentiment",
      `${BASE}/crypto-sentiment/testnet`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          symbol: "BTC",
          text: "Bitcoin to the moon, bullish momentum.",
        }),
      },
    ),
  );

  results.push(
    await req(
      "deep-research",
      `${BASE}/deep-research/testnet`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "x402 on Stellar" }),
      },
    ),
  );

  results.push(await req("market", `${BASE}/market/testnet?symbol=BTC`));

  results.push(
    await req(
      "website-builder",
      `${BASE}/website-builder/testnet`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "A landing hero for a hackathon demo" }),
      },
    ),
  );

  const failed = results.filter((r) => !r).length;
  if (failed > 0) {
    console.error(
      `${failed} request(s) did not return 2xx. If any line shows HTTP 402, set PAYWALL_DISABLED=true in .env and restart the server.`,
    );
    process.exit(1);
  }
  console.log("All capability checks returned OK.");
  if (process.env.COINGECKO_API_KEY?.trim()) {
    console.log("Market: with COINGECKO_API_KEY, JSON should include source: coingecko when the symbol maps (e.g. BTC).");
  } else {
    console.log("Market: add COINGECKO_API_KEY to .env for live prices; otherwise source stays demo.");
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
