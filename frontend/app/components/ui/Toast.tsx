import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTelosStore } from "~/store";

const COLORS = {
  success: { border: "#00ff94", icon: "✓", bg: "rgba(0,255,148,0.08)" },
  error: { border: "#ff3366", icon: "✕", bg: "rgba(255,51,102,0.08)" },
  info: { border: "#00b4ff", icon: "ℹ", bg: "rgba(0,180,255,0.08)" },
  warning: { border: "#ffd600", icon: "⚠", bg: "rgba(255,214,0,0.08)" },
};

function ToastItem({ id, type, message }: { id: string; type: keyof typeof COLORS; message: string }) {
  const removeToast = useTelosStore((s) => s.removeToast);
  const [progress, setProgress] = useState(100);
  const color = COLORS[type];

  useEffect(() => {
    const start = Date.now();
    const duration = 5000;
    const frame = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, []);

  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative w-[320px] overflow-hidden rounded-lg backdrop-blur-2xl"
      style={{
        background: `rgba(20, 20, 43, 0.85)`,
        borderLeft: `3px solid ${color.border}`,
        border: `1px solid rgba(255,255,255,0.06)`,
        borderLeftColor: color.border,
        borderLeftWidth: "3px",
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className="text-xs font-bold mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: color.bg, color: color.border }}
        >
          {color.icon}
        </span>
        <p className="font-ui text-[0.8125rem] text-[#e8e8f0] flex-1 leading-relaxed">{message}</p>
        <button
          onClick={() => removeToast(id)}
          className="text-[#5c5c78] hover:text-[#9898b0] transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-[2px] transition-all duration-100"
        style={{ width: `${progress}%`, background: color.border, opacity: 0.6 }}
      />
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useTelosStore((s) => s.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-[9000] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
