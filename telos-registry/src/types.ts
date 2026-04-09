import { z } from "zod";

/** Stellar public key (classic account) */
const stellarPublicKey = z
  .string()
  .regex(/^G[A-Z0-9]{55}$/, "must be a valid Stellar public key (G...)");

export const agentRegisterSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "id: lowercase alphanumeric, hyphens, no leading hyphen issues"),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  capabilities: z.array(z.string().min(1).max(200)).min(1).max(64),
  baseUrl: z.string().url(),
  /** x402 payTo — where this agent wants to receive USDC/XLM for its API */
  payTo: stellarPublicKey,
  /** Optional hint, e.g. "0.01" USDC; actual price is enforced by 402 responses */
  suggestedPrice: z.string().max(32).optional(),
  network: z.enum(["stellar:testnet", "stellar:mainnet"]).default("stellar:testnet"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AgentRegisterInput = z.infer<typeof agentRegisterSchema>;

export type AgentRecord = AgentRegisterInput & {
  registeredAt: string;
  updatedAt: string;
};
