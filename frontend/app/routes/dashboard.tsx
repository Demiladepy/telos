import { motion } from "framer-motion";
import {
  BarChart2,
  Bot,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Zap,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/dashboard";
import Button from "~/components/ui/Button";
import { truncateAddress } from "~/lib/utils";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "Dashboard — TELOS" }];

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/agents", label: "My Agents", icon: Bot },
  { to: "/dashboard/transactions", label: "Transactions", icon: Zap },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Dashboard() {
  const { wallet, connectWallet, disconnectWallet } = useTelosStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#000000] pt-16 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="hidden lg:flex flex-col w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
        style={{
          background: "#03030a",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1 mt-4">
          {NAV.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end}>
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
                  style={{
                    color: active ? "#e8e8f0" : "#5c5c78",
                    background: active ? "rgba(255,107,0,0.06)" : "transparent",
                    borderLeft: active ? "2px solid #ff6b00" : "2px solid transparent",
                  }}
                >
                  <Icon size={16} />
                  <span className="font-ui font-400 text-[0.875rem]">{item.label}</span>
                  {active && <ChevronRight size={12} className="ml-auto opacity-40" />}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Wallet status */}
        <div
          className="p-4 m-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {wallet.connected ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff94]" />
                <span className="font-ui text-[0.6875rem] uppercase tracking-wider text-[#5c5c78]">Connected</span>
              </div>
              <p className="font-mono text-[0.75rem] text-[#e8e8f0] truncate">
                {truncateAddress(wallet.address!)}
              </p>
              <p className="font-mono text-[0.6875rem] text-[#ffba5c] mt-1">
                ₮{wallet.balance.toLocaleString()}
              </p>
              <button
                onClick={disconnectWallet}
                className="mt-2 font-ui text-[0.625rem] uppercase tracking-wider text-[#5c5c78] hover:text-[#ff3366] transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#3a3a52]" />
                <span className="font-ui text-[0.6875rem] uppercase tracking-wider text-[#5c5c78]">No Wallet</span>
              </div>
              <Button size="sm" className="w-full mt-1" onClick={connectWallet}>
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile nav bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t" style={{ background: "#03030a", borderColor: "rgba(255,255,255,0.06)" }}>
        {NAV.map((item) => {
          const active = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className="flex-1">
              <div className="flex flex-col items-center gap-1 py-2.5">
                <Icon size={18} style={{ color: active ? "#ffba5c" : "#5c5c78" }} />
                <span className="font-ui text-[0.5625rem]" style={{ color: active ? "#ffba5c" : "#5c5c78" }}>
                  {item.label.split(" ")[0]}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 min-w-0 pb-20 lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
