# Nexo Jarvis

### Your workspace, at the center of the reactor.

A personal assistant for notes, timers, reminders, voice commands, and live information. Nexo brings a reactive 3D fusion core to a practical workspace, with English and German interfaces and a shared command engine for the browser and Node.js.

**Alpha** · React 19 · TypeScript · Three.js · English / Deutsch

[Open the live demo](https://pierreg99.github.io/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/) · [Deutsch](README.de.md) · [Quick start](#quick-start) · [Command examples](#try-a-command) · [Deployment](#deployment-and-storage)

![Nexo command bay with the animated fusion reactor, navigation, conversation input, and information panels](docs/screenshots/dashboard-en.webp)

_The current desktop interface in browser-local mode. The static demo needs no account or AI key for built-in commands._

## Explore the workspace

| Module                        | What you can do                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| **Command bay**               | Type or speak a command, follow the conversation, and check weather and headlines.             |
| **Knowledge**                 | Save, search, and delete notes; undo a deletion.                                               |
| **Timers & reminders**        | Start countdowns, schedule one-time or recurring reminders, and pause, resume, or cancel them. |
| **Terminal & system monitor** | Inspect tool results, execution traces, permissions, and audit history.                        |
| **Voice controls**            | Choose a browser voice, adjust spoken output, and use English or German speech recognition.    |
| **Settings**                  | Select your language, configure location, and manage workspace preferences and permissions.    |

### A reactor that responds

The fusion core changes with **idle, listening, thinking, and speaking** states. Moving plasma filaments, orbiting particles, magnetic field rings, and shifting light give each state its own rhythm.

- Drag to orbit; scroll or pinch to zoom. Manual camera control lasts until the next assistant state change.
- Open the immersive view for a closer look, or reset the camera with the reset control.
- Particle trails ease into new speeds without jumping to a different position.
- Reduced-motion preferences are respected. A lighter 2D presentation is used when WebGL is unavailable or reduced motion is enabled at startup.

![Immersive reactor view with orbital rings and spatial controls](docs/screenshots/reactor-immersive-en.webp)

### Notes, preferences, and a smaller screen

| Knowledge · English                                                                                                     | Settings · Deutsch                                                              |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ![Knowledge panel containing three example notes created through the command input](docs/screenshots/knowledge-en.webp) | ![German workspace settings and preferences](docs/screenshots/settings-de.webp) |

<p align="center">
  <img src="docs/screenshots/dashboard-mobile-de.webp" alt="German command bay at a 390-pixel phone viewport" width="320" />
</p>

_Fresh captures of the running application. Notes are demonstration content; weather and news depend on location, network access, and their public services. [Screenshot details](docs/screenshots/README.md)._

## Quick start

Use **Node.js 22 or newer** and the pnpm version pinned in [`package.json`](package.json).

```bash
git clone https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha.git
cd Nexo-Jarvis-AI-Futuristic-Assistant-Alpha
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open the local URL printed by the development server. Built-in commands work without an AI key or database. Optional server settings are documented in [`.env.example`](.env.example); copy it to `.env` when you need to customize them.

### Your first minute

1. Select **EN** or **DE** in the header. On first use, Nexo follows your browser language.
2. Enter `Remember: review the launch checklist`, then open **Knowledge** to find the note.
3. Enter `Set a 5 min timer for tea`, then open **Timers & reminders** to manage it.
4. Explore the reactor or enable voice input if your browser supports speech recognition.

## Try a command

| English                                 | Deutsch                                    | Result                                |
| --------------------------------------- | ------------------------------------------ | ------------------------------------- |
| `Remember: review the launch checklist` | `Merke dir: Startliste prüfen`             | Save a note                           |
| `Read my notes`                         | `Zeige meine Notizen`                      | List saved notes                      |
| `Find notes about launch`               | `Suche Notizen zu Start`                   | Search notes                          |
| `Set a 5 min timer for tea`             | `Stelle einen Timer auf 5 Minuten`         | Start a countdown                     |
| `Remind me in 1 hour to stretch`        | `Erinnere mich in 1 Stunde ans Dehnen`     | Add a one-time reminder               |
| `Remind me every 30 minutes to stretch` | `Erinnere mich alle 30 Minuten ans Dehnen` | Add a recurring reminder              |
| `Show timers`                           | `Zeige Timer`                              | List active tasks                     |
| `Weather` / `News`                      | `Wetter` / `Nachrichten`                   | Read current public data              |
| `System status` / `Help`                | `Systemstatus` / `Hilfe`                   | Inspect the workspace / list commands |

Timers accept seconds, minutes, hours, and combined durations up to seven days. Configure exact calendar dates and recurring intervals in **Timers & reminders**. Completed tasks appear in the notification center; desktop notifications are optional.

## Choose how to run it

|                           | Browser / static hosting                         | Node.js server                                       |
| ------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Built-in command engine   | Runs in the browser                              | Runs on the server                                   |
| Workspace storage         | `localStorage` in the current browser profile    | File-backed workspaces in `NEXO_DATA_DIR`            |
| Timers and reminders      | Checked while open and on reopening              | Scheduled by the running server process              |
| Optional AI conversations | Unavailable                                      | OpenAI-compatible or existing Manus provider         |
| Typical use               | Try the demo or host a static personal workspace | Run a persistent personal assistant with optional AI |

Browser and server storage are separate; switching modes does not synchronize your notes. Clearing browser site data removes the local workspace. Neither mode connects an external calendar provider yet.

## Location, natural voices, and account sync

- **Location:** search a city/postcode, enter coordinates, or explicitly request your current location. City search needs no API key. Android alpha 2 supports approximate location permission.
- **Natural voices:** choose browser voices or server-configured OpenAI/ElevenLabs voices. Keys stay on the server; natural voices require sign-in by default.
- **OAuth and sync:** sign in with Google or Microsoft on the Node server to use the same workspace across devices. Visible views refresh every ten seconds. Importing notes from before sign-in is an explicit choice.
- **Performance:** instanced turbine vanes, static reflections, paused background rendering, and automatic/battery/high-detail modes. The controlled rendering check submitted about 59% fewer draw calls and 85% fewer triangles per frame.

[Provider and OAuth setup](docs/PROVIDERS.md) · [Measurement method and quality modes](docs/PERFORMANCE.md).

## Android APK

The Android alpha bundles this interface and its local command engine in a WebView app for **Android 8.0 or newer**. Notes and preferences stay on the device. Weather and news still require network access.

```bash
corepack pnpm android:build
```

This requires JDK 21 and Android SDK 35. The output is `artifacts/nexo-jarvis-1.0.0-alpha.2-debug.apk`. The [Android workflow](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/actions/workflows/android.yml) also makes the APK, checksum, and lint report downloadable after a successful run.

This is a debug-signed alpha. Native speech, background alarms, native notifications, and remote-server selection are not included yet. [Build, installation, and limitations](docs/ANDROID.md).

## Optional AI conversations

Configure a provider on a private Node.js server using environment variables:

```dotenv
OPENAI_API_KEY=your-server-side-key
OPENAI_BASE_URL=https://api.openai.com/v1
NEXO_AI_MODEL=gpt-4.1-mini
```

AI conversations require a signed-in user by default. On a private server without OAuth, `NEXO_AI_ALLOW_GUESTS=true` enables them for visitors to that server. Use authenticated access for a public deployment. Recent conversation entries and relevant saved notes are sent to the configured provider when you use AI chat; notes, timers, and other commands continue to use Nexo's validated tool engine.

An existing Manus provider can be configured with `BUILT_IN_FORGE_API_KEY` and `BUILT_IN_FORGE_API_URL`.

## Deployment and storage

### Node.js server

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

The server exposes `/api/health` and the workspace API at `/api/trpc`. Set `NEXO_DATA_DIR` to choose the directory for workspace files; the default is `.nexo-data/`. Keep this directory on persistent storage and include it in backups. File-backed storage and the reminder scheduler are intended for one Node.js process. Multi-instance deployments need shared storage and a coordinated scheduler.

### Static hosting

GitHub Pages builds set the repository base path automatically. To build for this repository's Pages URL manually:

```bash
VITE_BASE_PATH=/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/ corepack pnpm build
```

Static mode uses the same command engine and browser `localStorage`; it has no server API or server-side AI provider. Browser reminders need the page to be open. A closed or suspended browser cannot wake for a reminder, so Nexo checks overdue tasks when you reopen it.

## Architecture

| Location                                   | Responsibility                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| [`client/src/`](client/src/)               | React interface, voice controls, browser integration, and the Three.js reactor    |
| [`shared/nexo/`](shared/nexo/)             | Command parsing, schemas, tool registry, notes, timers, and reminders             |
| [`shared/i18n.ts`](shared/i18n.ts)         | English and German translations and localized formatting                          |
| [`server/`](server/)                       | Node.js API, persistent workspaces, scheduling, and optional provider integration |
| [`.github/workflows/`](.github/workflows/) | Type checks, tests, production builds, and GitHub Pages deployment                |

Tools declare `read`, `write`, or `high-risk` permissions. Read-only mode blocks writes. High-risk tools need extra confirmation, and the public assistant API only accepts read and write tools. AI conversation replies cannot invoke tools.

## Development checks

```bash
corepack pnpm check   # TypeScript
corepack pnpm test    # Test suite
corepack pnpm build   # Client and server production bundles
```

The same checks run in the quality and Pages workflows. Include both English and German copy when changing user-facing text. For visual changes, check desktop, mobile, and reduced-motion views; update the [screenshot gallery](docs/screenshots/README.md) when the visible interface changes.

## Current boundaries

- **Speech and notifications:** availability depends on browser support and permissions. Text input remains available.
- **Live information:** weather needs a location; weather and news need network access to public services.
- **Browser reminders:** a closed or suspended browser cannot wake itself. Overdue tasks are checked when Nexo reopens.
- **Persistence:** back up server workspace files. The current file store and scheduler target a single Node.js process.
- **AI chat:** optional and server-side; recent conversation entries and relevant notes are sent to the configured provider when used.
- **Calendar:** the interface describes provider options, but external calendars are not connected.

## Project documentation

[Changelog](CHANGELOG.md) · [Delivery plan](PLAN.md) · [Handover](HANDOVER.md) · [Android guide](docs/ANDROID.md)
