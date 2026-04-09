import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { agentsRouter } from "./routes/agents.js";
import { bootstrapStellarIdentityFromEnv } from "./stellarBootstrap.js";

const PORT = Number(process.env.PORT ?? "4010");

const onchainEnabled = Boolean(
  process.env.TELOS_REGISTRY_CONTRACT_ID?.trim() && process.env.TELOS_REGISTRY_SOURCE_ACCOUNT?.trim(),
);

bootstrapStellarIdentityFromEnv();

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "telos-registry",
    storage: onchainEnabled ? "onchain" : "file",
  });
});

app.use("/v1/agents", agentsRouter());

app.listen(PORT, () => {
  console.log(`[telos-registry] listening on http://localhost:${PORT}`);
  console.log(`[telos-registry] storage=${onchainEnabled ? "onchain" : "file"}`);
});
