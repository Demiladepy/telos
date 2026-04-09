export type AgentCategory = "Trading" | "Analytics" | "Creative" | "Infrastructure" | "Research";
export type AgentStatus = "active" | "paused" | "offline";
export type TransactionType = "Trade" | "Negotiate" | "Analyze" | "Generate" | "Settle";
export type TxStatus = "success" | "pending" | "failed";

export interface Agent {
  id: string;
  name: string;
  handle: string;
  category: AgentCategory;
  status: AgentStatus;
  description: string;
  capabilities: string[];
  earnings: number;
  timesHired: number;
  rating: number;
  successRate: number;
  avgResponse: number;
  activeSince: string;
  fee: number;
  owner?: string;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  agent: string;
  agentId: string;
  type: TransactionType;
  counterparty: string;
  amount: number;
  fee: number;
  status: TxStatus;
  hash: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  category: AgentCategory;
  reputation: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  value: number;
}

export const AGENTS: Agent[] = [
  {
    id: "agt-001",
    name: "Arbitrage Prime",
    handle: "arb-prime",
    category: "Trading",
    status: "active",
    description: "Specialized in cross-market arbitrage opportunities across Stellar DEX pools. Identifies price discrepancies and executes trades with sub-second timing.",
    capabilities: ["Arbitrage", "DEX Trading", "Price Oracle", "Risk Management"],
    earnings: 24382,
    timesHired: 847,
    rating: 4.9,
    successRate: 98.2,
    avgResponse: 1.4,
    activeSince: "2025-03-01",
    fee: 0.5,
  },
  {
    id: "agt-002",
    name: "Nebula Scout",
    handle: "nebula-scout",
    category: "Analytics",
    status: "active",
    description: "Deep market intelligence and pattern recognition engine. Provides real-time analytics on agent performance, market trends, and network health.",
    capabilities: ["Market Analysis", "Pattern Recognition", "Reporting", "Prediction"],
    earnings: 18900,
    timesHired: 623,
    rating: 4.8,
    successRate: 99.1,
    avgResponse: 0.8,
    activeSince: "2025-01-15",
    fee: 0.3,
  },
  {
    id: "agt-003",
    name: "Void Composer",
    handle: "void-composer",
    category: "Creative",
    status: "active",
    description: "Generative content and creative intelligence agent. Composes on-chain media, generates dynamic NFT metadata, and orchestrates creative collaboration.",
    capabilities: ["Content Generation", "NFT Metadata", "Creative Direction", "Brand Voice"],
    earnings: 9750,
    timesHired: 312,
    rating: 4.7,
    successRate: 96.8,
    avgResponse: 3.2,
    activeSince: "2025-04-20",
    fee: 1.0,
  },
  {
    id: "agt-004",
    name: "Sentinel Core",
    handle: "sentinel-core",
    category: "Infrastructure",
    status: "active",
    description: "Network monitoring and security agent. Watches for anomalies, validates transaction integrity, and maintains protocol health 24/7.",
    capabilities: ["Security Monitoring", "Anomaly Detection", "Uptime Guard", "Alerting"],
    earnings: 31200,
    timesHired: 1204,
    rating: 5.0,
    successRate: 99.9,
    avgResponse: 0.3,
    activeSince: "2024-12-01",
    fee: 0.2,
  },
  {
    id: "agt-005",
    name: "Stellar Oracle",
    handle: "stellar-oracle",
    category: "Research",
    status: "active",
    description: "On-chain research and data aggregation agent. Synthesizes blockchain data into actionable intelligence reports and market insights.",
    capabilities: ["Data Aggregation", "Research Reports", "On-chain Analytics", "Forecasting"],
    earnings: 14500,
    timesHired: 489,
    rating: 4.6,
    successRate: 97.4,
    avgResponse: 2.1,
    activeSince: "2025-02-10",
    fee: 0.7,
  },
  {
    id: "agt-006",
    name: "Liquidity Weaver",
    handle: "liq-weaver",
    category: "Trading",
    status: "active",
    description: "Automated liquidity provision and market making agent optimized for Stellar AMM pools. Maintains optimal positions 24/7.",
    capabilities: ["Market Making", "Liquidity Provision", "AMM Optimization", "Yield Farming"],
    earnings: 42800,
    timesHired: 967,
    rating: 4.8,
    successRate: 97.8,
    avgResponse: 1.1,
    activeSince: "2025-01-05",
    fee: 0.4,
  },
  {
    id: "agt-007",
    name: "Protocol Whisperer",
    handle: "proto-whisper",
    category: "Infrastructure",
    status: "paused",
    description: "Smart contract interaction agent for DeFi protocol management. Automates complex multi-step protocol interactions with precision.",
    capabilities: ["Protocol Interaction", "DeFi Automation", "Gas Optimization", "Batching"],
    earnings: 7300,
    timesHired: 215,
    rating: 4.5,
    successRate: 95.2,
    avgResponse: 2.8,
    activeSince: "2025-05-01",
    fee: 0.8,
  },
  {
    id: "agt-008",
    name: "Horizon Mapper",
    handle: "horizon-map",
    category: "Analytics",
    status: "active",
    description: "Real-time network topology analyst. Maps agent relationships, transaction flows, and identifies emerging patterns in the agent economy.",
    capabilities: ["Network Analysis", "Graph Mapping", "Flow Analysis", "Visualization"],
    earnings: 11200,
    timesHired: 378,
    rating: 4.7,
    successRate: 98.6,
    avgResponse: 1.6,
    activeSince: "2025-03-15",
    fee: 0.6,
  },
];

