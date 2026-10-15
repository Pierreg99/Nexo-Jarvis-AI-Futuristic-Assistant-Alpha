# Reactor performance and turbine rendering

## Changes

- The reactor photo/background asset has been removed from both the 3D view and the CSS fallback. The turbine is procedural geometry; no background image is loaded.
- A 24-vane instanced turbine with swept, bevelled blades replaces the dense opaque vessel and transmissive shell. One shared blade geometry/material draws all vanes.
- Static procedural studio reflections provide metal highlights without downloading an environment map.
- The contact shadow renders once at 128-pixel resolution, rather than refreshing on every frame.
- The main scene pauses behind workspace panels, behind the immersive view, when outside the viewport, and when the document is hidden. CSS plasma animations pause with it.
- The reactor component is memoized so the dashboard's one-second clock does not reconcile the full scene unnecessarily.
- The frame clock clamps resume deltas so returning to a paused view does not produce a large rotation jump.

## Quality controls

Open **Settings → Reactor quality**:

| Setting                                       | Frame cap | Pixel-ratio cap             |
| --------------------------------------------- | --------- | --------------------------- |
| Automatic · desktop                           | 40 fps    | 1.25                        |
| Automatic · compact screen or ≤4 logical CPUs | 30 fps    | 1.0                         |
| Battery saver                                 | 30 fps    | 1.0                         |
| High detail                                   | 60 fps    | 1.6; 1.75 in immersive view |

These are caps, not promised frame rates. Pixel ratio also respects the device's actual ratio. Automatic mode uses viewport width and logical CPU count; it does not run a hardware benchmark. Reduced motion retains the static fallback on startup and stops animation if the preference changes while the 3D scene is mounted.

## Controlled rendering check

The same 1440 × 900 Chromium viewport and software WebGL setup were used before and after the turbine update. WebGL triangle submissions were instrumented around rendered animation frames after initialization. The baseline was revision `b99cf2e`; the candidate included the instanced rotor, removal of transmission, and static contact shadows.

| Submitted work per sampled frame     |  Before |  After |
| ------------------------------------ | ------: | -----: |
| Draw calls                           |      76 |     31 |
| Triangles, including repeated passes | 266,314 | 39,378 |

That is approximately **59% fewer draw calls** and **85% fewer submitted triangles** per frame in this setup. These counters include repeated scene passes; they are not unique model polygon counts. The baseline and final no-image candidate each sampled three frames with identical counts within each sample; an intermediate six-frame sample produced the same candidate counts. Static reflection cards change initialization work without adding per-frame scene geometry.

The check demonstrates lower submitted rendering work. It does not measure battery life, GPU timing, or real-phone frame rates. Software-renderer timing is unsuitable for those claims. Browser interaction checks also verified no WebGL draws after the dashboard paused behind a settings panel.

## Remaining measurement work

Record frame time, memory use, thermal behavior, and battery consumption on representative Android hardware. Check both automatic and high-detail modes, native GPS permission flow, the immersive camera, and fallback behavior with WebGL disabled. The lazy-loaded Three.js bundle still triggers Vite's large-chunk advisory; this pass targets runtime rendering cost rather than claiming a smaller download.
