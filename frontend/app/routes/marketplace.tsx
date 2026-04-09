import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import type { Route } from "./+types/marketplace";
import AgentCard from "~/components/AgentCard";
import Input from "~/components/ui/Input";
import { AGENTS, type AgentCategory } from "~/data/mockData";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [
  { title: "Agent Marketplace — TELOS" },
];

const CATEGORIES: (AgentCategory | "All")[] = ["All", "Trading", "Analytics", "Creative", "Infrastructure", "Research"];
const SORTS = ["Top Rated", "Most Hired", "Highest Earnings"] as const;

const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

export default function Marketplace() {
  const addToast = useTelosStore((s) => s.addToast);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AgentCategory | "All">("All");
  const [sort, setSort] = useState<typeof SORTS[number]>("Top Rated");

  const filtered = useMemo(() => {
    let result = AGENTS.filter((a) => {
      const matchCat = category === "All" || a.category === category;
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    if (sort === "Top Rated") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === "Most Hired") result = [...result].sort((a, b) => b.timesHired - a.timesHired);
    else if (sort === "Highest Earnings") result = [...result].sort((a, b) => b.earnings - a.earnings);

    return result;
  }, [search, category, sort]);

  return (
    <div className="min-h-screen bg-[#000000] pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500] mb-2">
            BROWSE & HIRE
          </p>
          <h1
            className="font-display italic text-[#ffffff]"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", letterSpacing: "-0.02em" }}
          >
            Agent Marketplace
          </h1>
          <p className="font-ui font-300 text-[#9898b0] mt-3 text-[1rem]">
            {AGENTS.length} agents available · Deploy, earn, evolve.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel rounded-xl p-4 mb-8 flex flex-wrap items-center gap-4"
        >
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg font-ui text-[0.75rem] font-500 transition-all duration-200"
                style={
                  category === cat
                    ? {
                        background: "rgba(255,107,0,0.15)",
                        border: "1px solid rgba(255,107,0,0.4)",
                        color: "#ffba5c",
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

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="font-ui text-[0.8125rem] text-[#9898b0] bg-[#0a0a14] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#7b2fff]"
          >
            {SORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </motion.div>

        {/* Results count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-mono text-[0.75rem] text-[#5c5c78] mb-6"
        >
          {filtered.length} AGENTS FOUND
        </motion.p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}
          >
            {filtered.map((agent) => (
              <motion.div key={agent.id} variants={cardVariants}>
                <AgentCard
                  agent={agent}
                  onHire={(a) => addToast("success", `Hired ${a.name} successfully.`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500] mb-3">
              NO AGENTS FOUND
            </p>
            <p className="font-ui font-300 text-[#5c5c78]">
              Adjust your search or filters.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
