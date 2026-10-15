# Project handover

## Current delivery

Nexo Jarvis is a React/TypeScript personal command workspace with a Three.js reactor, English/German UI, a shared browser/server command engine, and optional server-side AI conversations. This delivery refreshes the documentation and screenshot gallery and adds a bundled Android alpha app.

The Android application is `ai.nexo.jarvis`, version `1.0.0-alpha.1` (version code 1), targeting API 35 with Android 8.0 as the minimum. It uses AndroidX WebKit to serve bundled client assets over a local HTTPS origin. The default output is debug-signed and intended for evaluation.

## Start here

| Document                                                 | Purpose                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| [README.md](README.md) / [README.de.md](README.de.md)    | Product overview, gallery, setup, commands, and deployment      |
| [CHANGELOG.md](CHANGELOG.md)                             | Current changes and retained historical entries                 |
| [PLAN.md](PLAN.md)                                       | Active delivery plan, remaining work, and acceptance criteria   |
| [docs/ANDROID.md](docs/ANDROID.md)                       | APK build, install, behavior, limitations, and device checklist |
| [docs/screenshots/README.md](docs/screenshots/README.md) | Capture provenance and refresh instructions                     |
| [.env.example](.env.example)                             | Optional server configuration                                   |

Older `NEXO2_*`, `PROGRESS.md`, and prototype design/check files are historical working notes. Use the documents above for the current state.

## Key implementation paths

| Path                                                         | Responsibility                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `client/src/pages/Home.tsx`                                  | Command bay, reactor state, navigation, and information panels    |
| `client/src/components/NexoCore3D.tsx`                       | Three.js reactor, plasma, particle motion, and camera controls    |
| `client/src/nexo-polish.css`                                 | Current visual refinements and CSS reactor overlays               |
| `client/src/components/WorkspacePanels.tsx`                  | Notes, timers, preferences, and other workspace dialogs           |
| `client/src/hooks/useAssistant.ts`                           | Browser/server selection and workspace operations                 |
| `shared/nexo/`                                               | Command parsing, tools, schemas, storage contracts, and reminders |
| `shared/i18n.ts`                                             | Shared translations and formatting                                |
| `server/`                                                    | Node.js API, storage, scheduling, and provider integration        |
| `android/app/src/main/java/ai/nexo/jarvis/MainActivity.java` | Local HTTPS assets, WebView settings, navigation, and lifecycle   |
| `scripts/build-android.mjs`                                  | Fresh web build, Android build/lint, and APK/checksum output      |

## Local workflows

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

For verification:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm android:build
```

The Android command additionally needs JDK 21 and Android SDK Platform/Build Tools 35. See the Android guide for SDK setup. This workspace uses the existing dependency installation via npm scripts when the host's global pnpm version differs from the repository-pinned version; repository setup and CI should use the pinned pnpm version.

## Data and configuration

- Static web mode stores its workspace in that browser profile's `localStorage`.
- Android stores its workspace in WebView-local storage at the app's local origin. It does not synchronize with the website or server. Uninstalling or clearing app data removes it; OS backup is disabled.
- Server workspaces live in `NEXO_DATA_DIR`, default `.nexo-data/`. Keep that directory persistent and backed up. Current scheduling assumes a single server process.
- Provider keys remain server-side. Do not place secrets in `VITE_*` variables or Android assets.
- `android/local.properties`, build outputs, SDKs, signing keys, and `artifacts/` are not tracked.
- The Android Gradle wrapper is pinned with a distribution SHA-256. Gradle copies only `dist/public/` into generated APK assets.

## Verification record

The screenshot gallery was captured from web revision `165dfdd` on 15 October 2026. The desktop capture used the running production build and real public news responses; sample notes were entered through the UI. Knowledge/settings captures used reduced motion. The mobile viewport was emulated, not photographed on Android hardware.

| Check                                 | Result                                                                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript (`npm run check`)          | Passed                                                                                                                                                                                                             |
| Existing test suite (`npm test`)      | 49 tests passed across 7 files                                                                                                                                                                                     |
| Production client build               | Passed; existing large-chunk warning remains                                                                                                                                                                       |
| Android clean build (`assembleDebug`) | Passed                                                                                                                                                                                                             |
| Android lint (`lintDebug`)            | No issues found                                                                                                                                                                                                    |
| APK signature (`apksigner verify`)    | Verified, debug certificate, APK Signature Scheme v2                                                                                                                                                               |
| APK package metadata                  | `ai.nexo.jarvis`, version code 1, minimum SDK 26, target SDK 35, Internet permission only                                                                                                                          |
| APK contents                          | ZIP integrity passed; bundled assets match the offline-tested client; no `.env` or server workspace files                                                                                                          |
| Offline client smoke check            | Extracted APK assets loaded at the same HTTPS origin in Chromium with external requests blocked; note creation/persistence, German preference persistence, and mobile overflow checks passed; no JavaScript errors |
| Documentation                         | Local links resolve; screenshots inspected                                                                                                                                                                         |
| Physical Android device / emulator    | Not run in this environment; acceptance remains pending                                                                                                                                                            |

Local APK: `artifacts/nexo-jarvis-1.0.0-alpha.1-debug.apk` (2,161,320 bytes).

SHA-256:

```text
7785965dde542731bdcf77c62d7e7701d52408b17eb1c0c77d6c02ce69080cd5
```

The APK and its checksum are generated artifacts, excluded from Git. The Android workflow produces its own debug-signed artifact; its checksum can differ because build timestamps and debug signing keys vary. The offline smoke check verifies the packaged web client in Chromium, not the Android activity lifecycle or hardware rendering.

## Known limits and next action

The APK has no native speech bridge, background alarm service, native notifications, automatic location permission, or remote-server selector. Use text input and manual weather coordinates. Foreground timers are available; Android suspension can delay delivery until reopening. Physical-device startup and persistence checks remain required before calling this release-ready.

The existing production build emits a large-chunk warning for the Three.js bundle. Profile on real phones before selecting a performance strategy. Web speech and public data remain subject to platform support and network availability. External calendars remain disconnected.

The next maintainer should start with the Android device checklist, record results, then implement export/import before establishing a persistent release-signing key. See [PLAN.md](PLAN.md) for acceptance criteria.