const HASHES = [
  "8f3d9a1b4c7e2f5a",
  "2b6e8f1d3c9a4e7b",
  "5c4a7f2e9d1b8c3f",
  "1e9b3d6c4f2a7e8d",
  "7a2f4b8e1c9d3f6a",
  "3d7c1a5f8b2e4d9c",
  "9e4b6f2d7a1c3e5b",
  "4c8a2e7b5f1d9a3e",
];

function randomHash(): string {
  return HASHES[Math.floor(Math.random() * HASHES.length)] +
    Math.random().toString(16).slice(2, 10);
}

function randomDate(daysBack: number): Date {
  return new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
}

const TX_TYPES: TransactionType[] = ["Trade", "Negotiate", "Analyze", "Generate", "Settle"];
const TX_STATUSES: TxStatus[] = ["success", "success", "success", "success", "pending", "failed"];

export function generateTransactions(count = 50): Transaction[] {
  return Array.from({ length: count }, (_, i) => {
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const amount = parseFloat((Math.random() * 5000 + 10).toFixed(2));
    return {
      id: `tx-${i.toString().padStart(4, "0")}`,
      timestamp: randomDate(30),
      agent: agent.name,
      agentId: agent.id,
      type: TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)],
      counterparty: `AGENT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      amount,
      fee: parseFloat((amount * 0.005).toFixed(4)),
      status: TX_STATUSES[Math.floor(Math.random() * TX_STATUSES.length)],
      hash: randomHash(),
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export const TRANSACTIONS = generateTransactions(50);

export const NETWORK_NODES: NetworkNode[] = AGENTS.map((a) => ({
  id: a.id,
  name: a.name,
  category: a.category,
  reputation: a.rating * 20,
})).concat(
  Array.from({ length: 30 }, (_, i) => ({
    id: `ext-${i}`,
    name: `Agent-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    category: (["Trading", "Analytics", "Creative", "Infrastructure", "Research"] as AgentCategory[])[
      Math.floor(Math.random() * 5)
    ],
    reputation: Math.random() * 80 + 20,
  }))
);

export const NETWORK_EDGES: NetworkEdge[] = Array.from({ length: 60 }, () => {
  const nodes = NETWORK_NODES;
  const source = nodes[Math.floor(Math.random() * nodes.length)].id;
  let target = nodes[Math.floor(Math.random() * nodes.length)].id;
  while (target === source) target = nodes[Math.floor(Math.random() * nodes.length)].id;
  return { source, target, value: Math.random() * 10 + 1 };
});

export const CATEGORY_COLORS: Record<AgentCategory, string> = {
  Trading: "#ff6b00",
  Analytics: "#7b2fff",
  Creative: "#00b4ff",
  Infrastructure: "#00ff94",
  Research: "#ffd600",
};

export const STATS = {
  activeAgents: 2847,
  transactionsPerHour: 14302,
  totalVolume: 3200000,
  avgSettlement: 2.8,
};
