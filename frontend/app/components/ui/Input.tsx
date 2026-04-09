import { cn } from "~/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="font-ui text-[0.6875rem] font-600 uppercase tracking-[0.15em] text-[#5c5c78]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5c78]">
            {icon}
          </span>
        )}
        <input
          className={cn(
            "w-full font-ui font-400 text-[1rem] text-[#e8e8f0]",
            "bg-[#0a0a14] rounded-lg",
            "border border-[rgba(255,255,255,0.08)]",
            "py-3 px-4",
            icon ? "pl-10" : "",
            "placeholder-[#3a3a52]",
            "focus:outline-none focus:border-[#7b2fff]",
            "focus:shadow-[0_0_0_3px_rgba(123,47,255,0.08)]",
            "transition-all duration-200",
            error ? "border-[#ff3366] focus:border-[#ff3366] focus:shadow-[0_0_0_3px_rgba(255,51,102,0.1)]" : "",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="text-[0.6875rem] text-[#ff3366] font-ui">{error}</span>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="font-ui text-[0.6875rem] font-600 uppercase tracking-[0.15em] text-[#5c5c78]">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full font-ui font-400 text-[1rem] text-[#e8e8f0]",
          "bg-[#0a0a14] rounded-lg resize-none",
          "border border-[rgba(255,255,255,0.08)]",
          "py-3 px-4",
          "placeholder-[#3a3a52]",
          "focus:outline-none focus:border-[#7b2fff]",
          "focus:shadow-[0_0_0_3px_rgba(123,47,255,0.08)]",
          "transition-all duration-200",
          error ? "border-[#ff3366]" : "",
          className
        )}
        rows={4}
        {...props}
      />
      {error && (
        <span className="text-[0.6875rem] text-[#ff3366] font-ui">{error}</span>
      )}
    </div>
  );
}
