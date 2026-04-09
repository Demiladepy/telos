import { useEffect, useRef } from "react";

interface StarLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function StarLogo({ size = 32, className = "", animate = true }: StarLogoProps) {
  const coreRef = useRef<SVGCircleElement>(null);
  const groupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!animate) return;
    let frame: number;
    let t = 0;

    const tick = () => {
      t += 0.02;
      if (coreRef.current) {
        const scale = 0.98 + Math.sin(t) * 0.02;
        const opacity = 0.85 + Math.sin(t * 1.1) * 0.15;
        coreRef.current.style.transform = `scale(${scale})`;
        coreRef.current.style.transformOrigin = "center";
        coreRef.current.style.opacity = String(opacity);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  // Spiral arm points
  const armPoints = (armIndex: number, count = 12) => {
    const baseAngle = (armIndex * 2 * Math.PI) / 3;
    return Array.from({ length: count }, (_, i) => {
      const t = i / count;
      const angle = baseAngle + t * Math.PI * 1.4;
      const radius = t * r * 0.9;
      const spread = t * r * 0.15;
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        r: (1 - t * 0.6) * size * 0.025,
        opacity: 0.9 - t * 0.5,
        spread,
      };
    });
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={animate ? { animation: "star-rotate 60s linear infinite" } : undefined}
    >
      <defs>
        <radialGradient id={`core-grad-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity="1" />
          <stop offset="40%" stopColor="#ff9500" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`glow-grad-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9500" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7b2fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${size}`}>
          <feGaussianBlur stdDeviation={size * 0.03} />
        </filter>
      </defs>

      {/* Outer glow disk */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#glow-grad-${size})`} />

      {/* Spiral arms */}
      <g ref={groupRef}>
        {[0, 1, 2].map((arm) =>
          armPoints(arm).map((pt, i) => (
            <circle
              key={`arm-${arm}-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={pt.r}
              fill={arm === 0 ? "#ff9500" : arm === 1 ? "#9b59ff" : "#ffba5c"}
              opacity={pt.opacity}
            />
          ))
        )}
      </g>

      {/* Core glow halo */}
      <circle
        cx={cx}
        cy={cy}
        r={size * 0.12}
        fill={`url(#core-grad-${size})`}
        filter={`url(#blur-${size})`}
      />

      {/* Bright core */}
      <circle
        ref={coreRef}
        cx={cx}
        cy={cy}
        r={size * 0.07}
        fill="#ffd9a0"
      />

      {/* Star cross flare */}
      {[0, 90].map((angle) => (
        <line
          key={angle}
          x1={cx + Math.cos((angle * Math.PI) / 180) * size * 0.05}
          y1={cy + Math.sin((angle * Math.PI) / 180) * size * 0.05}
          x2={cx + Math.cos(((angle + 180) * Math.PI) / 180) * size * 0.05}
          y2={cy + Math.sin(((angle + 180) * Math.PI) / 180) * size * 0.05}
          stroke="#ffd9a0"
          strokeWidth={size * 0.015}
          opacity={0.6}
        />
      ))}
    </svg>
  );
}
