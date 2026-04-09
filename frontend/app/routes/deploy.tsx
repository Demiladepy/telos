import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/deploy";
import Button from "~/components/ui/Button";
import Input, { Textarea } from "~/components/ui/Input";
import { CATEGORY_COLORS, type AgentCategory } from "~/data/mockData";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "Deploy Agent — TELOS" }];

const STEPS = ["Configure", "Fund", "Test", "Launch"] as const;
type Step = typeof STEPS[number];

const CAPABILITIES = [
  "Arbitrage", "Market Making", "Analytics", "Reporting", "Negotiation",
  "Data Aggregation", "Content Generation", "Security Monitoring", "Price Oracle",
  "DeFi Automation", "Forecasting", "Risk Management",
];

const CATEGORIES: AgentCategory[] = ["Trading", "Analytics", "Creative", "Infrastructure", "Research"];

function StepIndicator({ current, steps }: { current: number; steps: readonly string[] }) {
  return (
    <div className="flex items-center gap-0 mb-12">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  background: done ? "#00ff94" : active ? "#ff6b00" : "transparent",
                  borderColor: done ? "#00ff94" : active ? "#ff6b00" : "#3a3a52",
                  scale: active ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
              >
                {done ? (
                  <Check size={14} style={{ color: "#000" }} />
                ) : (
                  <span className="font-mono text-[0.6875rem]" style={{ color: active ? "#fff" : "#3a3a52" }}>
                    {i + 1}
                  </span>
                )}
              </motion.div>
              <span
                className="font-ui text-[0.625rem] uppercase tracking-wider whitespace-nowrap"
                style={{ color: active ? "#ffba5c" : done ? "#00ff94" : "#3a3a52" }}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px w-12 sm:w-20 mx-1 mb-5 transition-colors duration-500"
                style={{ background: i < current ? "#00ff94" : "#3a3a52" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Deploy() {
  const navigate = useNavigate();
  const { deployAgent, addToast, wallet, connectWallet } = useTelosStore();
  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "Trading" as AgentCategory,
    description: "",
    capabilities: [] as string[],
    fee: 0.5,
    fundAmount: 100,
  });

  const toggleCap = (cap: string) => {
    setForm((f) => ({
      ...f,
      capabilities: f.capabilities.includes(cap)
        ? f.capabilities.filter((c) => c !== cap)
        : [...f.capabilities, cap],
    }));
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const handleLaunch = () => {
    if (!wallet.connected) {
      addToast("warning", "Please connect your wallet first.");
      return;
    }
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
      deployAgent({
        name: form.name || "Unnamed Agent",
        handle: (form.name || "agent").toLowerCase().replace(/\s+/g, "-"),
        category: form.category,
        description: form.description || "A custom agent deployed on TELOS.",
        capabilities: form.capabilities,
        fee: form.fee,
        status: "active",
        owner: wallet.address || undefined,
      });
      setTimeout(() => navigate("/dashboard/agents"), 2500);
    }, 2500);
  };

  const stepContent = [
    // Step 1: Configure
    <motion.div
      key="configure"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <Input
        label="Agent Name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="e.g. Arbitrage Prime"
      />
      <div className="flex flex-col gap-1.5">
        <label className="font-ui text-[0.6875rem] font-600 uppercase tracking-[0.15em] text-[#5c5c78]">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setForm((f) => ({ ...f, category: cat }))}
              className="px-3 py-2 rounded-lg font-ui text-[0.8125rem] transition-all"
              style={
                form.category === cat
                  ? {
                      background: CATEGORY_COLORS[cat] + "20",
                      border: `1px solid ${CATEGORY_COLORS[cat]}60`,
                      color: CATEGORY_COLORS[cat],
                    }
                  : {
                      background: "transparent",
                      border: "1px solid #3a3a52",
                      color: "#9898b0",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Describe what this agent does..."
        rows={3}
      />
      <div className="flex flex-col gap-1.5">
        <label className="font-ui text-[0.6875rem] font-600 uppercase tracking-[0.15em] text-[#5c5c78]">
          Capabilities (select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {CAPABILITIES.map((cap) => {
            const selected = form.capabilities.includes(cap);
            return (
              <button
                key={cap}
                onClick={() => toggleCap(cap)}
                className="px-3 py-1.5 rounded-full font-ui text-[0.75rem] transition-all"
                style={
                  selected
                    ? { background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.4)", color: "#ffba5c" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#9898b0" }
                }
              >
                {cap}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[0.6875rem] font-600 uppercase tracking-[0.15em] text-[#5c5c78]">
          Fee Rate — {form.fee}% per transaction
        </label>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={form.fee}
          onChange={(e) => setForm((f) => ({ ...f, fee: parseFloat(e.target.value) }))}
          className="w-full accent-[#ff6b00]"
        />
        <div className="flex justify-between">
          <span className="font-mono text-[0.625rem] text-[#5c5c78]">0.1%</span>
          <span className="font-mono text-[0.625rem] text-[#5c5c78]">5%</span>
        </div>
      </div>
    </motion.div>,

    // Step 2: Fund
    <motion.div
      key="fund"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {!wallet.connected ? (
        <div className="text-center py-8 space-y-4">
          <p className="font-ui font-300 text-[#9898b0]">Connect your wallet to fund the agent.</p>
          <Button onClick={connectWallet}>Connect Wallet</Button>
        </div>
      ) : (
        <>
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{ background: "rgba(0,255,148,0.06)", border: "1px solid rgba(0,255,148,0.15)" }}
          >
            <div>
              <p className="font-ui text-[0.6875rem] uppercase tracking-wider text-[#5c5c78]">Available Balance</p>
              <p className="font-mono text-[1.5rem] font-600 text-[#e8e8f0]">₮{wallet.balance.toLocaleString()}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#00ff94]" />
          </div>
          <Input
            label="Funding Amount (XLM)"
            type="number"
            value={String(form.fundAmount)}
            onChange={(e) => setForm((f) => ({ ...f, fundAmount: parseFloat(e.target.value) || 0 }))}
            placeholder="100"
          />
          <div
            className="p-4 rounded-xl space-y-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex justify-between">
              <span className="font-ui text-[0.8125rem] text-[#9898b0]">Estimated runway</span>
              <span className="font-mono text-[0.8125rem] text-[#ffba5c]">
                ~{Math.round(form.fundAmount / 0.5)} operations
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-ui text-[0.8125rem] text-[#9898b0]">Cost per operation</span>
              <span className="font-mono text-[0.8125rem] text-[#e8e8f0]">₮0.5</span>
            </div>
            <div className="flex justify-between">
              <span className="font-ui text-[0.8125rem] text-[#9898b0]">Network fee</span>
              <span className="font-mono text-[0.8125rem] text-[#e8e8f0]">₮0.00001</span>
            </div>
          </div>
        </>
      )}
    </motion.div>,

    // Step 3: Test
    <motion.div
      key="test"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <p className="font-ui font-300 text-[#9898b0] text-[0.9rem]">
        Running a simulated test to verify agent configuration and capabilities.
      </p>
      {[
        { label: "Agent Configuration", status: "pass" },
        { label: "Network Connectivity", status: "pass" },
        { label: "Capability Validation", status: "pass" },
        { label: "Response Time Test", status: "pass" },
        { label: "Settlement Simulation", status: "pass" },
      ].map((test, i) => (
        <motion.div
          key={test.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center justify-between px-4 py-3 rounded-lg"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span className="font-ui text-[0.875rem] text-[#e8e8f0]">{test.label}</span>
          <span className="flex items-center gap-1.5 font-ui text-[0.75rem] font-600 uppercase tracking-wider" style={{ color: "#00ff94" }}>
            <Check size={12} /> PASS
          </span>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center py-2"
      >
        <p className="font-mono text-[0.75rem] text-[#00ff94]">All systems nominal. Ready for deployment.</p>
      </motion.div>
    </motion.div>,

    // Step 4: Launch
    <motion.div
      key="launch"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <p className="font-ui font-300 text-[#9898b0]">Final review before deployment.</p>
      <div
        className="p-5 rounded-xl space-y-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {[
          { label: "Name", value: form.name || "Unnamed Agent" },
          { label: "Category", value: form.category },
          { label: "Fee Rate", value: `${form.fee}%` },
          { label: "Funding", value: `₮${form.fundAmount}` },
          { label: "Capabilities", value: form.capabilities.length > 0 ? form.capabilities.join(", ") : "None selected" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="font-ui text-[0.8125rem] text-[#5c5c78]">{row.label}</span>
            <span className="font-mono text-[0.8125rem] text-[#e8e8f0] text-right max-w-[60%] truncate">{row.value}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {launched ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 flex flex-col items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,255,148,0.15)", border: "2px solid #00ff94" }}
            >
              <Check size={28} style={{ color: "#00ff94" }} />
            </motion.div>
            <p className="font-ui font-600 text-[1.25rem] text-[#00ff94]">Agent Live</p>
            <p className="font-ui font-300 text-[0.875rem] text-[#9898b0]">Redirecting to your agents...</p>
          </motion.div>
        ) : (
          <motion.div key="btn" className="flex justify-center">
            <Button
              size="lg"
              loading={launching}
              onClick={handleLaunch}
              className="min-w-[200px] text-center justify-center"
              style={{
                background: "rgba(255,107,0,0.15)",
                border: "1px solid rgba(255,107,0,0.5)",
              }}
            >
              {launching ? "Deploying..." : "Deploy to Network"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
  ];

  return (
    <div className="min-h-screen bg-[#000000] pt-24 pb-20 px-6">
      <div className="max-w-[680px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500] mb-2">
            DEPLOY
          </p>
          <h1
            className="font-display italic text-[#ffffff]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            Launch a New Agent
          </h1>
        </motion.div>

        {/* Step indicator */}
        <StepIndicator current={step} steps={STEPS} />

        {/* Step content */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{ background: "#14142b", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <AnimatePresence mode="wait">
            {stepContent[step]}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {!launched && (
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={nextStep}
                className="gap-2"
                disabled={step === 0 && !form.name}
              >
                Continue <ChevronRight size={14} />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
