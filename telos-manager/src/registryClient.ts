import { REGISTRY_URL } from "./config.js";

export type RegistryAgent = {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  baseUrl: string;
  payTo: string;
  suggestedPrice?: string;
  network: "stellar:testnet" | "stellar:mainnet";
  metadata?: Record<string, unknown>;
  registeredAt: string;
  updatedAt: string;
};

export async function listAgents(): Promise<RegistryAgent[]> {
  const res = await fetch(`${REGISTRY_URL}/v1/agents`);
  if (!res.ok) throw new Error(`registry list failed: ${res.status}`);
  const data = (await res.json()) as { agents: RegistryAgent[] };
  return data.agents ?? [];
}

export async function getAgent(id: string): Promise<RegistryAgent | null> {
  const res = await fetch(`${REGISTRY_URL}/v1/agents/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`registry get failed: ${res.status}`);
  return (await res.json()) as RegistryAgent;
}

export async function searchByCapability(q: string): Promise<RegistryAgent[]> {
  const res = await fetch(
    `${REGISTRY_URL}/v1/agents/search/capability/${encodeURIComponent(q)}`,
  );
  if (!res.ok) throw new Error(`registry search failed: ${res.status}`);
  const data = (await res.json()) as { agents: RegistryAgent[] };
  return data.agents ?? [];
}
