import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pause, Play, Settings2, Wallet, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/dashboard.agents";
import Button from "~/components/ui/Button";
import StarLogo from "~/components/StarLogo";
import { CATEGORY_COLORS, type Agent } from "~/data/mockData";
import { formatXLM } from "~/lib/utils";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "My Agents — TELOS Dashboard" }];

function AgentDashCard({ agent, onAction }: { agent: Agent; onAction: (type: string, a: Agent) => void }) {
  const catColor = CATEGORY_COLORS[agent.category];
  // Mock sparkline
  const spark = Array.from({ length: 7 }, () => Math.random() * 100);
  const W = 80, H = 28;
  const min = Math.min(...spark), max = Math.max(...spark);
  const pts = spark.map((v, i) => `${(i / (spark.length - 1)) * W},${H - ((v - min) / (max - min || 1)) * H * 0.9 - H * 0.05}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="p-5 rounded-xl"
      style={{ background: "#14142b", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Category bar */}
      <div className="h-0.5 rounded-full mb-4" style={{ background: catColor }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-ui font-700 text-white text-xs"
            style={{ background: catColor + "30", border: `1px solid ${catColor}50` }}
          >
            {agent.name.slice(0, 2)}
          </div>
          <div>
            <p className="font-ui font-600 text-[0.9rem] text-[#e8e8f0]">{agent.name}</p>
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: agent.status === "active" ? "#00ff94" : agent.status === "paused" ? "#ffd600" : "#ff3366" }}
              />
              <span className="font-ui text-[0.625rem] uppercase tracking-wider text-[#5c5c78]">
                {agent.status}
              </span>
            </div>
          </div>
        </div>
        {/* Spark */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polyline points={pts.join(" ")} fill="none" stroke={catColor} strokeWidth="1.5" opacity={0.7} />
        </svg>
      </div>

      {/* Earnings */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2.5 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="font-mono text-[1rem] font-600 text-[#ffba5c]">{formatXLM(agent.earnings)}</p>
          <p className="font-ui text-[0.625rem] uppercase text-[#5c5c78] mt-0.5">Total Earned</p>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="font-mono text-[1rem] font-600 text-[#00ff94]">+{formatXLM(agent.earnings * 0.04)}</p>
          <p className="font-ui text-[0.625rem] uppercase text-[#5c5c78] mt-0.5">24h Earnings</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onAction(agent.status === "active" ? "pause" : "resume", agent)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-ui text-[0.6875rem] text-[#9898b0] hover:text-[#e8e8f0] transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {agent.status === "active" ? <Pause size={11} /> : <Play size={11} />}
          {agent.status === "active" ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => onAction("withdraw", agent)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-ui text-[0.6875rem] text-[#9898b0] hover:text-[#ffba5c] transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Wallet size={11} /> Withdraw
        </button>
        <button
          onClick={() => onAction("config", agent)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-ui text-[0.6875rem] text-[#9898b0] hover:text-[#e8e8f0] transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Settings2 size={11} /> Configure
        </button>
        <button
          onClick={() => onAction("terminate", agent)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-ui text-[0.6875rem] text-[#9898b0] hover:text-[#ff3366] transition-colors ml-auto"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  );
}

export default function DashboardAgents() {
  const { myAgents, addToast } = useTelosStore();

  const handleAction = (type: string, agent: Agent) => {
    const msgs: Record<string, string> = {
      pause: `${agent.name} paused.`,
      resume: `${agent.name} resumed.`,
      withdraw: `Earnings withdrawn for ${agent.name}.`,
      config: `Opening configuration for ${agent.name}.`,
      terminate: `${agent.name} terminated.`,
    };
    addToast(type === "terminate" ? "error" : type === "withdraw" ? "success" : "info", msgs[type]);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <p className="font-ui text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500]">MANAGEMENT</p>
          <h1 className="font-display italic text-[#ffffff] mt-1" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
            My Agents
          </h1>
        </div>
        <Link to="/deploy">
          <Button className="gap-2">
            <Plus size={14} /> Deploy New
          </Button>
        </Link>
      </motion.div>

      {myAgents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 flex flex-col items-center gap-6"
        >
          <StarLogo size={80} animate />
          <div>
            <p className="font-ui font-600 text-[#e8e8f0] text-xl mb-2">No agents deployed yet</p>
            <p className="font-ui font-300 text-[#9898b0]">Deploy your first agent and watch it earn.</p>
          </div>
          <Link to="/deploy">
            <Button size="lg" className="gap-2">
              Deploy Agent <Plus size={16} />
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {myAgents.map((agent) => (
              <AgentDashCard key={agent.id} agent={agent} onAction={handleAction} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
