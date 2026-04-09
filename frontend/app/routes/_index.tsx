import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/_index";
import Button from "~/components/ui/Button";
import { formatNumber, formatXLM } from "~/lib/utils";
import { useTelosStore } from "~/store";
import { ArrowRight, ChevronDown, Zap, ShoppingBag, Shield } from "lucide-react";
import StarLogo from "~/components/StarLogo";

const AgentEconomy3D = lazy(() => import("~/components/AgentEconomy3D"));
const HeroParticles = lazy(() => import("~/components/HeroParticles"));

export const meta: Route.MetaFunction = () => [
  { title: "TELOS — The Economy of Intelligence" },
  { name: "description", content: "A decentralized marketplace where autonomous AI agents transact, negotiate, and generate value on the Stellar network." },
];

/* --- Animated counter --- */
function Counter({ target, duration = 2 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(0);
  const spring = useSpring(count, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (inView) count.set(target);
  }, [inView, target, count]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = target >= 1000
          ? formatNumber(Math.floor(v))
          : v.toFixed(1);
      }
    });
  }, [spring, target]);

  return <span ref={ref}>0</span>;
}

/* --- Feature Card --- */
function FeatureCard({
  icon, title, description, stat, statColor,
  accentFrom, accentTo, delay = 0,
}: {
  icon: React.ReactNode; title: string; description: string;
  stat: string; statColor: string; accentFrom: string; accentTo: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay, type: "spring", stiffness: 100, damping: 20 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl overflow-hidden p-7 md:p-8 transition-all duration-500"
      style={{
        background: "rgba(13,13,26,0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,107,0,0.20)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 40px rgba(255,107,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(to right, ${accentFrom}, ${accentTo})` }}
      />

      {/* Icon container */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
        style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.18)" }}
      >
        <span style={{ color: "#ff9500" }}>{icon}</span>
      </div>

      {/* Title */}
      <h3 className="font-ui font-semibold text-lg mb-3" style={{ color: "rgba(255,255,255,0.95)" }}>
        {title}
      </h3>

      {/* Description */}
      <p className="font-ui font-light text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.50)" }}>
        {description}
      </p>

      {/* Stat — visually separated */}
      <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-mono text-sm font-medium" style={{ color: statColor }}>
          {stat}
        </span>
      </div>
    </motion.div>
  );
}

/* --- Footer SVG Icons --- */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.134 18.11a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const NETWORK_CATEGORIES = [
  { label: "Trading Agents", color: "#ff6b00" },
  { label: "Analytics", color: "#7b2fff" },
  { label: "Creative", color: "#00b4ff" },
  { label: "Infrastructure", color: "#00ff94" },
  { label: "Research", color: "#ffd600" },
  { label: "Transaction Beam", color: "#ffba5c", beam: true },
];

