# Screenshot gallery

These images show the current turbine/location/account update with the reactor image backdrop removed. The captured interface is included in revision `dbd8254`. They were captured on **15 October 2026** in Chromium with the Europe/Berlin time zone and exported as WebP.

| File                                                   | View                                                        | Viewport    | Language |
| ------------------------------------------------------ | ----------------------------------------------------------- | ----------- | -------- |
| [dashboard-en.webp](dashboard-en.webp)                 | Command bay, animated WebGL reactor, and information panels | 1440 × 1000 | English  |
| [reactor-immersive-en.webp](reactor-immersive-en.webp) | Immersive reactor with spatial controls                     | 1440 × 1000 | English  |
| [knowledge-en.webp](knowledge-en.webp)                 | Knowledge panel with three sample notes                     | 1440 × 1000 | English  |
| [settings-de.webp](settings-de.webp)                   | Workspace settings; the panel scrolls to additional options | 1440 × 1000 | German   |
| [dashboard-mobile-de.webp](dashboard-mobile-de.webp)   | Command bay at a phone viewport                             | 390 × 844   | German   |

## Capture conditions

- Browser-local mode, with no AI provider, account, or location configured.
- Notes in the knowledge view were entered through the command input. They are sample content, not a user's private workspace.
- Headlines are supplied by the application's public news service. Their content and availability change over time; no news responses were substituted for these captures.
- Desktop, immersive, and mobile reactor views use WebGL. Knowledge and settings views use the normal renderer paused behind their panels, with transitions settled for legibility.
- The mobile capture uses a fresh German browser context. Its viewport is emulated; it is not a photograph or a hardware performance benchmark.
- The screenshots contain no added interface elements. The turbine and its fallback are procedural; neither loads a reactor photo or image backdrop.

## Refresh the gallery

1. From the repository root, build and serve the static client:

   ```bash
   corepack pnpm build
   corepack pnpm exec vite preview --host 127.0.0.1 --port 4173
   ```

2. Open the printed URL in a fresh browser profile. Set the desktop viewport to **1440 × 1000**, use English, and wait for the reactor, fonts, and news request to settle.
3. Capture the command bay. Open **Immersive core**, scroll out until the rings fit, and capture the immersive view.
4. For the knowledge panel, enter these commands and wait for each confirmation:

   ```text
   Remember: Review the launch checklist
   Remember: Prepare the next design review
   Remember: Explore voice commands in English and German
   ```

5. Enable reduced motion in the browser's rendering settings, reload, and open **Knowledge**. Capture after the panel opens. Switch to German and capture **Einstellungen**.
6. Use a fresh German browser profile at **390 × 844**, with reduced motion off, for the mobile command bay. Wait for the WebGL scene before capturing.
7. Export to WebP, preserving the viewport dimensions. Inspect every image for loading placeholders, clipped content, and private data before replacing the files.
8. Update the capture revision description and date above. Check that both root READMEs link to the same gallery.

The visible clock, news, animation pose, and execution timings will naturally differ between captures.
