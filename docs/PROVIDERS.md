# Location, natural voices, and account sync

The static browser app supports city search, manually entered coordinates, browser location, and browser voices. Natural voice APIs and Google/Microsoft sign-in run on the Node.js server. The standalone APK bundles the local client and does not connect to a remote account server.

## Location

Open **Settings → Weather location**, search for a city or postcode, and select a result. Search uses the public Open-Meteo geocoding API with the selected interface language; no API key is required. Coordinates remain editable.

**Use my location** requests location only after you press it. Denial or timeout leaves city search and manual coordinates available. The selected coordinates and optional city name are saved in that browser/app profile. In Android alpha 2, this button requests Android's approximate location permission; it never requests fine location. Coordinates are sent to Open-Meteo when retrieving weather. Location search terms are sent to Open-Meteo's geocoding service.

## Natural voices

Configure one or both providers in the private server's `.env`, then restart it:

```dotenv
# OpenAI: use a dedicated speech key, or reuse OPENAI_API_KEY.
OPENAI_TTS_API_KEY=your-server-side-speech-key
NEXO_TTS_MODEL=gpt-4o-mini-tts

# ElevenLabs: select a voice available to this provider account.
ELEVENLABS_API_KEY=your-server-side-elevenlabs-key
ELEVENLABS_VOICE_ID=your-voice-id
ELEVENLABS_VOICE_NAME=My natural voice
ELEVENLABS_MODEL=eleven_multilingual_v2
```

Open **Voice controls** or **Settings**, select a configured **Voice provider**, choose a voice, and press **Test voice**. Enable **Speak assistant responses** for replies. Browser voices remain the default and need no Nexo provider key. Cloud voice options require a configured provider and sign-in; their disabled states reflect server capabilities.

OpenAI supports the displayed voice list and uses language instructions with `gpt-4o-mini-tts`. A compatible speech endpoint can be configured using `OPENAI_TTS_BASE_URL`; this is independent of the chat endpoint `OPENAI_BASE_URL`. ElevenLabs uses the configured voice ID and clamps speed to its supported 0.7–1.2 range. Browser/OpenAI controls allow 0.5–1.5.

Speech requests contain the text, selected voice, speed, and language. Spoken text is sent to the chosen provider and can incur API charges. Responses read up to 1,500 characters at a time; the complete reply remains visible. Keys stay on the server and are never returned by the capabilities API or saved in browser preferences. Audio is played from a temporary object URL and released after completion or cancellation.

The server permits at most eight speech requests per minute per signed-in account. Input and provider responses are bounded, and only configured voices can be selected. Use `NEXO_VOICE_ALLOW_GUESTS=true` only on a trusted private evaluation server: it allows guest sessions to spend the configured provider's allowance. For public hosting, decide who can sign in, configure an appropriate Microsoft tenant where relevant, and monitor provider usage and billing.

No real provider credentials were available during implementation. Provider transports were tested with controlled responses; live voice quality and account-specific voice availability must be checked with your configured provider.

## Google and Microsoft sign-in

Set up your server's public URL and a stable random session-signing secret of at least 32 bytes:

```dotenv
NEXO_PUBLIC_URL=https://nexo.example.com
NEXO_SESSION_SECRET=replace-with-a-long-random-secret
NEXO_DATA_DIR=/persistent/nexo-data
```

A configured `JWT_SECRET` of sufficient length can supply the signing secret when `NEXO_SESSION_SECRET` is absent. Use HTTPS for public hosting. HTTP is supported only for `localhost` or `127.0.0.1` development origins. The configured public origin determines callback addresses; request headers cannot change them.

### Google

Create an OAuth **Web application** client in Google Cloud, configure its consent screen/test users, and register this exact redirect URI:

```text
https://nexo.example.com/api/account/google/callback
```

Then set:

```dotenv
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Microsoft

Register a web application in Microsoft Entra, add a web redirect URI, create a client secret, and set:

```dotenv
MICROSOFT_CLIENT_ID=your-application-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
MICROSOFT_TENANT_ID=common
```

Register this exact redirect URI:

```text
https://nexo.example.com/api/account/microsoft/callback
```

`MICROSOFT_TENANT_ID` accepts a tenant UUID, `organizations`, `consumers`, or `common`. The app registration's supported account types must match that choice. A tenant UUID restricts sign-in to that tenant; `common` accepts supported organizational and personal accounts.

Restart the server, open **Settings → Account & workspace sync**, and choose the enabled provider. This flow requests only `openid profile email`. It verifies state, PKCE, identity-token signature, issuer, audience, expiry, and nonce before issuing a seven-day HttpOnly, SameSite=Lax session cookie. Provider access/refresh tokens are not stored. Sign-out clears the current browser session.

## What synchronizes

Notes, timers, reminders, conversation, and workspace history are stored in the authenticated account's server workspace. Sign in to **the same Nexo server using the same provider/account** on another device to access it. Visible workspaces poll every ten seconds and refresh on focus; **Sync now** requests an immediate refresh.

Accounts are keyed by the verified provider and subject, not email. A Google account and a Microsoft account with the same email are separate workspaces. This does not link provider accounts or synchronize external calendars. It also does not sync browser preferences such as voice selection, location, language, or rendering quality.

Signing in opens the account workspace. Existing browser-local and guest workspaces are preserved. If notes exist before sign-in, a copy is kept in that browser and **Import notes from this browser** offers an explicit import after sign-in. It copies up to 200 notes, skips duplicate kind/content pairs, and leaves timers in their original workspace. Read-only mode disables that import button. Use **Export workspace** before switching modes when you need a portable backup.

Persistence uses `NEXO_DATA_DIR`, with one hashed file per account. Keep it on persistent storage and back it up. Run one Node.js process; this delivery does not add a shared database or a distributed scheduler. OAuth and workspace isolation were tested with signed fixture identities; production consent and real provider sign-in still require configured credentials and a browser check.
