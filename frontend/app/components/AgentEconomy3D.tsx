/**
 * 3D Agent Economy Visualization
 * Shows AI agents as glowing nodes orbiting the Stellar network core,
 * with animated transaction beams shooting between them.
 * Post-processing: Bloom, ChromaticAberration, Vignette for cinematic depth.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { AGENTS, CATEGORY_COLORS, type AgentCategory } from "~/data/mockData";

// ─── Constants ─────────────────────────────────────────────────────────────

const CAT_COLORS: Record<AgentCategory, [number, number, number]> = {
  Trading:       [1.0, 0.42, 0.0],
  Analytics:     [0.48, 0.19, 1.0],
  Creative:      [0.0,  0.71, 1.0],
  Infrastructure:[0.0,  1.0,  0.58],
  Research:      [1.0,  0.84, 0.0],
};

// ─── Glow Sphere (layered) ──────────────────────────────────────────────────

function GlowSphere({
  position, color, radius, intensity = 1,
}: {
  position: [number, number, number];
  color: [number, number, number];
  radius: number;
  intensity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const c = new THREE.Color(...color);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.97 + Math.sin(t * 2 + position[0]) * 0.03;
    if (meshRef.current) meshRef.current.scale.setScalar(pulse);
    if (haloRef.current) haloRef.current.scale.setScalar(2.2 + Math.sin(t * 1.5 + position[1]) * 0.15);
  });

  return (
    <group position={position}>
      {/* Outer halo */}
      <mesh ref={haloRef} scale={2.2}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.05 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Mid glow */}
      <mesh scale={1.5}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.12 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.6 * intensity}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* Bright center */}
      <mesh scale={0.4}>
        <sphereGeometry args={[radius, 8, 8]} />
        <meshBasicMaterial
          color="white"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Stellar Core ───────────────────────────────────────────────────────────

const PLANET_RADIUS = 0.6;

function StellarCore() {
  const ref = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.y = t * 0.1;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.3;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <group ref={ref}>
      {/* Accretion ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.08, 8, 80]} />
        <meshBasicMaterial
          color="#ff9500"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Secondary faint ring */}
      <mesh rotation={[Math.PI / 2 + 0.3, 0, 0]}>
        <torusGeometry args={[2.4, 0.03, 8, 80]} />
        <meshBasicMaterial
          color="#ff6b00"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow layers */}
      {[4.0, 2.5, 1.8].map((scale, i) => (
        <mesh key={i} scale={scale}>
          <sphereGeometry args={[PLANET_RADIUS, 16, 16]} />
          <meshBasicMaterial
            color={i === 0 ? "#ff6b00" : "#ff9500"}
            transparent
            opacity={[0.04, 0.08, 0.15][i]}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#ff9500"
          emissive="#ff6b00"
          emissiveIntensity={1.5}
          roughness={0}
          metalness={0.8}
        />
      </mesh>

      {/* White hot center */}
      <mesh scale={0.3}>
        <sphereGeometry args={[PLANET_RADIUS, 16, 16]} />
        <meshBasicMaterial color="white" blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Atmosphere shell — Fresnel-like edge glow */}
      <mesh scale={1.18}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#ff6b00"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer haze — very faint, wide */}
      <mesh scale={1.55}>
        <sphereGeometry args={[PLANET_RADIUS, 16, 16]} />
        <meshBasicMaterial
          color="#ff6b00"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// ─── Transaction Beam ───────────────────────────────────────────────────────

interface BeamProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: [number, number, number];
  progress: number;
}

function TransactionBeam({ start, end, color, progress }: BeamProps) {
  const particleRef = useRef<THREE.Mesh>(null);
  const c = new THREE.Color(...color);

  const mid = useMemo(() => {
    const m = start.clone().lerp(end, 0.5);
    m.y += 1.5;
    return m;
  }, [start, end]);

  const pos = useMemo(() => {
    const t = progress;
    const p0 = start, p1 = mid, p2 = end;
    return new THREE.Vector3(
      (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
      (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
      (1 - t) ** 2 * p0.z + 2 * (1 - t) * t * p1.z + t ** 2 * p2.z,
    );
  }, [start, mid, end, progress]);

  const alpha = progress < 0.1 ? progress / 0.1 : progress > 0.9 ? (1 - progress) / 0.1 : 1;

  const linePoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      pts.push(new THREE.Vector3(
        (1 - t) ** 2 * start.x + 2 * (1 - t) * t * mid.x + t ** 2 * end.x,
        (1 - t) ** 2 * start.y + 2 * (1 - t) * t * mid.y + t ** 2 * end.y,
        (1 - t) ** 2 * start.z + 2 * (1 - t) * t * mid.z + t ** 2 * end.z,
      ));
    }
    return pts;
  }, [start, mid, end]);

  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(linePoints), [linePoints]);

  return (
    <group>
      {/* @ts-expect-error — R3F <line> maps to THREE.Line, not SVG */}
      <line geometry={lineGeo}>
        <lineBasicMaterial
          color={c}
          transparent
          opacity={0.12 * alpha}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </line>
      <mesh ref={particleRef} position={[pos.x, pos.y, pos.z]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={alpha}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[pos.x, pos.y, pos.z]} scale={3}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.15 * alpha}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Orbit Ring ─────────────────────────────────────────────────────────────

