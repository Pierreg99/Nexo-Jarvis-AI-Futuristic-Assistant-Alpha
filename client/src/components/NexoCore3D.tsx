import { ContactShadows, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type NexoCoreState = "idle" | "listening" | "thinking" | "speaking";

type NexoCore3DProps = {
  state: NexoCoreState;
  immersive?: boolean;
};

const statePalette: Record<NexoCoreState, { energy: string; intensity: number; speed: number }> = {
  idle: { energy: "#26e4ff", intensity: 1.55, speed: 0.28 },
  listening: { energy: "#78f6ff", intensity: 2.6, speed: 0.72 },
  thinking: { energy: "#ffb14a", intensity: 3.2, speed: 1.85 },
  speaking: { energy: "#62efff", intensity: 2.3, speed: 1.1 },
};

function CameraResponse({ state }: { state: NexoCoreState }) {
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const target = useMemo(() => ({
    idle: new THREE.Vector3(0, 0.1, 6.8),
    listening: new THREE.Vector3(-0.32, 0.18, 6.25),
    thinking: new THREE.Vector3(0.26, 0.42, 5.6),
    speaking: new THREE.Vector3(0, -0.18, 5.95),
  })[state], [state]);

  useFrame((_, delta) => {
    perspectiveCamera.position.lerp(target, 1 - Math.exp(-delta * 1.65));
    perspectiveCamera.fov += ((state === "thinking" ? 35 : state === "listening" ? 40 : 42) - perspectiveCamera.fov) * (1 - Math.exp(-delta * 1.4));
    perspectiveCamera.updateProjectionMatrix();
  });

  return null;
}

function OrbitRing({ radius, tube, tilt, speed, color }: { radius: number; tube: number; tilt: [number, number, number]; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });

  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, tube, 24, 112]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.92} roughness={0.2} />
    </mesh>
  );
}

function NexoMachine({ state }: { state: NexoCoreState }) {
  const palette = statePalette[state];
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);

  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#07131a",
    metalness: 0.92,
    roughness: 0.17,
    transmission: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  }), []);

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y += delta * palette.speed * 0.18;
      group.current.rotation.x = Math.sin(elapsed * 0.27) * 0.09;
    }
    if (core.current) {
      const breathing = 1 + Math.sin(elapsed * (state === "thinking" ? 5.5 : 2.2)) * (state === "thinking" ? 0.12 : 0.055);
      core.current.scale.setScalar(breathing);
    }
    if (glow.current) glow.current.intensity = palette.intensity + Math.sin(elapsed * 3.1) * 0.35;
  });

  return (
    <group ref={group}>
      <pointLight ref={glow} color={palette.energy} intensity={palette.intensity} distance={9} decay={2} />
      <pointLight position={[-3.5, 2, 2]} color="#8eefff" intensity={2.4} distance={7} />
      <pointLight position={[2, -3, 1]} color="#ffb14a" intensity={1.15} distance={5} />
      <directionalLight position={[4, 4, 5]} color="#c8faff" intensity={2.2} />

      <mesh material={material} scale={[1.34, 1.34, 0.84]}>
        <sphereGeometry args={[1.45, 96, 96]} />
      </mesh>
      <mesh scale={[1.13, 1.13, 0.87]}>
        <sphereGeometry args={[1.45, 96, 96]} />
        <meshPhysicalMaterial color="#2ee8ff" transparent opacity={0.13} metalness={0.22} roughness={0.08} transmission={0.58} thickness={0.5} clearcoat={1} />
      </mesh>
      <mesh scale={[1.26, 1.26, 0.81]} rotation={[0.48, 0.2, 0]}>
        <icosahedronGeometry args={[1.42, 3]} />
        <meshBasicMaterial color="#4deaff" wireframe transparent opacity={0.14} />
      </mesh>

      <mesh rotation={[1.2, 0.12, -0.3]}>
        <torusGeometry args={[1.34, 0.018, 20, 96]} />
        <meshStandardMaterial color="#7cf6ff" emissive="#26e4ff" emissiveIntensity={0.9} metalness={0.85} roughness={0.18} />
      </mesh>

      <mesh ref={core}>
        <sphereGeometry args={[0.48, 64, 64]} />
        <meshStandardMaterial color="#fff1c9" emissive={palette.energy} emissiveIntensity={3.6} metalness={0.25} roughness={0.18} />
      </mesh>
      <mesh scale={[0.76, 0.76, 0.76]}>
        <sphereGeometry args={[0.52, 64, 64]} />
        <meshBasicMaterial color="#fff9e9" transparent opacity={0.8} />
      </mesh>

      <OrbitRing radius={1.7} tube={0.024} tilt={[0.85, 0.2, 0.22]} speed={palette.speed * 0.42} color="#26e4ff" />
      <OrbitRing radius={1.98} tube={0.016} tilt={[-0.38, 0.68, 0.9]} speed={-palette.speed * 0.34} color="#43c5d8" />
      <OrbitRing radius={2.18} tube={0.014} tilt={[0.22, -0.48, -0.44]} speed={palette.speed * 0.23} color={state === "thinking" ? "#ffb14a" : "#116d81"} />
      <OrbitRing radius={1.06} tube={0.025} tilt={[1.25, 0, 0.32]} speed={palette.speed * 0.9} color="#8cf5ff" />

      <Sparkles count={state === "thinking" ? 130 : 88} scale={[6, 5, 4]} size={state === "speaking" ? 2.7 : 1.8} speed={palette.speed * 0.75} color={palette.energy} noise={1.8} />
      <Stars radius={7} depth={3} count={360} factor={2.3} saturation={0.25} fade speed={0.4} />
    </group>
  );
}

export default function NexoCore3D({ state, immersive = false }: NexoCore3DProps) {
  return (
    <div className={`nexo-webgl-scene ${immersive ? "nexo-webgl-scene-immersive" : ""}`} aria-label="Interactive three-dimensional Nexo core">
      <Canvas dpr={[1, immersive ? 2 : 1.6]} camera={{ position: [0, 0.1, immersive ? 6.2 : 6.8], fov: immersive ? 38 : 42 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <color attach="background" args={["#02080d"]} />
        <fog attach="fog" args={["#02080d", 5.5, 13]} />
        <ambientLight intensity={0.22} color="#8eefff" />
        <NexoMachine state={state} />
        <CameraResponse state={state} />
        <ContactShadows position={[0, -2.25, 0]} opacity={0.58} scale={8} blur={2.4} far={4.5} color="#001e2a" />
        <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.4} maxDistance={8.6} minPolarAngle={0.68} maxPolarAngle={2.3} autoRotate={state !== "thinking"} autoRotateSpeed={statePalette[state].speed * 0.55} />
      </Canvas>
      <div className="nexo-webgl-vignette" aria-hidden="true" />
      <div className="nexo-webgl-reticle" aria-hidden="true"><span /><span /><span /><span /></div>
    </div>
  );
}
