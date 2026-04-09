import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { assertConfig, PORT } from "./config.js";
import { apiRouter } from "./routes.js";

try {
  assertConfig();
} catch (e) {
  console.error("[telos-manager] config error:", e);
  process.exit(1);
}

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "512kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "telos-manager" });
});

app.use("/v1", apiRouter());

app.listen(PORT, () => {
  console.log(`[telos-manager] listening on http://localhost:${PORT}`);
});