function OrbitRing({ radius, tilt = 0 }: { radius: number; tilt?: number }) {
  return (
    <mesh rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.005, 4, 100]} />
      <meshBasicMaterial
        color="#9898b0"
        transparent
        opacity={0.07}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Label Sprite ───────────────────────────────────────────────────────────

function AgentLabel({ position, name, color }: { position: [number, number, number]; name: string; color: string }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.9;
    ctx.fillText(name, 128, 40);
    return c;
  }, [name, color]);

  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);

  return (
    <sprite position={[position[0], position[1] + 0.8, position[2]]} scale={[2.2, 0.55, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

// ─── Ambient Particles ──────────────────────────────────────────────────────

function AmbientParticles() {
  const ref = useRef<THREE.Points>(null);
  const COUNT = 3000;
  const MAX_DIST = 22;

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * 18 + 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color: warmer near center, cooler further out
      const warmth = Math.max(0, 1 - r / MAX_DIST);
      const t = Math.random();
      col[i * 3]     = THREE.MathUtils.lerp(0.7 + warmth * 0.3, 0.48, t);
      col[i * 3 + 1] = THREE.MathUtils.lerp(0.7 + warmth * 0.1, 0.19, t);
      col[i * 3 + 2] = THREE.MathUtils.lerp(1.0 - warmth * 0.3, 1.0, t);

      // Size varies for depth perception
      sz[i] = Math.random() * 1.8 + 0.3;
    }
    return { positions: pos, colors: col, sizes: sz };
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.01;
      ref.current.rotation.x = state.clock.elapsedTime * 0.005;
    }
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, colors, sizes]);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Node layout ────────────────────────────────────────────────────────────

const ORBIT_AGENTS = AGENTS.slice(0, 8).map((agent, i) => {
  const orbitR = [4.5, 5.5, 6.5, 7.5, 4.8, 6.0, 5.2, 7.0][i];
  const tilt = [0, 0.3, -0.2, 0.15, -0.35, 0.25, -0.1, 0.4][i];
  const phase = (i / 8) * Math.PI * 2;
  const speed = [0.12, 0.09, 0.07, 0.06, 0.14, 0.08, 0.11, 0.05][i];
  return { agent, orbitR, tilt, phase, speed };
});

interface BeamState {
  id: number;
  srcIdx: number;
  tgtIdx: number;
  progress: number;
  color: [number, number, number];
}

// ─── Main Scene ─────────────────────────────────────────────────────────────

