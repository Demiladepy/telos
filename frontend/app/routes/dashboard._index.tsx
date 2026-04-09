import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/dashboard._index";
import Button from "~/components/ui/Button";
import { CATEGORY_COLORS } from "~/data/mockData";
import { formatXLM, timeAgo } from "~/lib/utils";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "Overview — TELOS Dashboard" }];

/* --- Sparkline (tiny SVG line chart) --- */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const W = 60, H = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity={0.8}
      />
    </svg>
  );
}

/* --- Metric Card --- */
function MetricCard({
  label,
  value,
  change,
  sparkData,
  delay = 0,
}: {
  label: string;
  value: string;
  change: number;
  sparkData: number[];
  delay?: number;
}) {
  const positive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100, damping: 20 }}
      className="p-5 rounded-xl"
      style={{ background: "#14142b", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p className="font-ui text-[0.6875rem] uppercase tracking-wider text-[#5c5c78] mb-2">{label}</p>
      <p className="font-mono text-[1.75rem] font-600 text-[#e8e8f0] leading-none mb-2">{value}</p>
      <div className="flex items-center justify-between">
        <span
          className="flex items-center gap-1 font-ui text-[0.75rem]"
          style={{ color: positive ? "#00ff94" : "#ff3366" }}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {positive ? "+" : ""}{change}%
        </span>
        <Sparkline data={sparkData} color={positive ? "#00ff94" : "#ff3366"} />
      </div>
    </motion.div>
  );
}

function generateSparkData(trend: "up" | "down" | "flat" = "up") {
  return Array.from({ length: 7 }, (_, i) => {
    const base = 50;
    const noise = (Math.random() - 0.5) * 20;
    const trend_val = trend === "up" ? i * 4 : trend === "down" ? -i * 3 : 0;
    return Math.max(10, base + noise + trend_val);
  });
}

/* --- Area chart (portfolio) --- */
function PortfolioChart() {
  const [activeRange, setActiveRange] = useState("1W");
  const ranges = ["1D", "1W", "1M", "3M", "All"];

  // Generate mock data
  const data = Array.from({ length: 30 }, (_, i) => ({
    x: i,
    y: 35000 + Math.sin(i * 0.4) * 5000 + i * 400 + Math.random() * 2000,
  }));

  const W = 100, H = 60;
  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));

  const pts = data.map((d) => ({
    x: (d.x / (data.length - 1)) * W,
    y: H - ((d.y - minY) / (maxY - minY)) * H * 0.9 - H * 0.05,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${H} L0,${H} Z`;

  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: "#14142b", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-ui text-[0.6875rem] uppercase tracking-wider text-[#5c5c78]">Portfolio Value</p>
          <p className="font-mono text-[1.75rem] font-600 text-[#e8e8f0]">₮47,382.50</p>
        </div>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className="px-2.5 py-1 rounded font-ui text-[0.6875rem] font-500 transition-all"
              style={
                activeRange === r
                  ? { background: "rgba(255,107,0,0.15)", color: "#ffba5c", border: "1px solid rgba(255,107,0,0.3)" }
                  : { background: "transparent", color: "#5c5c78", border: "1px solid transparent" }
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </linearGradient>
          {/* Grid lines */}
        </defs>
        {/* Area fill */}
        <path d={areaPath} fill="url(#area-fill)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#ff9500" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

export default function DashboardIndex() {
  const { myAgents, transactions, wallet } = useTelosStore();
  const recentTxs = transactions.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="font-ui text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500]">COMMAND CENTER</p>
        <h1 className="font-display italic text-[#ffffff] mt-1" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
          Overview
        </h1>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Portfolio Value" value="₮47,382" change={12.4} sparkData={generateSparkData("up")} delay={0} />
        <MetricCard label="Total Earnings" value="₮8,420" change={5.2} sparkData={generateSparkData("up")} delay={0.05} />
        <MetricCard label="Active Agents" value="3" change={0} sparkData={generateSparkData("flat")} delay={0.1} />
        <MetricCard label="Transactions" value="1,847" change={-2.1} sparkData={generateSparkData("down")} delay={0.15} />
      </div>

      {/* Portfolio chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PortfolioChart />
      </motion.div>

      {/* Bottom two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-5 rounded-xl"
          style={{ background: "#14142b", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-ui font-600 text-[0.875rem] text-[#e8e8f0]">Active Agents</p>
            <Link to="/dashboard/agents">
              <Button variant="ghost" size="sm" className="gap-1 text-[0.75rem]">
                All <ArrowRight size={12} />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {myAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-ui font-700 text-white text-xs"
                  style={{ background: CATEGORY_COLORS[agent.category] + "40", border: `1px solid ${CATEGORY_COLORS[agent.category]}40` }}
                >
                  {agent.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui font-500 text-[0.8125rem] text-[#e8e8f0] truncate">{agent.name}</p>
                  <p className="font-mono text-[0.625rem] text-[#5c5c78]">{formatXLM(agent.earnings)} earned</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: agent.status === "active" ? "#00ff94" : agent.status === "paused" ? "#ffd600" : "#ff3366",
                    }}
                  />
                  <span className="font-ui text-[0.625rem] uppercase text-[#5c5c78]">{agent.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-xl"
          style={{ background: "#14142b", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-ui font-600 text-[0.875rem] text-[#e8e8f0]">Recent Transactions</p>
            <Link to="/dashboard/transactions">
              <Button variant="ghost" size="sm" className="gap-1 text-[0.75rem]">
                All <ArrowRight size={12} />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {recentTxs.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <Clock size={12} className="text-[#5c5c78] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-[0.8125rem] text-[#9898b0] truncate">
                    {tx.type} — {tx.counterparty}
                  </p>
                  <p className="font-mono text-[0.625rem] text-[#5c5c78]">{timeAgo(tx.timestamp)}</p>
                </div>
                <span className="font-mono text-[0.8125rem] text-[#ffba5c] shrink-0">
                  {formatXLM(tx.amount)}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: tx.status === "success" ? "#00ff94" : tx.status === "pending" ? "#ffd600" : "#ff3366",
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
