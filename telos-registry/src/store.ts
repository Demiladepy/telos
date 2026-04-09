import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";
import type { AgentRecord, AgentRegisterInput } from "./types.js";
import { getStellarPublicKey } from "./stellarBootstrap.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "agents.json");

type Persisted = { agents: Record<string, AgentRecord> };

const ONCHAIN_CONTRACT_ID = process.env.TELOS_REGISTRY_CONTRACT_ID?.trim();
const ONCHAIN_SOURCE_ACCOUNT = process.env.TELOS_REGISTRY_SOURCE_ACCOUNT?.trim();
const ONCHAIN_NETWORK = process.env.TELOS_REGISTRY_NETWORK?.trim() || "testnet";

const isOnchainEnabled = Boolean(ONCHAIN_CONTRACT_ID && ONCHAIN_SOURCE_ACCOUNT);

interface ChainProfile {
  owner: string;
  pay_to: string;
  endpoint: string;
  metadata_uri: string;
  updated_at_ledger: number;
}

function hashId(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}

function runStellarInvoke(args: string[], send: boolean): string {
  if (!ONCHAIN_CONTRACT_ID || !ONCHAIN_SOURCE_ACCOUNT) {
    throw new Error("On-chain mode requires TELOS_REGISTRY_CONTRACT_ID and TELOS_REGISTRY_SOURCE_ACCOUNT");
  }

  const baseArgs = [
    "contract",
    "invoke",
    "--id",
    ONCHAIN_CONTRACT_ID,
    "--network",
    ONCHAIN_NETWORK,
    "--source-account",
    ONCHAIN_SOURCE_ACCOUNT,
  ];
  if (send) {
    baseArgs.push("--send", "yes");
  }
  baseArgs.push("--", ...args);

  const result = spawnSync("stellar", baseArgs, {
    shell: false,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    throw new Error(stderr || stdout || "stellar invoke failed");
  }
  return (result.stdout || "").trim();
}

function encodeMetadata(record: AgentRecord): string {
  const payload = {
    id: record.id,
    name: record.name,
    description: record.description,
    capabilities: record.capabilities,
    suggestedPrice: record.suggestedPrice,
    network: record.network,
    metadata: record.metadata,
    registeredAt: record.registeredAt,
    updatedAt: record.updatedAt,
  };
  return `data:application/json,${encodeURIComponent(JSON.stringify(payload))}`;
}

function decodeMetadata(uri: string): Partial<AgentRecord> {
  const prefix = "data:application/json,";
  if (!uri.startsWith(prefix)) return {};
  try {
    const raw = decodeURIComponent(uri.slice(prefix.length));
    return JSON.parse(raw) as Partial<AgentRecord>;
  } catch {
    return {};
  }
}

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Failed to parse JSON from stellar output: ${raw}`);
  }
}

async function listAgentsOnchain(): Promise<AgentRecord[]> {
  const idsRaw = runStellarInvoke(["list_ids"], false);
  const chainIds = parseJson<string[]>(idsRaw);
  const records: AgentRecord[] = [];

  for (const hexId of chainIds) {
    const profileRaw = runStellarInvoke(["get", "--agent_id", hexId], false);
    if (profileRaw === "null") continue;

    const profile = parseJson<ChainProfile>(profileRaw);
    const fromMeta = decodeMetadata(profile.metadata_uri);
    const id = (fromMeta.id || "").trim() || hexId;
    const now = new Date().toISOString();
    const record: AgentRecord = {
      id,
      name: fromMeta.name || id,
      description: fromMeta.description,
      capabilities: Array.isArray(fromMeta.capabilities) && fromMeta.capabilities.length > 0
        ? fromMeta.capabilities
        : ["unknown"],
      baseUrl: profile.endpoint,
      payTo: profile.pay_to,
      suggestedPrice: fromMeta.suggestedPrice,
      network:
        fromMeta.network === "stellar:mainnet" || fromMeta.network === "stellar:testnet"
          ? fromMeta.network
          : "stellar:testnet",
      metadata: fromMeta.metadata,
      registeredAt: fromMeta.registeredAt || now,
      updatedAt: fromMeta.updatedAt || now,
    };
    records.push(record);
  }

  return records.sort((a, b) => a.id.localeCompare(b.id));
}

async function getAgentOnchain(id: string): Promise<AgentRecord | undefined> {
  const hexId = hashId(id);
  const profileRaw = runStellarInvoke(["get", "--agent_id", hexId], false);
  if (profileRaw === "null") return undefined;

  const profile = parseJson<ChainProfile>(profileRaw);
  const fromMeta = decodeMetadata(profile.metadata_uri);
  const now = new Date().toISOString();
  return {
    id,
    name: fromMeta.name || id,
    description: fromMeta.description,
    capabilities: Array.isArray(fromMeta.capabilities) && fromMeta.capabilities.length > 0
      ? fromMeta.capabilities
      : ["unknown"],
    baseUrl: profile.endpoint,
    payTo: profile.pay_to,
    suggestedPrice: fromMeta.suggestedPrice,
    network:
      fromMeta.network === "stellar:mainnet" || fromMeta.network === "stellar:testnet"
        ? fromMeta.network
        : "stellar:testnet",
    metadata: fromMeta.metadata,
    registeredAt: fromMeta.registeredAt || now,
    updatedAt: fromMeta.updatedAt || now,
  };
}

async function upsertAgentOnchain(input: AgentRegisterInput): Promise<AgentRecord> {
  const existing = await getAgentOnchain(input.id);
  const now = new Date().toISOString();
  const record: AgentRecord = {
    ...input,
    registeredAt: existing?.registeredAt ?? now,
    updatedAt: now,
  };
  const metadataUri = encodeMetadata(record);
  const hexId = hashId(record.id);

  if (existing) {
    runStellarInvoke(
      [
        "update",
        "--agent_id",
        hexId,
        "--pay_to",
        record.payTo,
        "--endpoint",
        record.baseUrl,
        "--metadata_uri",
        metadataUri,
      ],
      true,
    );
  } else {
    const owner = getStellarPublicKey(ONCHAIN_SOURCE_ACCOUNT!);
    runStellarInvoke(
      [
        "register",
        "--agent_id",
        hexId,
        "--owner",
        owner,
        "--pay_to",
        record.payTo,
        "--endpoint",
        record.baseUrl,
        "--metadata_uri",
        metadataUri,
      ],
      true,
    );
  }
  return record;
}

async function deleteAgentOnchain(id: string): Promise<boolean> {
  const existing = await getAgentOnchain(id);
  if (!existing) return false;
  runStellarInvoke(["remove", "--agent_id", hashId(id)], true);
  return true;
}

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial: Persisted = { agents: {} };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readAll(): Promise<Persisted> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as Persisted;
  if (!parsed.agents || typeof parsed.agents !== "object") {
    return { agents: {} };
  }
  return parsed;
}

async function writeAll(data: Persisted): Promise<void> {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function listAgents(): Promise<AgentRecord[]> {
  if (isOnchainEnabled) {
    return listAgentsOnchain();
  }
  const { agents } = await readAll();
  return Object.values(agents).sort((a, b) => a.id.localeCompare(b.id));
}

export async function getAgent(id: string): Promise<AgentRecord | undefined> {
  if (isOnchainEnabled) {
    return getAgentOnchain(id);
  }
  const { agents } = await readAll();
  return agents[id];
}

export async function upsertAgent(record: AgentRegisterInput): Promise<AgentRecord> {
  if (isOnchainEnabled) {
    return upsertAgentOnchain(record);
  }
  const data = await readAll();
  const now = new Date().toISOString();
  const existing = data.agents[record.id];
  const next: AgentRecord = {
    ...record,
    registeredAt: existing?.registeredAt ?? now,
    updatedAt: now,
  };
  data.agents[record.id] = next;
  await writeAll(data);
  return next;
}

export async function deleteAgent(id: string): Promise<boolean> {
  if (isOnchainEnabled) {
    return deleteAgentOnchain(id);
  }
  const data = await readAll();
  if (!data.agents[id]) return false;
  delete data.agents[id];
  await writeAll(data);
  return true;
}
