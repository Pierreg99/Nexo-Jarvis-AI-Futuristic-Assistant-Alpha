import { useI18n } from "@/contexts/LanguageContext";
import {
  ContactShadows,
  OrbitControls,
  Sparkles,
  Stars,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import fusionCoreArtwork from "@/assets/nexo-fusion-core.webp";

export type NexoCoreState = "idle" | "listening" | "thinking" | "speaking";

type NexoCore3DProps = {
  state: NexoCoreState;
  immersive?: boolean;
};

const statePalette: Record<
  NexoCoreState,
  { energy: string; intensity: number; speed: number }
> = {
  idle: { energy: "#63d7e3", intensity: 1.25, speed: 0.2 },
  listening: { energy: "#a4ebf0", intensity: 2.1, speed: 0.55 },
  thinking: { energy: "#ffb966", intensity: 2.8, speed: 1.35 },
  speaking: { energy: "#72dbe8", intensity: 1.9, speed: 0.8 },
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function CameraResponse({
  state,
  reducedMotion,
}: {
  state: NexoCoreState;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const target = useMemo(
    () =>
      ({
        idle: new THREE.Vector3(0, 0.1, 6.8),
        listening: new THREE.Vector3(-0.32, 0.18, 6.25),
        thinking: new THREE.Vector3(0.26, 0.42, 5.6),
        speaking: new THREE.Vector3(0, -0.18, 5.95),
      })[state],
    [state]
  );

  useFrame((_, delta) => {
    if (reducedMotion) {
      perspectiveCamera.position.copy(target);
      perspectiveCamera.fov =
        state === "thinking" ? 35 : state === "listening" ? 40 : 42;
      perspectiveCamera.updateProjectionMatrix();
      return;
    }
    perspectiveCamera.position.lerp(target, 1 - Math.exp(-delta * 1.65));
    perspectiveCamera.fov +=
      ((state === "thinking" ? 35 : state === "listening" ? 40 : 42) -
        perspectiveCamera.fov) *
      (1 - Math.exp(-delta * 1.4));
    perspectiveCamera.updateProjectionMatrix();
  });
  return null;
}

function OrbitRing({
  radius,
  tube,
  tilt,
  speed,
  color,
  reducedMotion,
}: {
  radius: number;
  tube: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
  reducedMotion: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current && !reducedMotion) ref.current.rotation.z += delta * speed;
  });
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, tube, 24, 112]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        metalness={0.96}
        roughness={0.24}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function NexoMachine({
  state,
  reducedMotion,
}: {
  state: NexoCoreState;
  reducedMotion: boolean;
}) {
  const palette = statePalette[state];
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);
  const housingMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#202a2d",
        metalness: 0.94,
        roughness: 0.29,
        clearcoat: 0.82,
        clearcoatRoughness: 0.24,
      }),
    []
  );

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    if (!reducedMotion && group.current) {
      group.current.rotation.y += delta * palette.speed * 0.18;
      group.current.rotation.x = Math.sin(elapsed * 0.27) * 0.09;
    }
    if (core.current) {
      const breathing = reducedMotion
        ? 1
        : 1 +
          Math.sin(elapsed * (state === "thinking" ? 5.5 : 2.2)) *
            (state === "thinking" ? 0.12 : 0.055);
      core.current.scale.setScalar(breathing);
    }
    if (glow.current)
      glow.current.intensity = reducedMotion
        ? palette.intensity
        : palette.intensity + Math.sin(elapsed * 3.1) * 0.35;
  });

  return (
    <group ref={group}>
      <pointLight
        ref={glow}
        color={palette.energy}
        intensity={palette.intensity}
        distance={9}
        decay={2}
      />
      <pointLight
        position={[-3.5, 2, 2]}
        color="#9be7ee"
        intensity={1.8}
        distance={6.5}
      />
      <pointLight
        position={[2.3, -2.6, 1.1]}
        color="#d99358"
        intensity={0.9}
        distance={4.5}
      />
      <directionalLight position={[4, 4, 5]} color="#d9f0ef" intensity={1.7} />

      {/* The vessel and field rings give the high-detail core artwork a live, dimensional center. */}
      <mesh material={housingMaterial} scale={[1.02, 1.02, 0.86]}>
        <sphereGeometry args={[1.08, 96, 96]} />
      </mesh>
      <mesh scale={[1.08, 1.08, 0.89]}>
        <sphereGeometry args={[1.08, 96, 96]} />
        <meshPhysicalMaterial
          color="#6fdae4"
          transparent
          opacity={0.065}
          metalness={0.18}
          roughness={0.12}
          transmission={0.72}
          thickness={0.34}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[1.18, 0.12, -0.3]}>
        <torusGeometry args={[1.16, 0.052, 24, 128]} />
        <meshPhysicalMaterial
          color="#68797a"
          metalness={0.96}
          roughness={0.25}
          clearcoat={0.72}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <mesh rotation={[0.66, -0.22, 0.44]}>
        <torusGeometry args={[1.32, 0.014, 12, 128]} />
        <meshPhysicalMaterial
          color="#9ce8e9"
          emissive={palette.energy}
          emissiveIntensity={0.34}
          metalness={0.94}
          roughness={0.22}
          clearcoat={1}
        />
      </mesh>
      <mesh rotation={[-0.4, 0.86, -0.1]}>
        <torusGeometry args={[1.47, 0.024, 16, 128]} />
        <meshPhysicalMaterial
          color="#5c6c6d"
          metalness={0.97}
          roughness={0.28}
          clearcoat={0.7}
        />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[0.31, 64, 64]} />
        <meshStandardMaterial
          color="#fff2d7"
          emissive={palette.energy}
          emissiveIntensity={2.2}
          metalness={0.18}
          roughness={0.2}
        />
      </mesh>
      <mesh scale={[0.66, 0.66, 0.66]}>
        <sphereGeometry args={[0.31, 48, 48]} />
        <meshBasicMaterial color="#fff7e7" transparent opacity={0.68} />
      </mesh>

      <OrbitRing
        radius={1.76}
        tube={0.021}
        tilt={[0.85, 0.2, 0.22]}
        speed={palette.speed * 0.42}
        color="#67cdd4"
        reducedMotion={reducedMotion}
      />
      <OrbitRing
        radius={2.04}
        tube={0.018}
        tilt={[-0.38, 0.68, 0.9]}
        speed={-palette.speed * 0.34}
        color="#688386"
        reducedMotion={reducedMotion}
      />
      <OrbitRing
        radius={2.24}
        tube={0.015}
        tilt={[0.22, -0.48, -0.44]}
        speed={palette.speed * 0.23}
        color={state === "thinking" ? "#eda85e" : "#42676d"}
        reducedMotion={reducedMotion}
      />

      <Sparkles
        count={reducedMotion ? 18 : state === "thinking" ? 84 : 48}
        scale={[5.6, 4.8, 3.5]}
        size={reducedMotion ? 0.8 : state === "speaking" ? 1.8 : 1.1}
        speed={reducedMotion ? 0 : palette.speed * 0.55}
        color="#b4c7c5"
        noise={1.4}
      />
      <Stars
        radius={8}
        depth={4}
        count={reducedMotion ? 56 : 220}
        factor={1.8}
        saturation={0.12}
        fade
        speed={reducedMotion ? 0 : 0.18}
      />
    </group>
  );
}

