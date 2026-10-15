# Project handover

## Current delivery

Nexo now includes an instanced metallic turbine, quality/frame controls, visibility-aware rendering, city search, explicit GPS, OpenAI/ElevenLabs speech output, and Google/Microsoft sign-in with persistent server workspace sync. English and German UI strings, setup guidance, and screenshots cover these additions.

Android is `ai.nexo.jarvis`, **1.0.0-alpha.2** (version code 2), minimum API 26 / Android 8.0, target API 35. The debug APK bundles the local client and adds approximate location permission. It does not connect to a remote account/voice server.

## Start here

| Document                                                 | Purpose                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| [README.md](README.md) / [README.de.md](README.de.md)    | Overview, gallery, setup, commands, deployment            |
| [docs/PROVIDERS.md](docs/PROVIDERS.md)                   | Location, speech keys, OAuth registrations, sync behavior |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md)               | Rendering changes, quality modes, measurement method      |
| [docs/ANDROID.md](docs/ANDROID.md)                       | APK build/install and device acceptance                   |
| [CHANGELOG.md](CHANGELOG.md) / [PLAN.md](PLAN.md)        | Delivered changes and remaining work                      |
| [docs/screenshots/README.md](docs/screenshots/README.md) | Capture provenance and refresh instructions               |
| [.env.example](.env.example)                             | Optional server credentials and configuration             |

Older `NEXO2_*`, `PROGRESS.md`, and prototype check files remain historical working notes.

## Key paths and design decisions

- `client/src/components/NexoCore3D.tsx`: instanced vanes, procedural reflections, frame scheduler, camera, and visibility controls. The clock advances only while rendering and clamps resume deltas.
- `client/src/hooks/usePreferences.ts`: backward-compatible defaults for quality, voice provider, voice selection, and location label.
- `client/src/components/LocationControls.tsx`: bounded city search and explicit geolocation. The dashboard does not request GPS on startup.
- `client/src/hooks/useSpeechOutput.ts`: shared playback/cancellation, browser voice selection, provider requests, and temporary audio URL cleanup.
- `server/voice.ts`: configured providers, validated voice selection, request quotas, and bounded audio. All keys come from server environment variables.
- `server/account.ts`: OAuth state, PKCE, verified provider identity, and signed seven-day sessions. Access/refresh tokens are not stored.
- `server/_core/context.ts`: authenticated native OAuth profiles expose their verified identity as `ctx.accountId`. Their compatible `User` view has `id: 0`; workspace and quota isolation must use `accountId`, never that placeholder numeric ID. Legacy Manus/SQL users retain their existing actor keys.
- `server/routers.ts`: account capabilities, paid voice access, workspace isolation, and explicit note import with duplicate skipping.
- `client/src/hooks/useAssistant.ts`: visible server workspaces poll every ten seconds and refresh on focus. Existing revision guards protect in-flight client operations from stale refreshes.
- `android/app/src/main/java/ai/nexo/jarvis/MainActivity.java`: local HTTPS assets, external links, lifecycle, Back, and origin-restricted approximate location permission requests.

## Run and configure

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Built-in commands, browser voices, city search, and local storage work without credentials. Configure the server-only values in `.env` for natural voices and OAuth, then restart the server. Exact callback URLs and provider instructions are in the provider guide. Provider buttons stay disabled until their configuration is available.

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm android:build
```

Android builds additionally require JDK 21 and Android SDK Platform/Build Tools 35. The workspace uses npm scripts against its installed dependencies when the global pnpm version differs; fresh setup and CI use the repository-pinned pnpm version.

## Data and sync

- Browser profiles and the standalone APK each keep independent local workspaces/preferences.
- OAuth workspaces use the verified provider/subject as their stable actor. The same provider/account on the same server accesses the same persisted file across devices.
- Different providers remain separate even when email addresses match. This delivery does not connect external calendars or link accounts.
- Pre-login notes can be copied explicitly into the signed-in workspace; timers remain in their original workspace. Browser preferences are not synchronized.
- Server data lives under `NEXO_DATA_DIR` (default `.nexo-data/`). Keep it persistent and backed up. This is a single-process store and scheduler.
- Session signing secrets must remain stable. Rotating the secret invalidates sessions; users can sign in again without changing their account workspace identity.
- Keys, signing material, SDKs, workspace files, generated Android assets, and `artifacts/` are excluded from Git.

## Verification record

| Check                                      | Result                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript                                 | Passed                                                                                                                                                                                                 |
| Tests                                      | 61 passed across 9 files, including OAuth identity/state/PKCE, workspace isolation/import, and speech access/provider/quota tests                                                                      |
| Production build                           | Passed; existing large-chunk advisory remains                                                                                                                                                          |
| Rendering counters                         | 76 → 31 draw calls and 266,314 → 39,378 submitted triangles per sampled frame; see performance guide for limits                                                                                        |
| Browser interaction                        | No startup GPS; city selection, explicit GPS, mocked natural-audio transport/playback, saved quality/language, paused rendering behind panels, and mobile overflow checks passed; no JavaScript errors |
| Android build and lint                     | Alpha 2 built successfully; lint reports no issues                                                                                                                                                     |
| APK signature                              | Verified, debug certificate, APK Signature Scheme v2                                                                                                                                                   |
| Android permissions                        | Internet and approximate location; no fine-location or microphone permission                                                                                                                           |
| Live Google/Microsoft/provider credentials | Not supplied; tested with signed fixture identities and controlled provider responses                                                                                                                  |
| Physical Android device / emulator         | Not run; GPS permission, lifecycle, rendering, and battery acceptance remain pending                                                                                                                   |

Local APK: `artifacts/nexo-jarvis-1.0.0-alpha.2-debug.apk` (2,190,750 bytes). SHA-256: `1db76b071ad30a98fabf1fedb75f87b652459257db6c37acf4c7278f056afc10`. Its generated `.sha256` file records the same checksum. CI creates a separately debug-signed artifact whose checksum can differ.

The [Android workflow](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/actions/workflows/android.yml) runs TypeScript/tests, builds the APK, and uploads the APK, checksum, and lint report for 30 days.

## Published verification

Revision `dbd8254` passed the [quality workflow](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/actions/runs/38722713427), [web deployment](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/actions/runs/38722713439), and [Android workflow](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/actions/runs/38722713384).

[Download the Android alpha 2 artifact ZIP](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/actions/runs/38722713384/artifacts/11966522434). It contains the APK, its checksum, and the Android lint report. Artifact retention is 30 days; run the workflow again after expiry. Live provider consent/playback and physical-device checks remain separate from these build results.

## Next actions

1. Configure real OAuth registrations and speech credentials on a trusted HTTPS server; verify consent, sign-in, account isolation across devices, sign-out, and paid provider playback.
2. Run the Android device checklist, including approximate-location grant/denial/revocation and keyboard/system-bar behavior.
3. Measure GPU frame times, memory, thermals, and battery on representative phones before claiming device-level performance gains.
4. Add portable workspace import/export for Android, native reminder/voice bridges, and a deliberate remote-server connection flow before extending cloud features to the standalone APK.

See the plan for release signing, multi-instance storage, and other acceptance criteria.
