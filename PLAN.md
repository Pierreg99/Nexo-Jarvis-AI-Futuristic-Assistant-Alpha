# Delivery plan

This is the current project plan. [HANDOVER.md](HANDOVER.md) records the delivered state and verification; [CHANGELOG.md](CHANGELOG.md) records changes. Older `NEXO2_*` files and prototype plans remain as historical context, not the active backlog.

## This delivery

| Work                               | Status      | Acceptance                                                                                     |
| ---------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| English and German README overhaul | Implemented | Matching feature coverage, working local links, clear setup and runtime limits                 |
| Screenshot refresh                 | Captured    | Current desktop, mobile, immersive, knowledge, and German settings views; all images inspected |
| Changelog and operational handover | Implemented | Historical entries retained; current changes and remaining work distinguished                  |
| Android wrapper and build script   | Implemented | Bundled root-path web client, local storage, external links, Back handling, and adaptive icon  |
| APK verification                   | Verified    | `assembleDebug`, Android lint, APK signature, and bundled assets checked                       |
| Android CI                         | Verified    | Workflow uploads a debug APK, checksum, and lint report after checks                           |
| Physical-device acceptance         | Pending     | Checklist in [docs/ANDROID.md](docs/ANDROID.md) completed on Android hardware                  |

## Next: Android release readiness

1. **Run the device acceptance checklist.** Check Android 8 and a current Android version, keyboard and system-bar layout, WebGL fallback, local persistence, EN/DE, and external links. Record device model, Android version, and System WebView version.
2. **Add workspace export and import.** Provide a versioned export format with validation before changing stored data. Verify a restore into a clean installation, including notes and reminder settings.
3. **Establish release signing.** Keep the signing key outside Git, store its CI credentials securely, increment version codes, and verify an upgrade preserves data. Produce a signed release APK or AAB only after the device checks pass.
4. **Prepare distribution metadata.** App description, device screenshots, privacy disclosure, and accurate data-safety declarations must match the actual release behavior. Confirm the target SDK meets the distribution channel’s current requirements.

## Then: native Android features

| Feature                            | Completion criteria                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Native reminders and notifications | Permission-aware scheduling, no duplicate delivery after resume, cancellation and recurring tasks verified across app restarts   |
| Speech input and output            | Explicit permission flow, German/English selection, unavailable-service handling, and a working text fallback                    |
| Location access                    | Request access only after a user action; retain manual coordinates; handle denial and revocation                                 |
| Optional server connection         | Explicit user-configured HTTPS endpoint, authenticated requests, documented data ownership, and no silent replay of local writes |

These are future tasks. The current APK does not claim native speech, background alarms, notifications, location access, or a server connection.

## Web and engine improvements

- Measure reactor frame times and memory use on representative phones before choosing adaptive rendering quality.
- Profile the lazy-loaded Three.js bundle and reduce download cost where measurements justify it.
- Validate external calendar integrations end to end before changing the current disconnected UI state.
- Add shared storage and a coordinated scheduler before supporting multiple server processes.
- Keep translated copy and the screenshot gallery aligned with visible behavior.

## Definition of done

A change is complete when its intended behavior is documented, relevant checks pass, user-visible limitations are stated accurately, and the change is committed. Android build success is separate from device acceptance and release readiness. Do not mark a planned native feature complete merely because the web interface contains a corresponding control.
