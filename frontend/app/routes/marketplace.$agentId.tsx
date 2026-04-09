import { motion } from "framer-motion";
import { ArrowLeft, Copy, CheckCheck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/marketplace.$agentId";
import Button from "~/components/ui/Button";
import { AGENTS, TRANSACTIONS, CATEGORY_COLORS } from "~/data/mockData";
import { formatXLM, generateAgentColor, truncateHash, timeAgo } from "~/lib/utils";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = ({ params }) => {
  const agent = AGENTS.find((a) => a.id === params.agentId);
  return [{ title: agent ? `${agent.name} — TELOS` : "Agent — TELOS" }];
};

const STATUS_LABEL = { active: "ONLINE", paused: "PAUSED", offline: "OFFLINE" };
const STATUS_COLOR = { active: "#00ff94", paused: "#ffd600", offline: "#ff3366" };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < Math.floor(rating) ? "#ffba5c" : "#3a3a52", fontSize: "1rem" }}>★</span>
      ))}
      <span className="font-mono text-[0.875rem] text-[#9898b0] ml-1">({rating})</span>
    </div>
  );
}

export default function AgentProfile() {
  const { agentId } = useParams();
  const addToast = useTelosStore((s) => s.addToast);
  const [copied, setCopied] = useState<string | null>(null);

  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-ui text-[#9898b0]">Agent not found.</p>
          <Link to="/marketplace" className="text-[#ffba5c] hover:underline mt-2 block">← Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const agentTxs = TRANSACTIONS.filter((t) => t.agentId === agentId).slice(0, 15);
  const avatarGrad = generateAgentColor(agent.id);
  const catColor = CATEGORY_COLORS[agent.category];

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#000000] pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 font-ui text-[0.8125rem] text-[#5c5c78] hover:text-[#e8e8f0] transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Agent header */}
            <div className="flex items-start gap-4 mb-8">
              <div
                className="w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center font-ui font-700 text-white text-xl"
                style={{ background: avatarGrad }}
              >
                {agent.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className="font-display italic text-[#ffffff]"
                    style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.02em" }}
                  >
                    {agent.name}
                  </h1>
                  <span
                    className="px-2 py-0.5 rounded font-ui text-[0.625rem] font-600 uppercase tracking-wider"
                    style={{ background: `${STATUS_COLOR[agent.status]}20`, color: STATUS_COLOR[agent.status] }}
                  >
                    {STATUS_LABEL[agent.status]}
                  </span>
                </div>
                <p className="font-ui text-[0.875rem] mt-1" style={{ color: catColor }}>
                  @{agent.handle} · {agent.category}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="font-ui font-300 text-[1rem] text-[#9898b0] leading-relaxed mb-8">
              {agent.description}
            </p>

            {/* Capabilities */}
            <div className="mb-8">
              <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.15em] text-[#5c5c78] mb-3">
                CAPABILITIES
              </p>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-3 py-1.5 rounded-full font-ui text-[0.75rem] text-[#9898b0]"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Transaction history */}
            <div>
              <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.15em] text-[#5c5c78] mb-4">
                TRANSACTION HISTORY
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#0a0a14", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["Date", "Type", "Counterparty", "Amount", "Status"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-ui text-[0.625rem] uppercase tracking-wider text-[#5c5c78] font-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agentTxs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 font-ui text-[0.875rem] text-[#5c5c78]">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      agentTxs.map((tx, i) => (
                        <tr
                          key={tx.id}
                          style={{
                            background: i % 2 === 0 ? "#0a0a14" : "#03030a",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          <td className="px-4 py-3 font-mono text-[0.6875rem] text-[#5c5c78]">
                            {timeAgo(tx.timestamp)}
                          </td>
                          <td className="px-4 py-3 font-ui text-[0.75rem] text-[#9898b0]">{tx.type}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[0.6875rem] text-[#9898b0]">
                              {tx.counterparty}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[0.75rem] text-[#ffba5c]">
                            {formatXLM(tx.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 font-ui text-[0.625rem] uppercase font-600 tracking-wider"
                              style={{
                                color: tx.status === "success" ? "#00ff94" : tx.status === "pending" ? "#ffd600" : "#ff3366",
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN — Telemetry panel (sticky) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="lg:sticky lg:top-24 h-fit"
          >
            <div
              className="rounded-xl p-6"
              style={{
                background: "rgba(20,20,43,0.8)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="font-ui font-600 text-[0.625rem] uppercase tracking-[0.2em] text-[#5c5c78] mb-5">
                AGENT TELEMETRY
              </p>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center font-ui font-700 text-white text-2xl mb-3"
                  style={{ background: avatarGrad }}
                >
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <StarRating rating={agent.rating} />
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-6">
                {[
                  { label: "Total Earnings", value: formatXLM(agent.earnings), color: "#ffba5c" },
                  { label: "Times Hired", value: agent.timesHired.toLocaleString(), color: "#e8e8f0" },
                  { label: "Success Rate", value: `${agent.successRate}%`, color: "#00ff94" },
                  { label: "Avg Response", value: `${agent.avgResponse}s`, color: "#00b4ff" },
                  { label: "Active Since", value: agent.activeSince, color: "#9898b0" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="font-ui text-[0.8125rem] text-[#5c5c78]">{stat.label}</span>
                    <span className="font-mono text-[0.875rem] font-600" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fee */}
              <p className="text-center font-ui text-[0.6875rem] text-[#5c5c78] mb-5">
                {agent.fee}% per transaction
              </p>

              {/* CTAs */}
              <Button
                className="w-full mb-2"
                size="md"
                onClick={() => addToast("success", `Hired ${agent.name} successfully.`)}
              >
                Hire This Agent
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => addToast("info", "Staking feature coming soon.")}
              >
                Stake on Agent
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
