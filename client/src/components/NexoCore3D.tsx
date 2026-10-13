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
        emissiveIntensity={0.42}
        metalness={0.96}
        roughness={0.24}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function createPlasmaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const veil = context.createLinearGradient(0, 0, 0, canvas.height);
  veil.addColorStop(0, "rgba(255,255,255,0)");
  veil.addColorStop(0.2, "rgba(255,255,255,0.12)");
  veil.addColorStop(0.38, "rgba(255,255,255,0.44)");
  veil.addColorStop(0.5, "rgba(255,255,255,0.92)");
  veil.addColorStop(0.62, "rgba(255,255,255,0.44)");
  veil.addColorStop(0.8, "rgba(255,255,255,0.12)");
  veil.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = veil;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "lighter";

  // Seamless curved filaments turn the torus into a band of moving plasma.
  for (let strand = 0; strand < 46; strand += 1) {
    const cycles = 2 + (strand % 7);
    const phase = strand * 1.71;
    const amplitude = 0.015 + ((strand * 13) % 19) / 150;
    context.beginPath();
    for (let x = 0; x <= canvas.width; x += 8) {
      const progress = x / canvas.width;
      const y =
        canvas.height *
        (0.5 +
          Math.sin(progress * Math.PI * 2 * cycles + phase) * amplitude +
          Math.sin(progress * Math.PI * 2 * (cycles + 3) - phase) * 0.025);
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = `rgba(255,255,255,${0.06 + (strand % 5) * 0.035})`;
    context.lineWidth = strand % 9 === 0 ? 3 : strand % 3 === 0 ? 1.8 : 1;
    context.stroke();
  }

  for (let flare = 0; flare < 18; flare += 1) {
    const x = ((flare * 223 + 71) % canvas.width) + 0.5;
    const y = canvas.height * (0.5 + Math.sin(flare * 2.4) * 0.13);
    const radius = 4 + (flare % 5) * 1.8;
    const halo = context.createRadialGradient(x, y, 0, x, y, radius);
    halo.addColorStop(0, "rgba(255,255,255,0.7)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = halo;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function PlasmaBand({
  state,
  reducedMotion,
  color,
  speed,
}: {
  state: NexoCoreState;
  reducedMotion: boolean;
  color: string;
  speed: number;
}) {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useMemo(createPlasmaTexture, []);
  const baseOpacity =
    state === "thinking" ? 0.76 : state === "listening" ? 0.62 : 0.54;

  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(({ clock }, delta) => {
    if (!reducedMotion)
      texture.offset.x = (texture.offset.x + delta * speed + 1) % 1;
    if (material.current) {
      const shimmer = reducedMotion
        ? 0
        : Math.sin(clock.elapsedTime * (2 + speed * 8)) * 0.055;
      material.current.opacity = baseOpacity + shimmer;
    }
  });

  return (
    <mesh rotation={[1.18, 0.12, -0.3]} renderOrder={1}>
      <torusGeometry args={[1.34, 0.084, 24, 192]} />
      <meshBasicMaterial
        ref={material}
        map={texture}
        color={color}
        transparent
        opacity={baseOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function FluxStream({
  state,
  reducedMotion,
  radius,
  tilt,
  color,
  speed,
  phase,
}: {
  state: NexoCoreState;
  reducedMotion: boolean;
  radius: number;
  tilt: [number, number, number];
  color: string;
  speed: number;
  phase: number;
}) {
  const beads = useRef<(THREE.Group | null)[]>([]);
  const activity =
    state === "thinking" ? 1.16 : state === "speaking" ? 1.05 : 0.92;

  useFrame(({ clock }) => {
    const angle = phase + (reducedMotion ? 0 : clock.elapsedTime * speed);
    beads.current.forEach((bead, index) => {
      if (!bead) return;
      const trailAngle = angle - index * 0.085;
      bead.position.set(
        radius * Math.cos(trailAngle),
        radius * Math.sin(trailAngle),
        Math.sin(trailAngle * 2) * 0.028
      );
      const pulse = reducedMotion
        ? 1
        : 0.9 + Math.sin(angle * 2 - index * 0.5) * 0.1;
      bead.scale.setScalar((1 - index * 0.2) * pulse * activity);
    });
  });

  return (
    <group rotation={tilt}>
      {[0, 1, 2, 3].map(index => (
        <group
          key={index}
          ref={bead => {
            beads.current[index] = bead;
          }}
        >
          <mesh>
            <sphereGeometry args={[index === 0 ? 0.074 : 0.056, 20, 20]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
          <mesh scale={2.15}>
            <sphereGeometry args={[index === 0 ? 0.074 : 0.056, 16, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.16 - index * 0.025}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
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
  const fieldRing = useRef<THREE.Mesh>(null);
  const outerHousingRing = useRef<THREE.Mesh>(null);
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
    if (!reducedMotion && fieldRing.current) {
      fieldRing.current.rotation.z += delta * (0.08 + palette.speed * 0.22);
    }
    if (!reducedMotion && outerHousingRing.current) {
      outerHousingRing.current.rotation.z -=
        delta * (0.045 + palette.speed * 0.12);
    }
    if (core.current) {
      const breathing = reducedMotion
        ? 1
        : 1 +
          Math.sin(
            elapsed *
              (state === "thinking" ? 5.5 : state === "listening" ? 1.8 : 2.2)
          ) *
            (state === "thinking"
              ? 0.085
              : state === "listening"
                ? 0.035
                : state === "speaking"
                  ? 0.065
                  : 0.025);
      core.current.scale.setScalar(breathing);
    }
    if (glow.current)
      glow.current.intensity = reducedMotion
        ? palette.intensity
        : palette.intensity +
          Math.sin(
            elapsed *
              (state === "thinking" ? 5.2 : state === "listening" ? 1.8 : 3.1)
          ) *
            (state === "thinking"
              ? 0.52
              : state === "listening"
                ? 0.13
                : state === "speaking"
                  ? 0.3
                  : 0.16);
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
      <mesh ref={fieldRing} rotation={[0.66, -0.22, 0.44]}>
        <torusGeometry args={[1.32, 0.014, 12, 128]} />
        <meshPhysicalMaterial
          color={palette.energy}
          emissive={palette.energy}
          emissiveIntensity={1.15}
          metalness={0.48}
          roughness={0.2}
          clearcoat={1}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={outerHousingRing} rotation={[-0.4, 0.86, -0.1]}>
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

      <PlasmaBand
        state={state}
        reducedMotion={reducedMotion}
        color={palette.energy}
        speed={0.04 + palette.speed * 0.13}
      />
      <FluxStream
        state={state}
        reducedMotion={reducedMotion}
        radius={1.34}
        tilt={[1.18, 0.12, -0.3]}
        color={state === "thinking" ? "#ffe0af" : "#d7ffff"}
        speed={0.25 + palette.speed * 1.1}
        phase={0.25}
      />
      <FluxStream
        state={state}
        reducedMotion={reducedMotion}
        radius={1.56}
        tilt={[-0.42, 0.88, 0.18]}
        color={state === "thinking" ? "#ffb966" : "#6dd5dd"}
        speed={-(0.2 + palette.speed * 0.82)}
        phase={2.2}
      />

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
  const reactorEnergy =
    state === "thinking"
      ? "#ffc078"
      : state === "listening"
        ? "#bafaff"
        : state === "speaking"
          ? "#78e2eb"
          : "#61d9e2";
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
      <div
        className="reactor-field-overlay"
        aria-hidden="true"
        style={{ color: reactorEnergy }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <g className="reactor-field-orbit reactor-field-orbit-primary">
            <ellipse
              className="reactor-field-track"
              cx="50"
              cy="50"
              rx="36"
              ry="13"
              transform="rotate(-7 50 50)"
            />
            <ellipse
              className="reactor-field-runner"
              cx="50"
              cy="50"
              rx="36"
              ry="13"
              transform="rotate(-7 50 50)"
            />
            <circle className="reactor-field-node" cx="86" cy="50" r="0.8" />
            <circle
              className="reactor-field-node reactor-field-node-trail"
              cx="83"
              cy="48"
              r="0.45"
            />
          </g>
          <g className="reactor-field-orbit reactor-field-orbit-secondary">
            <ellipse
              className="reactor-field-track"
              cx="50"
              cy="50"
              rx="18"
              ry="38"
              transform="rotate(34 50 50)"
            />
            <ellipse
              className="reactor-field-runner"
              cx="50"
              cy="50"
              rx="18"
              ry="38"
              transform="rotate(34 50 50)"
            />
            <circle className="reactor-field-node" cx="50" cy="12" r="0.58" />
          </g>
        </svg>
      </div>
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
