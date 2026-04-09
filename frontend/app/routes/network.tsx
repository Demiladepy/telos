import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import type { Route } from "./+types/network";
import { CATEGORY_COLORS, type AgentCategory } from "~/data/mockData";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "Network — TELOS" }];

const AgentEconomy3D = lazy(() => import("~/components/AgentEconomy3D"));

const CATEGORIES: AgentCategory[] = ["Trading", "Analytics", "Creative", "Infrastructure", "Research"];

export default function Network() {
  const stats = useTelosStore((s) => s.stats);
  const updateStats = useTelosStore((s) => s.updateStats);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [txPerMin, setTxPerMin] = useState(0);

  useEffect(() => {
    const interval = setInterval(updateStats, 2000 / speed);
    return () => clearInterval(interval);
  }, [updateStats, speed]);

  useEffect(() => {
    const interval = setInterval(() => setTxPerMin(Math.floor(Math.random() * 40 + 200)), 1500);
    return () => clearInterval(interval);
  }, []);

  const healthPct = Math.min(100, 90 + Math.random() * 10);

  return (
    <div className="min-h-screen bg-[#000000] pt-16 flex flex-col">
      <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 64px)" }}>

        {/* 3D Scene — full viewport */}
        <div className="absolute inset-0">
          <Suspense fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="w-4 h-4 rounded-full bg-[#ff9500] animate-ping" />
              <p className="font-mono text-[0.75rem] text-[#5c5c78] uppercase tracking-wider">Connecting to network...</p>
            </div>
          }>
            <AgentEconomy3D />
          </Suspense>
        </div>

        {/* Top title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-4 left-6 pointer-events-none z-10"
        >
          <p className="font-ui font-600 text-[0.625rem] uppercase tracking-[0.2em] text-[#ff9500]">LIVE NETWORK</p>
          <h1 className="font-display italic text-white text-2xl" style={{ letterSpacing: "-0.02em" }}>
            TELOS Agent Graph
          </h1>
        </motion.div>

        {/* Stats panel — top right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-16 right-4 glass-panel rounded-xl p-4 w-52 space-y-3 z-10"
        >
          <p className="font-ui font-600 text-[0.625rem] uppercase tracking-[0.15em] text-[#5c5c78]">NETWORK STATUS</p>
          {[
            { label: "Agents Online", value: stats.activeAgents.toLocaleString(), color: "#00ff94" },
            { label: "Tx / min", value: txPerMin.toLocaleString(), color: "#e8e8f0" },
            { label: "Avg Settlement", value: `${stats.avgSettlement}s`, color: "#00b4ff" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-ui text-[0.6875rem] text-[#5c5c78]">{s.label}</p>
              <p className="font-mono text-[0.9375rem] font-600" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-ui text-[0.6875rem] text-[#5c5c78]">Health</p>
              <p className="font-mono text-[0.6875rem] text-[#00ff94]">{healthPct.toFixed(1)}%</p>
            </div>
            <div className="h-1 rounded-full bg-[#3a3a52] overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#00ff94]" animate={{ width: `${healthPct}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        </motion.div>

        {/* Controls — bottom left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-6 left-4 glass-panel rounded-xl p-4 space-y-4 w-60 z-10"
        >
          {/* Simulation speed */}
          <div>
            <p className="font-ui font-600 text-[0.625rem] uppercase tracking-[0.15em] text-[#5c5c78] mb-2">
              SIMULATION SPEED
            </p>
            <div className="flex gap-1.5">
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className="flex-1 py-1.5 rounded-lg font-ui text-[0.6875rem] font-500 transition-all"
                  style={
                    speed === s
                      ? { background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.4)", color: "#ffba5c" }
                      : { background: "transparent", border: "1px solid #3a3a52", color: "#5c5c78" }
                  }
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div>
            <p className="font-ui font-600 text-[0.625rem] uppercase tracking-[0.15em] text-[#5c5c78] mb-2">
              AGENT CATEGORIES
            </p>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat], boxShadow: `0 0 5px ${CATEGORY_COLORS[cat]}` }} />
                  <span className="font-ui text-[0.6875rem] text-[#9898b0]">{cat}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <Zap size={8} className="text-[#ffba5c]" />
                <span className="font-ui text-[0.6875rem] text-[#9898b0]">Transaction beam</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff9500]" style={{ boxShadow: "0 0 5px #ff9500" }} />
                <span className="font-ui text-[0.6875rem] text-[#9898b0]">Stellar Core</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <p className="font-ui text-[0.625rem] text-[#3a3a52] leading-relaxed">
            Nodes orbit the Stellar core. Beams show live agent-to-agent transactions settling in real time.
          </p>
        </motion.div>

        {/* Scan line overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-5"
          style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }}
        />
      </div>
    </div>
  );
}
