import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("maximized command deck", () => {
  const main = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
  const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
  const styles = readFileSync(resolve(process.cwd(), "client/src/nexo-maximized.css"), "utf8");

  it("loads the maximized layer after the redesign layers so it can override them", () => {
    expect(main.indexOf("./nexo-maximized.css")).toBeGreaterThan(main.indexOf("./nexo-redesign-v2.css"));
  });

  it("locks the desktop deck to the viewport and sizes the core from its container", () => {
    expect(styles).toContain("@media (min-width: 1280px) and (min-height: 760px)");
    expect(styles).toContain("height: 100dvh");
    expect(styles).toContain("container-type: size");
    expect(styles).toContain("100cqh");
    expect(home).toContain("command-core-viewport");
  });

  it("keeps the CORE / LIVE badge from covering the core", () => {
    expect(styles).toMatch(/\.core-stage::before\s*\{[^}]*left: auto;[^}]*bottom: auto;/);
  });

  it("offers a browser fullscreen toggle with a keyboard shortcut", () => {
    expect(home).toContain("requestFullscreen()");
    expect(home).toContain("fullscreenchange");
    expect(home).toContain('aria-keyshortcuts="F"');
    expect(home).toContain('"Enter fullscreen"');
  });
});
