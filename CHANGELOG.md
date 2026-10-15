# Changelog

User-visible changes are listed newest first. Historical version headings below are retained from the original project log; they are not a claim that matching GitHub releases were published.

## Unreleased — Turbine, location, natural voices, and account sync

### Added

- Removed the reactor photo backdrop from WebGL and fallback views; the turbine is fully procedural.
- An instanced 24-vane metallic turbine, procedural studio reflections, automatic/battery/high-detail rendering modes, frame caps, and visibility-aware rendering suspension.
- City/postcode search via Open-Meteo and explicit browser GPS requests; Android alpha 2 adds approximate location permission.
- Server-side OpenAI and ElevenLabs speech output, selectable voices, cancellation, bounded input/audio, and per-account request limits.
- Google/Microsoft OAuth sign-in with state, PKCE, verified identity tokens, and isolated persistent account workspaces. Visible clients refresh every ten seconds.
- Explicit pre-login note import with duplicate skipping. Existing local and guest workspaces remain separate.
- Provider setup and performance measurement documentation; OAuth/voice integration tests.

### Validation

The controlled Chromium check submitted 31 draw calls and 39,378 triangles per frame, compared with 76 and 266,314 at the baseline. These are rendering counters, not physical-device frame-rate or battery measurements. Live OAuth and provider voices require configured credentials; account and provider behavior was tested with controlled signed/token/audio responses.

## 2026-10-15 — Android alpha and documentation refresh

### Added

- Android WebView packaging for the bundled browser client, with local storage, external-browser links, Android Back handling, and an adaptive launcher icon.
- An APK build script, a pinned Gradle wrapper, and a GitHub Actions workflow that produces a debug APK, checksum, and lint report.
- Android setup and limitation notes in [docs/ANDROID.md](docs/ANDROID.md).
- A delivery plan in [PLAN.md](PLAN.md) and operational handover in [HANDOVER.md](HANDOVER.md).
- New immersive-reactor and knowledge-panel screenshots, plus capture instructions.

### Changed

- Rebuilt the English and German READMEs with a visual gallery, first-run walkthrough, command examples, runtime comparison, and deployment guidance.
- Replaced the desktop dashboard, German settings, and German mobile screenshots with current captures.

## 2026-10-15 — Reactor interaction refinement

Source: [`165dfdd`](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/commit/165dfdd).

- Particle trajectories retain their phase and ease into new speeds when assistant state changes.
- Automatic camera positioning yields to drag and zoom until the next state change.
- Immersive camera framing is preserved, reduced-motion preference is read on initial render, and the secondary plasma trail loops at its own dash period.

## 2026-10-13 — Reactor animation and artwork

Sources: [`fbd21ac`](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/commit/fbd21ac), [`f3362ef`](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/commit/f3362ef).

- Integrated detailed reactor artwork with the live Three.js scene.
- Added procedural plasma filaments, particle trails, rotating field rings, and state-reactive lighting.
- Updated the English and German documentation and screenshot gallery.

## Historical project entries

## [0.3.0] — Live-Dashboard

### Hinzugefügt

Das Dashboard enthält ein Live-Wettermodul mit browserseitiger Standortfreigabe, aktueller Temperatur, gefühlter Temperatur, Wetterlage, Windgeschwindigkeit und Zeitzone. Das Modul besitzt Lade-, Fehler- und Berechtigungszustände und vermeidet Schätzdaten bei verweigerter Standortfreigabe.

Das Nachrichtenmodul lädt aktuelle verlinkbare Technologie-Schlagzeilen aus der Hacker-News-Algolia-Schnittstelle. Eine manuelle Aktualisierung, Aktualisierung beim Fensterfokus sowie sichtbare Lade- und Fehlerzustände sind enthalten.

Das Kalendermodul besitzt einen Verbindungsdialog mit Google-Calendar- und Outlook-Calendar-Auswahl. Da der Nutzer keine externe Kalenderanbindung aktiviert hat, bleibt der Zustand sicher nicht verbunden und zeigt keine künstlichen Ereignisse.

Die Live-Module wurden in das Orbital-Instrumentation-Design integriert und für Desktop, Tablet und Mobilansicht geprüft.

### Technisch

Die Fullstack-Grundlage mit Express, tRPC, Drizzle, Authentifizierung und Vitest wurde ergänzt. `server/liveData.ts` kapselt Datentypen, öffentliche Datenquellen und Wettercode-Normalisierung. Unit-Tests prüfen die Wettercode-Normalisierung.

## [0.2.0] — Orbital Instrumentation

### Hinzugefügt

Die zentrale Command-Bay wurde mit holografischem Kern, radialen Orbitalringen, Telemetrie, Signalpfaden, Sprachsteuerung, lokaler Befehlsverarbeitung und responsiven Peripheriemodulen umgesetzt.

### Design

Die visuelle Sprache verwendet Graphit, Nexo Cyan und sparsame Amber-Zustände. Die zentrale Nexo-Prism-Marke und die generierten Atmosphären-Assets wurden in die Oberfläche eingebunden.

## [0.1.0] — Initiale Oberfläche

### Hinzugefügt

Grundstruktur des Nexo-Jarvis-Webprojekts mit React, Navigation, Command-Bay-Shell und erster interaktiver Assistentenansicht.
