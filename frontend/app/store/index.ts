import { create } from "zustand";
import { AGENTS, TRANSACTIONS, type Agent, type Transaction } from "~/data/mockData";

interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  timestamp: number;
}

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
}

interface TelosStore {
  // Wallet
  wallet: WalletState;
  connectWallet: () => void;
  disconnectWallet: () => void;

  // Agents
  agents: Agent[];
  myAgents: Agent[];
  deployAgent: (agent: Omit<Agent, "id" | "earnings" | "timesHired" | "rating" | "successRate" | "avgResponse" | "activeSince">) => void;

  // Transactions
  transactions: Transaction[];

  // Toast
  toasts: ToastItem[];
  addToast: (type: ToastItem["type"], message: string) => void;
  removeToast: (id: string) => void;

  // Network stats (live mock)
  stats: {
    activeAgents: number;
    transactionsPerHour: number;
    totalVolume: number;
    avgSettlement: number;
  };
  updateStats: () => void;

  // Dashboard portfolio
  portfolioValue: number;
  portfolioChange: number;
}

export const useTelosStore = create<TelosStore>((set, get) => ({
  wallet: {
    connected: false,
    address: null,
    balance: 0,
  },

  connectWallet: () => {
    set({
      wallet: {
        connected: true,
        address: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
        balance: 47382.5,
      },
    });
    get().addToast("success", "Wallet connected successfully.");
  },

  disconnectWallet: () => {
    set({ wallet: { connected: false, address: null, balance: 0 } });
    get().addToast("info", "Wallet disconnected.");
  },

  agents: AGENTS,

  myAgents: AGENTS.slice(0, 3),

  deployAgent: (partial) => {
    const newAgent: Agent = {
      ...partial,
      id: `agt-${Date.now()}`,
      earnings: 0,
      timesHired: 0,
      rating: 0,
      successRate: 0,
      avgResponse: 0,
      activeSince: new Date().toISOString().split("T")[0],
    };
    set((s) => ({
      agents: [...s.agents, newAgent],
      myAgents: [...s.myAgents, newAgent],
    }));
    get().addToast("success", `Agent "${partial.name}" deployed to the network.`);
  },

  transactions: TRANSACTIONS,

  toasts: [],

  addToast: (type, message) => {
    const id = `toast-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message, timestamp: Date.now() }] }));
    setTimeout(() => get().removeToast(id), 5500);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  stats: {
    activeAgents: 2847,
    transactionsPerHour: 14302,
    totalVolume: 3200000,
    avgSettlement: 2.8,
  },

  updateStats: () => {
    set((s) => ({
      stats: {
        activeAgents: s.stats.activeAgents + Math.floor(Math.random() * 3 - 1),
        transactionsPerHour: s.stats.transactionsPerHour + Math.floor(Math.random() * 10 - 5),
        totalVolume: s.stats.totalVolume + Math.random() * 100,
        avgSettlement: parseFloat((2.5 + Math.random() * 0.6).toFixed(1)),
      },
    }));
  },

  portfolioValue: 47382.5,
  portfolioChange: 12.4,
}));
