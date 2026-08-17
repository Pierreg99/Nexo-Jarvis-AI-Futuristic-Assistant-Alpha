import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("immersive Nexo WebGL core", () => {
  const core = readFileSync(resolve(process.cwd(), "client/src/components/NexoCore3D.tsx"), "utf8");
  const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
  const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

  it("keeps spatial rendering primitives and orbit controls in the scene", () => {
    expect(core).toContain("<Canvas");
    expect(core).toContain("<OrbitControls");
    expect(core).toContain("<Sparkles");
    expect(core).toContain("<ContactShadows");
  });

  it("maps all assistant states into scene palette behavior", () => {
    expect(core).toContain("idle:");
    expect(core).toContain("listening:");
    expect(core).toContain("thinking:");
    expect(core).toContain("speaking:");
    expect(core).toContain("function CameraResponse");
    expect(core).toContain("perspectiveCamera.position.lerp");
  });

  it("keeps WebGL detection, reduced-motion fallback and immersive controls in the command bay", () => {
    expect(home).toContain("prefers-reduced-motion: reduce");
    expect(home).toContain("canvas.getContext(\"webgl2\")");
    expect(home).toContain("Open immersive 3D core");
    expect(home).toContain("Reset 3D core view");
    expect(core).toContain("OrbitControls");
    expect(styles).toContain("touch-action: none");
  });
});
