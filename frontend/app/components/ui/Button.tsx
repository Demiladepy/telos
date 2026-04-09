import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: [
    "bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.4)] text-[#ffba5c]",
    "hover:bg-[rgba(255,107,0,0.2)] hover:border-[rgba(255,107,0,0.6)]",
    "hover:shadow-[0_0_20px_rgba(255,107,0,0.15)]",
  ].join(" "),
  secondary: [
    "bg-transparent border border-[#3a3a52] text-[#9898b0]",
    "hover:border-[#5c5c78] hover:text-[#e8e8f0]",
  ].join(" "),
  ghost: [
    "bg-transparent border-none text-[#5c5c78]",
    "hover:text-[#e8e8f0]",
  ].join(" "),
  danger: [
    "bg-[rgba(255,51,102,0.12)] border border-[rgba(255,51,102,0.4)] text-[#ff3366]",
    "hover:bg-[rgba(255,51,102,0.2)] hover:border-[rgba(255,51,102,0.6)]",
  ].join(" "),
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[0.6875rem] rounded-md",
  md: "px-6 py-2.5 text-[0.8125rem] rounded-lg",
  lg: "px-8 py-3.5 text-sm rounded-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "font-ui font-medium cursor-pointer select-none",
        "transition-all duration-200",
        "inline-flex items-center justify-center gap-2",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
}