export default function NexoCore3D({
  state,
  immersive = false,
}: NexoCore3DProps) {
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();
  return (
    <div
      className={`nexo-webgl-scene nexo-core-state-${state} ${immersive ? "nexo-webgl-scene-immersive" : ""}`}
      role="img"
      aria-label={t("Interactive three-dimensional Nexo core, {state} state", {
        state: t(state),
      })}
    >
      <Canvas
        dpr={[1, immersive ? 2 : 1.6]}
        camera={{
          position: [0, 0.1, immersive ? 6.2 : 6.8],
          fov: immersive ? 38 : 42,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <fog attach="fog" args={["#05090c", 5.5, 13]} />
        <ambientLight intensity={0.34} color="#b1c9c9" />
        <NexoMachine state={state} reducedMotion={reducedMotion} />
        <CameraResponse state={state} reducedMotion={reducedMotion} />
        <ContactShadows
          position={[0, -2.25, 0]}
          opacity={0.58}
          scale={8}
          blur={2.4}
          far={4.5}
          color="#001e2a"
        />
        <OrbitControls
          enablePan={false}
          enableDamping={!reducedMotion}
          dampingFactor={0.08}
          minDistance={4.4}
          maxDistance={8.6}
          minPolarAngle={0.68}
          maxPolarAngle={2.3}
          autoRotate={!reducedMotion && state !== "thinking"}
          autoRotateSpeed={statePalette[state].speed * 0.55}
        />
      </Canvas>
      <img
        className="nexo-webgl-artwork"
        src={fusionCoreArtwork}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="nexo-webgl-vignette" aria-hidden="true" />
      {!reducedMotion && (
        <div className="nexo-webgl-reticle" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
