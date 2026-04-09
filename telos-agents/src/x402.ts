import type { RequestHandler } from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import {
  PAYMENT_PRICE,
  payToOrDefault,
  type NetworkConfig,
} from "./config.js";

const ROUTE_SUFFIX = "testnet";

function buildServerComponents(netConfig: NetworkConfig) {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: netConfig.facilitatorUrl,
    createAuthHeaders: netConfig.facilitatorApiKey
      ? async () => {
          const h = { Authorization: `Bearer ${netConfig.facilitatorApiKey}` };
          return { verify: h, settle: h, supported: h };
        }
      : undefined,
  });

  const x402Server = new x402ResourceServer(facilitatorClient).register(
    netConfig.network,
    new ExactStellarScheme(),
  );

  return { x402Server };
}

function accept(description: string, netConfig: NetworkConfig, payTo: string) {
  return {
    accepts: [
      {
        scheme: "exact" as const,
        price: PAYMENT_PRICE,
        network: netConfig.network,
        payTo,
      },
    ],
    description,
  };
}

/**
 * Single x402 middleware for all paid API routes (testnet).
 * API-only: no HTML paywall (fourth arg undefined).
 */
export function createApiPaymentMiddleware(netConfig: NetworkConfig): RequestHandler {
  const { x402Server } = buildServerComponents(netConfig);
  const s = ROUTE_SUFFIX;
  const base = netConfig.serverStellarAddress;

  return paymentMiddleware(
    {
      [`GET /weather/${s}`]: accept(
        "Weather oracle (Open-Meteo)",
        netConfig,
        payToOrDefault("PAY_TO_WEATHER", base),
      ),
      [`POST /math/${s}`]: accept("Math solver", netConfig, payToOrDefault("PAY_TO_MATH", base)),
      [`POST /summarize/${s}`]: accept(
        "Summarizer Pro",
        netConfig,
        payToOrDefault("PAY_TO_SUMMARIZE", base),
      ),
      [`POST /crypto-sentiment/${s}`]: accept(
        "Crypto sentiment (demo)",
        netConfig,
        payToOrDefault("PAY_TO_CRYPTO_SENTIMENT", base),
      ),
      [`POST /deep-research/${s}`]: accept(
        "Deep research (demo)",
        netConfig,
        payToOrDefault("PAY_TO_DEEP_RESEARCH", base),
      ),
      [`GET /market/${s}`]: accept(
        "Market oracle (demo)",
        netConfig,
        payToOrDefault("PAY_TO_MARKET", base),
      ),
      [`POST /website-builder/${s}`]: accept(
        "Website builder (demo)",
        netConfig,
        payToOrDefault("PAY_TO_WEBSITE_BUILDER", base),
      ),
    },
    x402Server,
    undefined,
    undefined,
    true,
  );
}

/** Log which address each paid route uses — should match `payTo` on each registry agent. */
export function logPayToRouting(netConfig: NetworkConfig): void {
  const base = netConfig.serverStellarAddress;
  const rows: [string, string][] = [
    [`GET /weather/${ROUTE_SUFFIX}`, "PAY_TO_WEATHER"],
    [`POST /math/${ROUTE_SUFFIX}`, "PAY_TO_MATH"],
    [`POST /summarize/${ROUTE_SUFFIX}`, "PAY_TO_SUMMARIZE"],
    [`POST /crypto-sentiment/${ROUTE_SUFFIX}`, "PAY_TO_CRYPTO_SENTIMENT"],
    [`POST /deep-research/${ROUTE_SUFFIX}`, "PAY_TO_DEEP_RESEARCH"],
    [`GET /market/${ROUTE_SUFFIX}`, "PAY_TO_MARKET"],
    [`POST /website-builder/${ROUTE_SUFFIX}`, "PAY_TO_WEBSITE_BUILDER"],
  ];
  console.log("[telos-agents] x402 payTo per route (registry payTo should match):");
  for (const [route, envKey] of rows) {
    const explicit = Boolean(process.env[envKey]?.trim());
    const addr = payToOrDefault(envKey, base);
    console.log(
      `  ${route} -> ${addr}${explicit ? "" : " (env unset; using TESTNET_SERVER_STELLAR_ADDRESS)"}`,
    );
  }
}
