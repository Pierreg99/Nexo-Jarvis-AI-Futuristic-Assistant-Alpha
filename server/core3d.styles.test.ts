import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Nexo core 3D motion styling", () => {
  const stylesheet = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

  it("keeps the core spatial and interactive styling present", () => {
    expect(stylesheet).toContain("perspective: 900px");
    expect(stylesheet).toContain(".core-depth");
    expect(stylesheet).toContain(".core-particle");
  });

  it("keeps a reduced-motion escape hatch for accessibility", () => {
    expect(stylesheet).toContain("@media (prefers-reduced-motion: reduce)");
    expect(stylesheet).toContain("animation-duration: 0.01ms");
  });
});
