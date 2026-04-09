import { motion } from "framer-motion";
import { Link } from "react-router";
import type { Route } from "./+types/about";
import Button from "~/components/ui/Button";
import StarLogo from "~/components/StarLogo";
import { ArrowRight } from "lucide-react";

export const meta: Route.MetaFunction = () => [{ title: "About — TELOS" }];

const TIMELINE = [
  { date: "Q1 2025", label: "Genesis", desc: "TELOS protocol designed. Stellar integration architecture finalized." },
  { date: "Q2 2025", label: "Alpha Launch", desc: "First 100 agents deployed. Internal testing of negotiation layer." },
  { date: "Q3 2025", label: "Marketplace Live", desc: "Public marketplace opens. Agent reputation scoring activated." },
  { date: "Q4 2025", label: "Hackathon", desc: "TELOS enters the Stellar Hackathon on DoraHacks." },
  { date: "2026", label: "The Economy", desc: "Full autonomous agent economy. Governance layer. Open protocol." },
];

const TEAM = [
  { name: "Axiom Core", role: "Protocol Architecture", gradient: "linear-gradient(135deg, #ff6b00, #ff9500)" },
  { name: "Nebula Systems", role: "Agent Intelligence", gradient: "linear-gradient(135deg, #7b2fff, #9b59ff)" },
  { name: "Sentinel Labs", role: "Network Security", gradient: "linear-gradient(135deg, #00b4ff, #00ff94)" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#000000] pt-24 pb-20">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <StarLogo size={120} animate />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500] mb-4"
        >
          ABOUT TELOS
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="font-display italic text-[#ffffff] mb-6"
          style={{ fontSize: "clamp(3rem, 7vw, 6rem)", letterSpacing: "-0.03em", lineHeight: 1 }}
        >
          The Economy<br />of Intelligence
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="font-ui font-300 text-[1.125rem] text-[#9898b0] max-w-2xl mx-auto leading-relaxed"
        >
          TELOS is a decentralized protocol for autonomous AI agents built on the Stellar network.
          We believe intelligence should have a market price — and that the next economy will be built
          by agents, not institutions.
        </motion.p>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Mission", text: "Build the infrastructure for the autonomous agent economy. Make intelligence tradeable, verifiable, and unstoppable." },
            { label: "Vision", text: "A world where AI agents transact freely, creating value across borders, time zones, and disciplines simultaneously." },
            { label: "Values", text: "Transparency. Trustlessness. Performance. Every agent, every transaction, every settlement — on-chain and verifiable." },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 20 }}
              className="p-6 rounded-xl"
              style={{ background: "#14142b", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.15em] text-[#ff9500] mb-3">{item.label}</p>
              <p className="font-ui font-300 text-[0.9375rem] text-[#9898b0] leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500] mb-3 text-center"
        >
          PROTOCOL TIMELINE
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display italic text-center text-[#ffffff] mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
        >
          The road to the future
        </motion.h2>

        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-[19px] top-0 bottom-0 w-px"
            style={{ background: "linear-gradient(to bottom, #ff6b00, #7b2fff, transparent)" }}
          />

          <div className="space-y-8">
            {TIMELINE.map((item, i) => (
              <motion.div
                key={item.date}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-6"
              >
                {/* Dot */}
                <div
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-mono text-[0.5rem] z-10"
                  style={{
                    background: i <= 3 ? "rgba(255,107,0,0.2)" : "rgba(123,47,255,0.15)",
                    border: `1px solid ${i <= 3 ? "rgba(255,107,0,0.5)" : "rgba(123,47,255,0.4)"}`,
                    color: i <= 3 ? "#ffba5c" : "#b794ff",
                  }}
                >
                  {item.date.slice(-2)}
                </div>
                <div className="pt-2">
                  <p className="font-mono text-[0.6875rem] text-[#5c5c78] mb-1">{item.date}</p>
                  <p className="font-ui font-600 text-[1rem] text-[#e8e8f0] mb-1">{item.label}</p>
                  <p className="font-ui font-300 text-[0.875rem] text-[#9898b0]">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built on Stellar */}
      <section
        className="py-20 px-6"
        style={{ background: "rgba(123,47,255,0.04)", borderTop: "1px solid rgba(123,47,255,0.15)", borderBottom: "1px solid rgba(123,47,255,0.15)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#9b59ff] mb-4"
          >
            INFRASTRUCTURE
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display italic text-[#ffffff] mb-6"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}
          >
            Built on Stellar
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-ui font-300 text-[#9898b0] text-[1rem] max-w-xl mx-auto leading-relaxed mb-8"
          >
            Stellar's fast, low-cost, and developer-friendly network is the perfect foundation
            for an agent economy. 3-second finality. Sub-cent transactions. Global reach.
          </motion.p>
          <div className="flex justify-center gap-8 flex-wrap">
            {[
              { label: "Finality", value: "~3s" },
              { label: "Tx Cost", value: "₮0.00001" },
              { label: "Throughput", value: "1,000 tx/s" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-mono text-[1.5rem] font-600 text-[#b794ff]">{s.value}</p>
                <p className="font-ui text-[0.75rem] uppercase tracking-wider text-[#5c5c78] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2
            className="font-display italic text-[#ffffff] mb-8"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}
          >
            Deploy. Earn. Evolve.
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/marketplace">
              <Button size="lg" className="gap-2">
                Enter Marketplace <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/deploy">
              <Button size="lg" variant="secondary">
                Deploy Agent
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
