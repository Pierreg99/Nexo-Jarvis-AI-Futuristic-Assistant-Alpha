# Android APK

Nexo's Android app bundles the web client inside an Android WebView. The interface, reactor artwork, and command engine are included in the APK. Notes and preferences use WebView-local storage, independent of the website and Node.js server.

| Property             | Value                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| Application ID       | `ai.nexo.jarvis`                                                           |
| App version          | `1.0.0-alpha.1` / version code `1`                                         |
| Minimum Android      | Android 8.0 / API 26                                                       |
| Compile / target SDK | API 35                                                                     |
| Java                 | JDK 21 recommended; source compatibility Java 17                           |
| Build tools          | Gradle 8.11.1, Android Gradle Plugin 8.9.2, Android SDK Build Tools 35.0.0 |
| Output               | Debug-signed APK for local installation and evaluation                     |

## Build locally

Install Node.js 22+, the pinned pnpm version, JDK 21, and the Android SDK. Android Studio's SDK Manager can install **Android SDK Platform 35**, **Build Tools 35.0.0**, and **Platform Tools**. Set `ANDROID_HOME` to the SDK directory, or create an untracked `android/local.properties` containing `sdk.dir=/absolute/path/to/android/sdk`.

From the repository root:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm android:build
```

The build script creates a fresh root-path Vite build, runs `assembleDebug` and `lintDebug`, and copies these files into `artifacts/`:

```text
nexo-jarvis-1.0.0-alpha.1-debug.apk
nexo-jarvis-1.0.0-alpha.1-debug.apk.sha256
```

Only `dist/public/` is bundled. The Node.js server, workspace files, and `.env` files are not copied. The script overrides `VITE_BASE_PATH` so a GitHub Pages prefix cannot break Android asset URLs. As with every Vite build, keep secrets out of `VITE_*` variables.

For Android Studio, run `corepack pnpm android:prepare` first, then open the `android/` directory. Gradle copies the prepared client into its generated assets directory. Re-run preparation after web-client changes.

## Install

With USB debugging enabled and a device connected:

```bash
adb install -r artifacts/nexo-jarvis-1.0.0-alpha.1-debug.apk
```

Alternatively, transfer the APK to the device, open it, and allow installation from that source when Android prompts. This is a debug-signed alpha build, not a Play Store release. Debug keys can differ between development machines and CI runs; Android rejects an update signed with a different key. Uninstalling the old build removes its local notes and preferences.

## Build in GitHub Actions

Open the repository's [Android APK workflow](https://github.com/Pierreg99/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/actions/workflows/android.yml) and run it manually, or push a change covered by its path filters. A successful run uploads the APK, SHA-256 checksum, and Android lint report as `nexo-jarvis-android-debug` for 30 days. Download and unzip the artifact to obtain the APK.

The workflow runs TypeScript checks, web tests, the Android build, and Android lint. A green build confirms those checks; it does not replace a physical-device smoke test.

## Behavior and limits

- **Local commands:** notes, timers, reminders, and preferences use the bundled engine and local storage. The reactor uses WebGL when the installed System WebView supports it.
- **Network:** weather and news still need public HTTPS services. Configure weather coordinates manually; this wrapper does not request location access.
- **Speech:** no native speech or microphone bridge is included. Do not assume a browser's speech APIs are available inside Android WebView. Text commands remain the supported input path.
- **Reminders:** this build has no native alarms, background service, or notification bridge. Do not rely on reminders firing while the app is closed or Android suspends it; overdue tasks are checked on return.
- **AI:** no server or provider key is bundled, and this build has no remote-server selection feature.
- **Data:** clearing app storage or uninstalling removes the local workspace. OS backup is disabled for this alpha; there is no cross-device synchronization.
- **Navigation:** HTTPS assets load from `appassets.androidplatform.net` through AndroidX WebKit. External web links open in the browser. Android Back closes a workspace dialog before leaving the app.
- **Permissions:** the manifest declares Internet access only. File and content URL access and cleartext network traffic are disabled; there is no JavaScript-to-native tool bridge.

## Device acceptance checklist

Before distributing a release, test on a real Android device:

- Launch offline and confirm the command bay appears.
- Save a note, force-stop and reopen the app, and verify persistence.
- Switch EN/DE and verify the preference survives reopening.
- Open and close panels with Android Back; check the keyboard and system-bar insets.
- Check the reactor, immersive view, and fallback on devices with different GPU capabilities.
- Open a news link and confirm it uses the external browser.
- Verify foreground timers and overdue reminders after suspension.

Release signing, Play Store metadata, native speech, native notifications, and background scheduling remain future work in [PLAN.md](../PLAN.md).