function EconomyScene({ mousePos, compact }: { mousePos: { x: number; y: number }; compact?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRot = useRef({ x: 0, y: 0 });
  const currentRot = useRef({ x: 0, y: 0 });
  const [beams, setBeams] = useState<BeamState[]>([]);
  const nextBeamId = useRef(0);

  const nodePositions = useRef<THREE.Vector3[]>(
    ORBIT_AGENTS.map(() => new THREE.Vector3())
  );

  // Base camera position for drift
  const baseCameraPos = useMemo(() => ({
    x: 0,
    y: compact ? 4 : 4,
    z: compact ? 16 : 16,
  }), [compact]);

  // Spawn transaction beams
  useEffect(() => {
    const spawn = () => {
      const src = Math.floor(Math.random() * ORBIT_AGENTS.length);
      let tgt = Math.floor(Math.random() * ORBIT_AGENTS.length);
      while (tgt === src) tgt = Math.floor(Math.random() * ORBIT_AGENTS.length);
      const cat = ORBIT_AGENTS[src].agent.category;
      setBeams((prev) => [
        ...prev.filter((b) => b.progress < 0.99),
        { id: nextBeamId.current++, srcIdx: src, tgtIdx: tgt, progress: 0, color: CAT_COLORS[cat] },
      ]);
    };
    const interval = setInterval(spawn, 600);
    return () => clearInterval(interval);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Update node positions
    for (let i = 0; i < ORBIT_AGENTS.length; i++) {
      const { orbitR, tilt, phase, speed } = ORBIT_AGENTS[i];
      const angle = phase + t * speed;
      nodePositions.current[i].set(
        Math.cos(angle) * orbitR,
        Math.sin(tilt) * orbitR * Math.sin(angle),
        Math.sin(angle) * orbitR * Math.cos(tilt),
      );
    }

    // Advance beams
    setBeams((prev) =>
      prev
        .map((b) => ({ ...b, progress: b.progress + delta * 0.5 }))
        .filter((b) => b.progress < 1.02)
    );

    // Mouse parallax on group
    targetRot.current.x = mousePos.y * 0.3;
    targetRot.current.y = mousePos.x * 0.5;
    currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.04;
    currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.04;

    if (groupRef.current) {
      groupRef.current.rotation.x = currentRot.current.x;
      groupRef.current.rotation.y = t * 0.04 + currentRot.current.y;
    }

    // Slow cinematic camera drift
    state.camera.position.x = Math.sin(t * 0.03) * 0.5 + baseCameraPos.x;
    state.camera.position.y = Math.cos(t * 0.02) * 0.3 + baseCameraPos.y;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      {/* Three-point lighting */}
      <ambientLight intensity={0.05} />
      {/* Key light — warm, from accretion side */}
      <pointLight position={[8, 3, 5]} intensity={1.0} color="#ff9500" distance={30} decay={2} />
      {/* Fill light — dim blue, opposite side */}
      <pointLight position={[-5, -2, 8]} intensity={0.15} color="#3388ff" distance={30} decay={2} />
      {/* Rim light — purple, catches planet edges */}
      <pointLight position={[-10, 5, -10]} intensity={0.3} color="#7b2fff" distance={30} decay={2} />
      {/* Core glow */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#ff9500" distance={20} decay={2} />

      <AmbientParticles />
      <StellarCore />

      {ORBIT_AGENTS.map(({ orbitR, tilt }, i) => (
        <OrbitRing key={i} radius={orbitR} tilt={tilt} />
      ))}

      {ORBIT_AGENTS.map(({ agent, orbitR, tilt, phase, speed }, i) => (
        <AgentNodeOrbit
          key={agent.id}
          agent={agent}
          orbitR={orbitR}
          tilt={tilt}
          phase={phase}
          speed={speed}
          nodePositions={nodePositions}
          index={i}
        />
      ))}

      {beams.map((beam) => {
        const src = nodePositions.current[beam.srcIdx];
        const tgt = nodePositions.current[beam.tgtIdx];
        return (
          <TransactionBeam
            key={beam.id}
            start={src.clone()}
            end={tgt.clone()}
            color={beam.color}
            progress={Math.min(1, beam.progress)}
          />
        );
      })}
    </group>
  );
}

// ─── Agent Node Orbit ────────────────────────────────────────────────────────

function AgentNodeOrbit({
  agent, orbitR, tilt, phase, speed, nodePositions, index,
}: {
  agent: typeof AGENTS[0];
  orbitR: number;
  tilt: number;
  phase: number;
  speed: number;
  nodePositions: React.MutableRefObject<THREE.Vector3[]>;
  index: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const col = CAT_COLORS[agent.category];
  const hexColor = CATEGORY_COLORS[agent.category];
  const radius = 0.22 + (agent.rating / 5) * 0.12;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const angle = phase + t * speed;
    const x = Math.cos(angle) * orbitR;
    const y = Math.sin(tilt) * orbitR * Math.sin(angle);
    const z = Math.sin(angle) * orbitR * Math.cos(tilt);

    if (ref.current) {
      ref.current.position.set(x, y, z);
      ref.current.rotation.y = t * 0.5;
    }
    nodePositions.current[index].set(x, y, z);
  });

  return (
    <group ref={ref}>
      <GlowSphere position={[0, 0, 0]} color={col} radius={radius} intensity={1.2} />
      <AgentLabel position={[0, 0, 0]} name={agent.name.split(" ")[0]} color={hexColor} />
    </group>
  );
}

// ─── Canvas wrapper ─────────────────────────────────────────────────────────

export default function AgentEconomy3D({ compact = false }: { compact?: boolean }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 4, 16], fov: compact ? 55 : 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#000000", 20, 50]} />
      <EconomyScene mousePos={mousePos} compact={compact} />

      {/* Post-processing — Bloom + ChromaticAberration + Vignette */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          radius={0.8}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0006, 0.0006)}
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </Canvas>
  );
}
