/**
 * Background galaxy particle field — no postprocessing deps.
 * Glow achieved via additive blending on instanced mesh.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";

function ParticleGalaxy({ mousePos }: { mousePos: { x: number; y: number } }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 14000;
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const { matrices, colors } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];

    for (let i = 0; i < COUNT; i++) {
      const arm = Math.floor(Math.random() * 3);
      const t = Math.pow(Math.random(), 0.7);
      const baseAngle = (arm * 2 * Math.PI) / 3;
      const angle = baseAngle + t * Math.PI * 3 + (Math.random() - 0.5) * 0.6;
      const r = t * 9 + Math.random() * 1.2;

      const isCore = Math.random() < 0.12;
      const px = isCore ? (Math.random() - 0.5) * 2 : Math.cos(angle) * r;
      const py = isCore ? (Math.random() - 0.5) * 2 : Math.sin(angle) * r;
      const pz = (Math.random() - 0.5) * 1.5;

      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(Math.random() * 0.015 + 0.004);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());

      const dist = Math.sqrt(px * px + py * py) / 9;
      const blend = Math.min(1, dist);
      cols.push(new THREE.Color(
        THREE.MathUtils.lerp(1.0, 0.48, blend),
        THREE.MathUtils.lerp(0.58, 0.19, blend),
        THREE.MathUtils.lerp(0.0, 1.0, blend),
      ));
    }
    return { matrices: mats, colors: cols };
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < COUNT; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
      meshRef.current.setColorAt(i, colors[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z += delta * 0.018;

    target.current.x = mousePos.x * 0.4;
    target.current.y = mousePos.y * 0.4;
    current.current.x += (target.current.x - current.current.x) * 0.04;
    current.current.y += (target.current.y - current.current.y) * 0.04;
    meshRef.current.position.x = current.current.x;
    meshRef.current.position.y = current.current.y;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function CoreGlow() {
  const ref = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.scale.setScalar(0.97 + Math.sin(t * 2) * 0.04);
    }
    if (halo.current) {
      halo.current.scale.setScalar(2.5 + Math.sin(t * 1.3) * 0.3);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(t) * 0.03;
    }
  });
  return (
    <group>
      <mesh ref={halo}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#ff9500" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#ffd9a0" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function HeroParticles() {
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
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 13], fov: 58 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ParticleGalaxy mousePos={mousePos} />
        <CoreGlow />
      </Canvas>
    </div>
  );
}
