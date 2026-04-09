import "dotenv/config";
import { createApp } from "./app.js";
import {
  PAYWALL_DISABLED,
  PORT,
  assertSeparatePayTosIfRequired,
  requireNetworkConfig,
  validateFacilitator,
} from "./config.js";
import { logPayToRouting } from "./x402.js";

async function main(): Promise<void> {
  if (!PAYWALL_DISABLED) {
    assertSeparatePayTosIfRequired();
    const net = requireNetworkConfig();
    await validateFacilitator(net);
    console.log(`[telos-agents] facilitator OK: ${net.facilitatorUrl}`);
    logPayToRouting(net);
  } else {
    console.warn("[telos-agents] PAYWALL_DISABLED=true — routes are free (dev only)");
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[telos-agents] http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error("[telos-agents] fatal:", e);
  process.exit(1);
});
