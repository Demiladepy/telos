import { useEffect, useRef, useState, useCallback } from "react";
import { NETWORK_NODES, NETWORK_EDGES, CATEGORY_COLORS, type NetworkNode } from "~/data/mockData";

interface SimNode extends NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  color: string;
}

export default function NetworkGraph({
  width = 800,
  height = 450,
  simplified = false,
}: {
  width?: number;
  height?: number;
  simplified?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const nodeCount = simplified ? 20 : NETWORK_NODES.length;

  // Initialize simulation
  useEffect(() => {
    const nodes = NETWORK_NODES.slice(0, nodeCount).map((n) => ({
      ...n,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));
    nodesRef.current = nodes;
  }, [width, height, nodeCount]);

  // Spawn transaction particles periodically
  useEffect(() => {
    const spawnParticle = () => {
      const nodes = nodesRef.current;
      if (nodes.length < 2) return;
      const edges = NETWORK_EDGES.slice(0, simplified ? 30 : NETWORK_EDGES.length);
      const edge = edges[Math.floor(Math.random() * edges.length)];
      const src = nodes.find((n) => n.id === edge.source);
      const tgt = nodes.find((n) => n.id === edge.target);
      if (!src || !tgt) return;
      particlesRef.current.push({
        id: `p-${Date.now()}`,
        x: src.x,
        y: src.y,
        tx: tgt.x,
        ty: tgt.y,
        progress: 0,
        color: CATEGORY_COLORS[src.category],
      });
    };
    const interval = setInterval(spawnParticle, simplified ? 400 : 200);
    return () => clearInterval(interval);
  }, [simplified]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;

      // Force simulation step
      for (let i = 0; i < nodes.length; i++) {
        const ni = nodes[i];
        // Repulsion
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const nj = nodes[j];
          const dx = ni.x - nj.x;
          const dy = ni.y - nj.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const repelRadius = 80;
          if (dist < repelRadius) {
            const force = ((repelRadius - dist) / repelRadius) * 0.08;
            ni.vx += (dx / dist) * force;
            ni.vy += (dy / dist) * force;
          }
        }
        // Center attraction
        ni.vx += (width / 2 - ni.x) * 0.0003;
        ni.vy += (height / 2 - ni.y) * 0.0003;

        // Drift
        ni.vx += (Math.random() - 0.5) * 0.05;
        ni.vy += (Math.random() - 0.5) * 0.05;

        // Damping
        ni.vx *= 0.96;
        ni.vy *= 0.96;

        // Speed cap
        const speed = Math.sqrt(ni.vx ** 2 + ni.vy ** 2);
        if (speed > 1.5) { ni.vx *= 1.5 / speed; ni.vy *= 1.5 / speed; }

        ni.x = Math.max(20, Math.min(width - 20, ni.x + ni.vx));
        ni.y = Math.max(20, Math.min(height - 20, ni.y + ni.vy));
      }

      // Draw edges
      const edges = NETWORK_EDGES.slice(0, simplified ? 30 : NETWORK_EDGES.length);
      for (const edge of edges) {
        const src = nodes.find((n) => n.id === edge.source);
        const tgt = nodes.find((n) => n.id === edge.target);
        if (!src || !tgt) continue;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = "rgba(58,58,82,0.4)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Update + draw particles
      particlesRef.current = particlesRef.current.filter((p) => p.progress < 1);
      for (const p of particlesRef.current) {
        p.progress = Math.min(1, p.progress + 0.012);
        p.x = p.x + (p.tx - p.x) * 0.012;
        p.y = p.y + (p.ty - p.y) * 0.012;

        const alpha = 1 - p.progress;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow trail
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
        grad.addColorStop(0, p.color + "60");
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = alpha * 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw nodes
      for (const n of nodes) {
        const r = Math.max(4, (n.reputation / 100) * 12);
        const color = CATEGORY_COLORS[n.category];
        const isHovered = hoveredNode?.id === n.id;

        // Glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
        glow.addColorStop(0, color + "50");
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * (isHovered ? 3.5 : 2.5), 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * (isHovered ? 1.4 : 1), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Inner bright dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
  }, [width, height, simplified, hoveredNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const cx = mx * scaleX;
    const cy = my * scaleY;

    let closest: SimNode | null = null;
    let minDist = 20;
    for (const n of nodesRef.current) {
      const d = Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2);
      if (d < minDist) { minDist = d; closest = n; }
    }
    setHoveredNode(closest);
    setTooltipPos({ x: mx, y: my });
  }, [width, height]);

  return (
    <div className="relative" style={{ width, height: "100%" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        className="w-full h-full cursor-crosshair"
        style={{ display: "block" }}
      />
      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-10 glass-panel rounded-lg px-3 py-2 text-xs"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 8 }}
        >
          <p className="font-ui font-600 text-[#e8e8f0] text-[0.75rem]">{hoveredNode.name}</p>
          <p className="font-ui text-[#9898b0] text-[0.6875rem]">{hoveredNode.category}</p>
          <p className="font-mono text-[0.6875rem]" style={{ color: CATEGORY_COLORS[hoveredNode.category] }}>
            Rep: {Math.round(hoveredNode.reputation)}
          </p>
        </div>
      )}
    </div>
  );
}
