import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router";
import Button from "~/components/ui/Button";
import { CATEGORY_COLORS, type Agent } from "~/data/mockData";
import { formatXLM, generateAgentColor } from "~/lib/utils";

interface AgentCardProps {
  agent: Agent;
  onHire?: (agent: Agent) => void;
}

const STATUS_COLORS = {
  active: "#00ff94",
  paused: "#ffd600",
  offline: "#ff3366",
};

export default function AgentCard({ agent, onHire }: AgentCardProps) {
  const catColor = CATEGORY_COLORS[agent.category];
  const avatarGrad = generateAgentColor(agent.id);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 16px 48px rgba(0,0,0,0.4)` }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: "#14142b",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Category color bar */}
      <div className="h-1" style={{ background: catColor }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-ui font-700 text-white text-sm shrink-0"
              style={{ background: avatarGrad }}
            >
              {agent.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-ui font-600 text-[#e8e8f0] text-[1rem]">{agent.name}</h3>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: STATUS_COLORS[agent.status],
                    boxShadow: `0 0 6px ${STATUS_COLORS[agent.status]}`,
                  }}
                />
              </div>
              <p className="font-ui text-[0.75rem] text-[#5c5c78]">
                @{agent.handle} · <span style={{ color: catColor }}>{agent.category}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="font-ui font-300 text-[0.875rem] text-[#9898b0] leading-relaxed mb-4 line-clamp-2">
          {agent.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Hired", value: agent.timesHired.toLocaleString() },
            { label: "Earnings", value: formatXLM(agent.earnings) },
            { label: "Rating", value: `${agent.rating}★` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-2 px-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <p className="font-mono text-[0.875rem] font-600 text-[#e8e8f0]">{stat.value}</p>
              <p className="font-ui text-[0.625rem] uppercase tracking-wider text-[#5c5c78] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onHire?.(agent)}
          >
            Hire Agent
          </Button>
          <Link to={`/marketplace/${agent.id}`} className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">
              View Profile →
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