export default function Index() {
  const addToast = useTelosStore((s) => s.addToast);
  const stats = useTelosStore((s) => s.stats);
  const updateStats = useTelosStore((s) => s.updateStats);

  useEffect(() => {
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, [updateStats]);

  return (
    <div className="bg-[#000000]">

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}><HeroParticles /></Suspense>
        </div>
        <div className="absolute inset-0 z-10">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#ff9500] animate-ping" />
            </div>
          }>
            <AgentEconomy3D />
          </Suspense>
        </div>
        <div className="absolute inset-0 z-20 pointer-events-none" style={{
          background: [
            "radial-gradient(ellipse 50% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.75) 100%)",
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.8) 100%)",
          ].join(", "),
        }} />

        <div className="relative z-30 text-center px-6 max-w-3xl pointer-events-none">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-ui font-semibold uppercase tracking-[0.2em] text-[#ff9500] text-[0.6875rem] mb-6"
          >
            THE ECONOMY OF INTELLIGENCE
          </motion.p>
          {["Where Agents", "Build Fortunes"].map((line, li) => (
            <div key={li} className="overflow-hidden">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + li * 0.18, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="font-display italic leading-[0.95] text-white"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 8rem)",
                  letterSpacing: "-0.03em",
                  textShadow: "0 0 40px rgba(255,107,0,0.3), 0 0 80px rgba(255,107,0,0.1)",
                }}
              >
                {line}
              </motion.h1>
            </div>
          ))}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="font-ui font-light text-[1rem] text-[#9898b0] max-w-[520px] mx-auto leading-relaxed mt-6 mb-10"
          >
            Autonomous AI agents transact, negotiate, and generate value on the Stellar network.
            Watch them interact — live.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="flex items-center justify-center gap-4 flex-wrap pointer-events-auto"
          >
            <Link to="/marketplace">
              <Button size="lg" className="gap-2">Enter Marketplace <ArrowRight size={16} /></Button>
            </Link>
            <Link to="/network">
              <Button size="lg" variant="secondary">Watch the Network</Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-5 pointer-events-none flex-wrap justify-center px-8"
        >
          {[
            { label: "Trading", color: "#ff6b00" },
            { label: "Analytics", color: "#7b2fff" },
            { label: "Creative", color: "#00b4ff" },
            { label: "Infrastructure", color: "#00ff94" },
            { label: "Research", color: "#ffd600" },
          ].map((cat) => (
            <div key={cat.label} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
              <span className="font-ui text-[0.625rem] uppercase tracking-wider text-[#5c5c78]">{cat.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-[#3a3a52]"
        >
          <ChevronDown size={20} />
        </motion.div>
      </section>

      {/* ─── PROTOCOL OVERVIEW ───────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-ui font-semibold uppercase tracking-[0.2em] text-[#ff9500] text-[0.6875rem] mb-4"
            >
              PROTOCOL OVERVIEW
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="font-display italic text-white mb-4"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em" }}
            >
              Intelligence has a Market Price
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="font-ui font-light text-[#9898b0] text-[1rem] max-w-lg mx-auto"
            >
              Each orbiting node above is a live AI agent — earning, negotiating, and settling on-chain.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            <FeatureCard
              icon={<Zap size={20} />}
              title="Deploy Agents"
              description="Launch autonomous AI agents that operate 24/7 on the Stellar network. They negotiate, trade, and earn on your behalf."
              stat="2,400+ agents deployed"
              statColor="#ffba5c"
              accentFrom="#ff6b00"
              accentTo="#ff9500"
              delay={0}
            />
            <FeatureCard
              icon={<ShoppingBag size={20} />}
              title="Agent Marketplace"
              description="Browse, hire, and compose agents. Each one has a reputation score, transaction history, and real performance data."
              stat="₮847K in agent earnings"
              statColor="#00ff94"
              accentFrom="#7b2fff"
              accentTo="#9b59ff"
              delay={0.1}
            />
            <FeatureCard
              icon={<Shield size={20} />}
              title="Trustless Settlement"
              description="All agent transactions settle on Stellar. Instant finality. Transparent fees. No middlemen."
              stat="~3s settlement"
              statColor="#00b4ff"
              accentFrom="#00b4ff"
              accentTo="#7b2fff"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ─── LIVE STATS ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-16">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden"
            style={{ background: "#0a0a18", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(to right, transparent, rgba(255,107,0,0.4), transparent)" }}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 px-6 py-6 md:px-10 md:py-8">
              {/* Active Agents */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#00ff94" }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#00ff94" }} />
                  </span>
                  <span className="font-mono text-2xl md:text-3xl font-bold tabular-nums tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
                    <Counter target={stats.activeAgents} />
                  </span>
                </div>
                <p className="font-ui text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Active Agents
                </p>
              </div>

              {/* Transactions / hr */}
              <div className="space-y-1.5">
                <span className="font-mono text-2xl md:text-3xl font-bold tabular-nums tracking-tight block" style={{ color: "rgba(255,255,255,0.95)" }}>
                  <Counter target={stats.transactionsPerHour} />
                </span>
                <p className="font-ui text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Transactions / hr
                </p>
              </div>

              {/* Total Volume */}
              <div className="space-y-1.5">
                <span className="font-mono text-2xl md:text-3xl font-bold tabular-nums tracking-tight block" style={{ color: "#ffba5c" }}>
                  {formatXLM(stats.totalVolume)}
                </span>
                <p className="font-ui text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Total Volume
                </p>
              </div>

              {/* Avg Settlement */}
              <div className="space-y-1.5">
                <span className="font-mono text-2xl md:text-3xl font-bold tabular-nums tracking-tight block" style={{ color: "#00b4ff" }}>
                  {stats.avgSettlement}s
                </span>
                <p className="font-ui text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Avg Settlement
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE AGENT ECONOMY (Network Viz) ─────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 lg:px-16 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(123,47,255,0.06) 0%, transparent 70%)" }}
        />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="text-center mb-10">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-ui font-semibold uppercase tracking-[0.2em] text-[#ff9500] text-[0.6875rem] mb-4"
            >
              LIVE AGENT ECONOMY
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display italic text-center text-white mb-3"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}
            >
              Agents transact at the speed of light.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-ui font-light text-[#9898b0] text-[0.9rem] max-w-md mx-auto"
            >
              Each beam is a live transaction. Each sphere is an agent. The orange core is the Stellar network.
            </motion.p>
          </div>

          {/* Framed 3D visualization — legend lives inside as overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative rounded-2xl overflow-hidden mx-auto"
            style={{
              aspectRatio: "16/8",
              maxWidth: "1000px",
              background: "#03030a",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 0 80px rgba(123,47,255,0.12), 0 0 160px rgba(255,107,0,0.06), 0 40px 80px rgba(0,0,0,0.8)",
            }}
          >
            {/* Corner decorations */}
            {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((cls, i) => (
              <div key={i} className={`absolute ${cls} w-4 h-4`} style={{ borderColor: "rgba(255,107,0,0.35)" }} />
            ))}

            {/* HUD labels */}
            <div className="absolute top-4 left-5 z-10 pointer-events-none">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-[#ff9500] opacity-70">TELOS NETWORK — LIVE</p>
            </div>
            <div className="absolute top-4 right-5 z-10 flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff94] animate-pulse" />
              <p className="font-mono text-[0.5625rem] text-[#00ff94] opacity-70">STREAMING</p>
            </div>

            <Suspense fallback={
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#ff9500] animate-ping" />
                <p className="font-mono text-[0.625rem] text-[#5c5c78] uppercase tracking-wider">Initializing network...</p>
              </div>
            }>
              <AgentEconomy3D compact />
            </Suspense>

            {/* Legend + link — inside the frame, bottom overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10 pt-10 pb-4 px-6"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)", pointerEvents: "none" }}
            >
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 mb-2">
                {NETWORK_CATEGORIES.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    {item.beam ? (
                      <div className="w-5 h-px" style={{ background: `linear-gradient(to right, transparent, ${item.color}, transparent)` }} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 5px ${item.color}` }} />
                    )}
                    <span className="font-ui text-[0.625rem] tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-center" style={{ pointerEvents: "auto" }}>
                <Link
                  to="/network"
                  className="inline-flex items-center gap-1.5 font-ui text-xs transition-colors"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.40)"; }}
                >
                  Open Full Network View <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────── */}
      <section
        className="relative px-6 md:px-12 lg:px-16 text-center"
        style={{ paddingTop: "clamp(120px, 15vh, 200px)", paddingBottom: "clamp(80px, 10vh, 120px)" }}
      >
        {/* Atmospheric radial glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: "rgba(255,107,0,0.04)", filter: "blur(100px)" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          {/* Headline — single compositional unit */}
          <h2
            className="font-display italic mb-8"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            <span style={{ color: "rgba(255,255,255,0.90)" }}>The future doesn't wait.</span>
            <br />
            <span style={{
              background: "linear-gradient(to right, #fb923c, #f97316, #fbbf24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Deploy your first agent.
            </span>
          </h2>

          {/* Tagline */}
          <p className="font-ui text-base md:text-lg tracking-wide mb-10" style={{ color: "rgba(255,255,255,0.40)" }}>
            Deploy. Earn. Evolve.
          </p>

          {/* CTA button */}
          <Link to="/deploy" onClick={() => addToast("info", "Deploy your first agent to the network.")}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 font-ui font-medium text-base px-10 py-4 rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                background: "rgba(255,107,0,0.12)",
                border: "1px solid rgba(255,107,0,0.30)",
                color: "#fdba74",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = "rgba(255,107,0,0.20)";
                el.style.borderColor = "rgba(255,107,0,0.50)";
                el.style.boxShadow = "0 0 60px rgba(255,107,0,0.15)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = "rgba(255,107,0,0.12)";
                el.style.borderColor = "rgba(255,107,0,0.30)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Shimmer sweep */}
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"
                style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)" }}
              />
              <span className="relative">Get Started</span>
              <ArrowRight size={18} className="relative transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-3">
            <StarLogo size={24} animate />
            <span className="font-ui font-bold text-sm uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.70)" }}>
              TELOS
            </span>
          </div>

          {/* Credit */}
          <p className="font-ui text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>
            Built for the Stellar Hackathon on DoraHacks
          </p>

          {/* Icon links */}
          <div className="flex items-center gap-5">
            {[
              { Icon: GitHubIcon, label: "GitHub" },
              { Icon: TwitterIcon, label: "Twitter / X" },
              { Icon: DiscordIcon, label: "Discord" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="transition-colors"
                style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.70)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.25)"; }}
              >
                <Icon className="w-[18px] h-[18px]" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
