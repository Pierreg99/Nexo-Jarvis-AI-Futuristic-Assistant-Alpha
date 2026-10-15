# Delivery plan

This is the current project plan. [HANDOVER.md](HANDOVER.md) records the delivered state and verification; [CHANGELOG.md](CHANGELOG.md) records changes. Older `NEXO2_*` files and prototype plans remain as historical context, not the active backlog.

## This delivery

| Work                                      | Status                                   | Acceptance                                                                                                      |
| ----------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Turbine realism and rendering cost        | Implemented and measured                 | Instanced vanes, static reflections/shadows, quality/frame caps; submitted work reduced in the controlled check |
| Visibility and interaction                | Browser-verified                         | Paused rendering behind panels; quality/language persist; no mobile horizontal overflow                         |
| Location                                  | Browser-verified; Android build verified | City search, explicit GPS, stored coordinates; native approximate-location permission compiled/linted           |
| Natural voices                            | Provider transport tests passed          | OpenAI/ElevenLabs, authenticated access, configured voice allowlist, request quotas, cancellation/playback      |
| Google/Microsoft OAuth and workspace sync | Signed-fixture tests passed              | PKCE/state/identity verification, same-identity sync, cross-account isolation, explicit note import             |
| Real provider credentials                 | Pending configuration                    | Complete consent and playback checks on the intended HTTPS server                                               |
| Documentation and screenshots             | Updated                                  | English/German feature copy, provider/performance guides, current turbine captures                              |
| Android alpha 2                           | Built and linted                         | APK signature verified; physical-device acceptance remains pending                                              |

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

These are future tasks. The current APK supports approximate location after an explicit request. Native speech, background alarms, notifications, and a remote-server connection remain future work.

## Web and engine improvements

- Measure reactor frame times and memory use on representative phones before choosing adaptive rendering quality.
- Profile the lazy-loaded Three.js bundle and reduce download cost where measurements justify it.
- Validate external calendar integrations end to end before changing the current disconnected UI state.
- Add shared storage and a coordinated scheduler before supporting multiple server processes.
- Keep translated copy and the screenshot gallery aligned with visible behavior.

## Definition of done

A change is complete when its intended behavior is documented, relevant checks pass, user-visible limitations are stated accurately, and the change is committed. Android build success is separate from device acceptance and release readiness. Do not mark a planned native feature complete merely because the web interface contains a corresponding control.
