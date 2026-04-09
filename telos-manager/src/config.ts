const NETWORK_MAP: Record<string, `stellar:${string}`> = {
  testnet: "stellar:testnet",
  mainnet: "stellar:pubnet",
};

export const STELLAR_PRIVATE_KEY = process.env.STELLAR_PRIVATE_KEY?.trim();
export const NETWORK_KEY = process.env.NETWORK?.trim() ?? "testnet";
export const STELLAR_NETWORK = NETWORK_MAP[NETWORK_KEY];
export const REGISTRY_URL = (process.env.REGISTRY_URL ?? "http://localhost:4010").replace(/\/+$/, "");
export const PORT = Number(process.env.PORT ?? "4020");

/** When set, POST /v1/prompt uses OpenRouter to pick capability + path from registry capabilities. */
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL?.trim() ?? "openai/gpt-4o-mini";


export const STELLAR_EXPERT_TX: Record<string, string> = {
  testnet: "https://stellar.expert/explorer/testnet/tx",
  mainnet: "https://stellar.expert/explorer/public/tx",
};

export function assertConfig(): void {
  if (!STELLAR_PRIVATE_KEY) {
    throw new Error("STELLAR_PRIVATE_KEY is required");
  }
  if (!STELLAR_NETWORK) {
    throw new Error(`Invalid NETWORK "${NETWORK_KEY}". Use testnet or mainnet.`);
  }
}
