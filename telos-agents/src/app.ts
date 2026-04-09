import cors from "cors";
import express from "express";
import helmet from "helmet";
import { PAYWALL_DISABLED, requireNetworkConfig } from "./config.js";
import { agentRouter } from "./routes.js";
import { createApiPaymentMiddleware } from "./x402.js";

export function createApp(): express.Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "telos-agents", paywall: !PAYWALL_DISABLED });
  });

  if (!PAYWALL_DISABLED) {
    const net = requireNetworkConfig();
    app.use(createApiPaymentMiddleware(net));
  }

  app.use(agentRouter());

  return app;
}
