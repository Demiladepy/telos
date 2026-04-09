import { motion } from "framer-motion";
import { useState } from "react";
import type { Route } from "./+types/dashboard.settings";
import Button from "~/components/ui/Button";
import Input from "~/components/ui/Input";
import { useTelosStore } from "~/store";
import { truncateAddress } from "~/lib/utils";

export const meta: Route.MetaFunction = () => [{ title: "Settings — TELOS Dashboard" }];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-6 rounded-xl space-y-4"
      style={{ background: "#14142b", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.15em] text-[#5c5c78]">{title}</p>
      {children}
    </div>
  );
}

export default function DashboardSettings() {
  const { wallet, connectWallet, disconnectWallet, addToast } = useTelosStore();
  const [displayName, setDisplayName] = useState("Agent Operator");
  const [notifications, setNotifications] = useState({ txAlerts: true, agentStatus: true, earnings: true });
  const [defaultFee, setDefaultFee] = useState("0.5");

  const handleSave = () => addToast("success", "Settings saved.");

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-ui text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500]">CONFIGURATION</p>
        <h1 className="font-display italic text-[#ffffff] mt-1" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
          Settings
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Profile */}
        <Section title="PROFILE">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Agent Operator"
          />
          <Input
            label="Email"
            type="email"
            placeholder="operator@example.com"
          />
        </Section>

        {/* Wallet */}
        <Section title="WALLET">
          {wallet.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "rgba(0,255,148,0.04)", border: "1px solid rgba(0,255,148,0.15)" }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#00ff94]" />
                    <span className="font-ui text-[0.6875rem] uppercase tracking-wider text-[#00ff94]">Connected</span>
                  </div>
                  <p className="font-mono text-[0.875rem] text-[#e8e8f0]">{wallet.address}</p>
                  <p className="font-mono text-[0.75rem] text-[#ffba5c] mt-1">Balance: ₮{wallet.balance.toLocaleString()}</p>
                </div>
                <Button variant="danger" size="sm" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <p className="font-ui font-300 text-[#9898b0] text-[0.875rem]">No wallet connected. Connect your Stellar wallet to start earning.</p>
              <Button onClick={connectWallet} size="md">Connect Wallet</Button>
            </div>
          )}
        </Section>

        {/* Agent defaults */}
        <Section title="AGENT DEFAULTS">
          <Input
            label="Default Fee Rate (%)"
            type="number"
            value={defaultFee}
            onChange={(e) => setDefaultFee(e.target.value)}
            placeholder="0.5"
          />
          <div>
            <p className="font-ui text-[0.6875rem] uppercase tracking-[0.15em] text-[#5c5c78] mb-3">
              Default Capabilities
            </p>
            <div className="flex flex-wrap gap-2">
              {["Trading", "Analytics", "Negotiation", "Reporting"].map((cap) => (
                <button
                  key={cap}
                  className="px-3 py-1.5 rounded-lg font-ui text-[0.75rem] text-[#9898b0] transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          {[
            { key: "txAlerts" as const, label: "Transaction Alerts", desc: "Get notified for each transaction" },
            { key: "agentStatus" as const, label: "Agent Status Changes", desc: "Alerts when agents go online/offline" },
            { key: "earnings" as const, label: "Earnings Reports", desc: "Daily earnings summary" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2">
              <div>
                <p className="font-ui font-500 text-[0.875rem] text-[#e8e8f0]">{n.label}</p>
                <p className="font-ui font-300 text-[0.75rem] text-[#5c5c78]">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                className="relative w-10 h-5 rounded-full transition-colors duration-200"
                style={{ background: notifications[n.key] ? "rgba(255,107,0,0.5)" : "rgba(58,58,82,0.8)" }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: `translateX(${notifications[n.key] ? "20px" : "2px"})` }}
                />
              </button>
            </div>
          ))}
        </Section>

        {/* Danger zone */}
        <Section title="DANGER ZONE">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-ui font-500 text-[0.875rem] text-[#e8e8f0]">Terminate All Agents</p>
              <p className="font-ui font-300 text-[0.75rem] text-[#5c5c78]">Stop and remove all deployed agents</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => addToast("warning", "Terminate all agents? This action cannot be undone.")}
            >
              Terminate All
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-ui font-500 text-[0.875rem] text-[#e8e8f0]">Delete Account</p>
              <p className="font-ui font-300 text-[0.75rem] text-[#5c5c78]">Permanently remove your TELOS account</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => addToast("error", "Account deletion is permanent and irreversible.")}
            >
              Delete
            </Button>
          </div>
        </Section>

        <div className="flex justify-end">
          <Button size="md" onClick={handleSave}>Save Settings</Button>
        </div>
      </motion.div>
    </div>
  );
}
