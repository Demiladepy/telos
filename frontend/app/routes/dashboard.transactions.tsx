import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Copy, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Route } from "./+types/dashboard.transactions";
import { generateTransactions, type Transaction } from "~/data/mockData";
import { formatXLM, truncateHash, timeAgo } from "~/lib/utils";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "Transactions — TELOS Dashboard" }];

type SortKey = "timestamp" | "amount" | "status";

const PAGE_SIZE = 25;

const STATUS_COLOR = { success: "#00ff94", pending: "#ffd600", failed: "#ff3366" };

export default function DashboardTransactions() {
  const { transactions: storeTransactions, addToast } = useTelosStore();
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "timestamp", dir: "desc" });
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const [liveItems, setLiveItems] = useState<Transaction[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  // Simulate new transactions coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const [newTx] = generateTransactions(1);
      setLiveItems((prev) => [newTx, ...prev].slice(0, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const allTx = [...liveItems, ...storeTransactions];

  const sorted = [...allTx].sort((a, b) => {
    const mul = sort.dir === "desc" ? -1 : 1;
    if (sort.key === "timestamp") return mul * (a.timestamp.getTime() - b.timestamp.getTime());
    if (sort.key === "amount") return mul * (a.amount - b.amount);
    return mul * a.status.localeCompare(b.status);
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
    setPage(1);
  };

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
    addToast("info", "Hash copied to clipboard.");
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-left hover:text-[#e8e8f0] transition-colors"
      style={{ color: sort.key === k ? "#ffba5c" : "#5c5c78" }}
    >
      {label}
      <ArrowUpDown size={10} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-ui text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500]">HISTORY</p>
        <h1 className="font-display italic text-[#ffffff] mt-1" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
          Transactions
        </h1>
        <p className="font-mono text-[0.75rem] text-[#5c5c78] mt-1">
          {sorted.length.toLocaleString()} records — live feed active
        </p>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        ref={tableRef}
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr style={{ background: "#0a0a14", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Timestamp", key: "timestamp" as SortKey },
                  { label: "Agent", key: null },
                  { label: "Type", key: null },
                  { label: "Counterparty", key: null },
                  { label: "Amount", key: "amount" as SortKey },
                  { label: "Fee", key: null },
                  { label: "Status", key: "status" as SortKey },
                  { label: "Hash", key: null },
                ].map((col) => (
                  <th
                    key={col.label}
                    className="text-left px-4 py-3 font-ui text-[0.625rem] uppercase tracking-wider font-600"
                  >
                    {col.key ? <SortBtn k={col.key} label={col.label} /> : (
                      <span className="text-[#5c5c78]">{col.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paged.map((tx, i) => {
                  const isNew = liveItems.some((l) => l.id === tx.id);
                  return (
                    <motion.tr
                      key={tx.id}
                      initial={isNew ? { backgroundColor: "rgba(255,107,0,0.15)" } : {}}
                      animate={{ backgroundColor: "transparent" }}
                      transition={{ duration: 2 }}
                      style={{
                        background: i % 2 === 0 ? "#0a0a14" : "#03030a",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      <td className="px-4 py-2.5 font-mono text-[0.6875rem] text-[#5c5c78] whitespace-nowrap">
                        {timeAgo(tx.timestamp)}
                      </td>
                      <td className="px-4 py-2.5 font-ui text-[0.75rem] text-[#9898b0] whitespace-nowrap">
                        {tx.agent}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="px-2 py-0.5 rounded font-ui text-[0.625rem] uppercase font-500 tracking-wide"
                          style={{ background: "rgba(255,255,255,0.05)", color: "#9898b0" }}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[0.6875rem] text-[#9898b0] whitespace-nowrap">
                        {tx.counterparty}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[0.8125rem] font-600 text-[#ffba5c] whitespace-nowrap">
                        {formatXLM(tx.amount)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[0.6875rem] text-[#5c5c78]">
                        {formatXLM(tx.fee)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 font-ui text-[0.625rem] uppercase font-600 tracking-wider"
                          style={{ color: STATUS_COLOR[tx.status] }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "currentColor" }}
                          />
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[0.6875rem] text-[#5c5c78]">
                            {truncateHash(tx.hash)}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.hash)}
                            className="text-[#3a3a52] hover:text-[#9898b0] transition-colors"
                          >
                            {copied === tx.hash ? <CheckCheck size={11} className="text-[#00ff94]" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0a0a14" }}
        >
          <p className="font-ui text-[0.75rem] text-[#5c5c78]">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-[#5c5c78] hover:text-[#e8e8f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-[0.75rem] text-[#9898b0]">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-[#5c5c78] hover:text-[#e8e8f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
