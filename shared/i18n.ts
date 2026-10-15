export const languages = ["en", "de"] as const;
export type Language = (typeof languages)[number];
export type TranslationValues = Record<string, string | number>;
export const localeFor = (language: Language) =>
  language === "de" ? "de-DE" : "en-GB";

/** English is the source language. User content and technical IDs are never translated. */
export const german = {
  "Choose location": "Standort auswählen",
  "Choose a city or use your location for weather.":
    "Wähle eine Stadt oder verwende deinen Standort für das Wetter.",
  "City search uses Open-Meteo. GPS access starts only when you choose it.":
    "Die Stadtsuche nutzt Open-Meteo. Standortzugriff startet erst, wenn du ihn auswählst.",
  "Location access was denied or timed out. Use city search.":
    "Standortzugriff wurde verweigert oder hat zu lange gedauert. Nutze die Stadtsuche.",
  "Location is unavailable on this device. Use city search.":
    "Standortbestimmung ist auf diesem Gerät nicht verfügbar. Nutze die Stadtsuche.",
  "Use my location": "Meinen Standort verwenden",
  "Location search is unavailable. Try coordinates or GPS.":
    "Ortssuche nicht verfügbar. Nutze Koordinaten oder GPS.",
  "No matching locations found.": "Keine passenden Orte gefunden.",
  "Searching…": "Suche läuft…",
  "Search city or postcode": "Stadt oder Postleitzahl suchen",
  "Speech playback failed. Check your voice provider or browser settings.":
    "Sprachausgabe fehlgeschlagen. Prüfe den Sprachanbieter oder die Browsereinstellungen.",
  "Natural voices use your server’s OpenAI or ElevenLabs key. Spoken text is sent to that provider; API usage may be billed. Browser voices remain available without a key.":
    "Natürliche Stimmen verwenden den OpenAI- oder ElevenLabs-Schlüssel deines Servers. Gesprochener Text wird an diesen Anbieter gesendet; API-Kosten können anfallen. Browserstimmen bleiben ohne Schlüssel verfügbar.",
  "Not configured": "Nicht eingerichtet",
  "Natural voice": "Natürliche Stimme",
  "Browser voices": "Browserstimmen",
  "Voice provider": "Sprachanbieter",
  "High detail": "Hohe Details",
  "Battery saver": "Energiesparmodus",
  Automatic: "Automatisch",
  "Reactor quality": "Reaktorqualität",
  "Import failed. Your saved notes were preserved.":
    "Import fehlgeschlagen. Deine gespeicherten Notizen bleiben erhalten.",
  "Dismiss import": "Import verwerfen",
  "Notes imported": "Notizen importiert",
  "Import notes from this browser": "Notizen aus diesem Browser importieren",
  "Notes from before sign-in are available in this browser. Importing adds notes and skips duplicates; timers stay in their original workspace.":
    "Notizen vor der Anmeldung sind in diesem Browser verfügbar. Der Import fügt Notizen hinzu und überspringt Duplikate. Timer bleiben im ursprünglichen Arbeitsbereich.",
  "Available after OAuth credentials are configured on the server.":
    "Verfügbar, sobald OAuth-Zugangsdaten auf dem Server eingerichtet sind.",
  "Sign in with {provider}": "Mit {provider} anmelden",
  "Sign in on your Node server to open the same workspace on multiple devices. Local and guest workspaces stay separate.":
    "Melde dich auf deinem Node-Server an, um denselben Arbeitsbereich auf mehreren Geräten zu nutzen. Lokale und Gast-Arbeitsbereiche bleiben getrennt.",
  "Sign-out failed. Try again.":
    "Abmeldung fehlgeschlagen. Versuche es erneut.",
  "Sign out": "Abmelden",
  "Sync now": "Jetzt synchronisieren",
  "Workspace refreshed": "Arbeitsbereich aktualisiert",
  "Your notes, timers, and reminders sync through this server. Other signed-in devices refresh every 10 seconds while visible.":
    "Deine Notizen, Timer und Erinnerungen werden über diesen Server synchronisiert. Andere angemeldete Geräte aktualisieren den sichtbaren Arbeitsbereich alle 10 Sekunden.",
  "Account & workspace sync": "Konto & Synchronisierung",
  "Interface language": "Sprache der Oberfläche",
  English: "Englisch",
  Deutsch: "Deutsch",
  "Nexo Jarvis — Command Environment": "Nexo Jarvis — Befehlszentrale",
  "Command bay": "Befehlszentrale",
  Terminal: "Terminal",
  "Execution terminal": "Ausführungsterminal",
  Knowledge: "Wissen",
  "Knowledge & notes": "Wissen & Notizen",
  "Timers & reminders": "Timer & Erinnerungen",
  "Voice controls": "Sprachsteuerung",
  "System monitor": "Systemmonitor",
  Settings: "Einstellungen",
  "Workspace settings": "Arbeitsbereich einrichten",
  Notifications: "Benachrichtigungen",
  "Notifications, {count} unread": "Benachrichtigungen, {count} ungelesen",
  "Toggle navigation": "Navigation öffnen oder schließen",
  "Close navigation": "Navigation schließen",
  "Nexo Prism": "Nexo-Prisma",
  NEXO: "NEXO",
  Jarvis: "Jarvis",
  "Personal command environment": "Persönliche Befehlszentrale",
  "Toggle voice output": "Sprachausgabe umschalten",
  "Workspace modules": "Arbeitsbereich",
  "Quick capture": "Schnellnotiz",
  "New note": "Neue Notiz",
  N: "N",
  "Module /": "Modul /",
  "Good {period}, {name}.": "Guten {period}, {name}.",
  morning: "Morgen",
  afternoon: "Tag",
  evening: "Abend",
  "Session duration": "Sitzungsdauer",
  "Connecting workspace": "Arbeitsbereich wird verbunden",
  "Server disconnected": "Server nicht verbunden",
  "AI conversation online": "KI-Gespräch verfügbar",
  "Command engine ready": "Befehlssteuerung bereit",
  "Awaiting a command": "Bereit für deinen Befehl",
  "Listening — speak freely": "Ich höre zu — sprich einfach",
  "Processing intent": "Befehl wird verarbeitet",
  "Response in progress": "Antwort wird ausgegeben",
  "Voice input · browser native": "Spracheingabe · im Browser",
  Speak: "Sprechen",
  Stop: "Stopp",
  "Runtime mode": "Betriebsmodus",
  "Last execution": "Letzte Ausführung",
  "Active channel": "Aktiver Kanal",
  "Available tools": "Verfügbare Tools",
  "Awaiting input": "Warte auf Eingabe",
  VOICE: "SPRACHE",
  TEXT: "TEXT",
  LOCAL: "LOKAL",
  SERVER: "SERVER",
  CHECKING: "VERBINDEN",
  "Calibrating spatial core": "3D-Kern wird kalibriert",
  "Animated Nexo orbital core": "Animierter orbitaler Nexo-Kern",
  "Reset 3D core view": "3D-Kernansicht zurücksetzen",
  "Open immersive 3D core": "Immersiven 3D-Kern öffnen",
  "Nexo core": "Nexo-Kern",
  "CORE / LIVE": "KERN / LIVE",
  "· fallback": "· Ersatzansicht",
  "· WebGL": "· WebGL",
  "Standing by": "Bereit",
  "Nexo core is {state}": "Nexo-Kern: {state}",
  "Interactive three-dimensional Nexo core, {state} state":
    "Interaktiver dreidimensionaler Nexo-Kern, Zustand: {state}",
  idle: "bereit",
  listening: "hört zu",
  thinking: "verarbeitet",
  speaking: "spricht",
  "Conversation stream": "Gesprächsverlauf",
  messages: "Nachrichten",
  "Ready to help. Save a note, start a timer, or type Help for available commands.":
    "Bereit für dich. Speichere eine Notiz, starte einen Timer oder gib Hilfe ein, um die verfügbaren Befehle zu sehen.",
  "Issue a command": "Befehl eingeben",
  "Issue a command…": "Befehl eingeben…",
  "Executing command…": "Befehl wird ausgeführt…",
  "Send command": "Befehl senden",
  "Retry connection": "Verbindung erneut versuchen",
  "Local weather": "Wetter vor Ort",
  "Reading local telemetry": "Wetterdaten werden geladen",
  Location: "Standort",
  "{condition} · Feels like {temperature}°":
    "{condition} · Gefühlt {temperature}°",
  "Weather relay is temporarily unavailable.":
    "Die Wetterdaten sind vorübergehend nicht verfügbar.",
  "Enable location access to receive weather telemetry.":
    "Erlaube den Standortzugriff, um Wetterdaten zu erhalten.",
  "Locating your command environment…": "Dein Standort wird ermittelt…",
  "Refresh weather": "Wetter aktualisieren",
  "Loading weather data": "Wetterdaten werden geladen",
  "{speed} km/h wind · {timezone}": "{speed} km/h Wind · {timezone}",
  "Awaiting coordinates": "Warte auf Koordinaten",
  "WX · LIVE": "WETTER · LIVE",
  "News relay": "Nachrichten",
  "Current signals": "Aktuelle Meldungen",
  "Refresh news": "Nachrichten aktualisieren",
  "Loading news data": "Nachrichten werden geladen",
  "News relay is temporarily unavailable.":
    "Die Nachrichten sind vorübergehend nicht verfügbar.",
  "NEWS · 10M": "NEWS · 10 MIN",
  "Calendar relay": "Kalender",
  "No external calendar is connected. Timers and scheduled reminders are available in your workspace.":
    "Es ist kein externer Kalender verbunden. Timer und geplante Erinnerungen sind in deinem Arbeitsbereich verfügbar.",
  "Open timers & reminders": "Timer & Erinnerungen öffnen",
  "Calendar provider information": "Informationen zur Kalenderanbindung",
  "CAL · SECURE": "KAL · SICHER",
  Network: "Verbindung",
  "Server workspace connected": "Server-Arbeitsbereich verbunden",
  "Browser-local workspace": "Lokaler Browser-Arbeitsbereich",
  "Next reminder": "Nächste Erinnerung",
  "No active countdowns": "Keine aktiven Timer",
  "Ambient state": "Aktueller Modus",
  "Read-only mode": "Nur-Lesen-Modus",
  "Voice output enabled": "Sprachausgabe aktiviert",
  "Silent output": "Sprachausgabe aus",
  "Calendar relay / secure link": "Kalender / sichere Verbindung",
  "Calendar integrations": "Kalenderanbindung",
  "Google and Outlook calendar connectors are not configured in this installation. Use workspace reminders now; connecting an external calendar requires a provider integration and account authorization.":
    "Google- und Outlook-Kalender sind in dieser Installation nicht eingerichtet. Nutze die Erinnerungen im Arbeitsbereich. Für externe Kalender werden eine Anbieterintegration und eine Kontofreigabe benötigt.",
  "Google Calendar": "Google Kalender",
  "Outlook Calendar": "Outlook-Kalender",
  "View your next events and focus windows.":
    "Nächste Termine und Fokuszeiten anzeigen.",
  "View your Microsoft 365 calendar signals.":
    "Deine Microsoft-365-Kalendertermine anzeigen.",
  Selected: "Ausgewählt",
  "Not connected": "Nicht verbunden",
  "Authorization for {provider} must be approved before data can be read.":
    "Der Zugriff auf {provider} muss freigegeben werden, bevor Daten gelesen werden können.",
  "No authorization request is sent from this panel. Calendar connectors require additional provider setup.":
    "Dieses Fenster sendet keine Freigabeanfrage. Für die Kalenderanbindung muss der Anbieter zusätzlich eingerichtet werden.",
  "Immersive core / spatial control": "Immersiver Kern / 3D-Steuerung",
  "Drag to orbit · Scroll or pinch to zoom":
    "Ziehen zum Drehen · Scrollen oder Pinch-Geste zum Zoomen",
  "Reset immersive 3D core": "Immersiven 3D-Kern zurücksetzen",
  "Close immersive 3D core": "Immersiven 3D-Kern schließen",
  "Calibrating immersive scene…": "Immersive Szene wird kalibriert…",
  "The immersive WebGL scene is unavailable on this device. The command-bay fallback remains active.":
    "Die immersive WebGL-Szene ist auf diesem Gerät nicht verfügbar. Die Ersatzansicht der Befehlszentrale bleibt aktiv.",
  "Connected workspace · changes are saved on your server.":
    "Verbundener Arbeitsbereich · Änderungen werden auf deinem Server gespeichert.",
  "Personal workspace · saved in this browser.":
    "Persönlicher Arbeitsbereich · in diesem Browser gespeichert.",
  Dismiss: "Schließen",
  Close: "Schließen",
  "Read-only mode is enabled. Turn it off in Settings to save changes.":
    "Der Nur-Lesen-Modus ist aktiv. Deaktiviere ihn in den Einstellungen, um Änderungen zu speichern.",
  "Capture a note, fact or preference…":
    "Notiz, Fakt oder Präferenz festhalten…",
  Type: "Typ",
  note: "Notiz",
  fact: "Fakt",
  preference: "Präferenz",
  task: "Aufgabe",
  conversation: "Gespräch",
  "Save note": "Notiz speichern",
  "Note saved": "Notiz gespeichert",
  "Note deleted": "Notiz gelöscht",
  Undo: "Rückgängig",
  "Search notes and tags…": "Notizen und Tags durchsuchen…",
  "Search saved notes": "Gespeicherte Notizen durchsuchen",
  notes: "Notizen",
  "Delete note: {content}": "Notiz löschen: {content}",
  "No notes match your search.": "Keine Notiz passt zu deiner Suche.",
  "Your saved notes will appear here.":
    "Deine gespeicherten Notizen erscheinen hier.",
  "Timer title": "Timer-Titel",
  Timer: "Timer",
  Duration: "Dauer",
  "5 min": "5 min",
  "Start timer": "Timer starten",
  "Timer started": "Timer gestartet",
  "Countdown for {title}": "Restzeit für {title}",
  Cancel: "Abbrechen",
  "No active countdowns.": "Keine aktiven Timer.",
  Reminder: "Erinnerung",
  "Stretch, drink water, review notes…":
    "Dehnen, Wasser trinken, Notizen prüfen…",
  "One-time reminder": "Einmalige Erinnerung",
  "Local date and time": "Lokales Datum und Uhrzeit",
  "Repeat every (minutes)": "Wiederholen alle (Minuten)",
  "Create reminder": "Erinnerung erstellen",
  "Reminder created": "Erinnerung erstellt",
  "Reminders appear while Nexo is running. Browser reminders catch up when you reopen the page; they cannot wake a closed browser. The server continues scheduling while its process is running.":
    "Erinnerungen erscheinen, während Nexo läuft. Verpasste Browser-Erinnerungen werden beim erneuten Öffnen nachgeholt; ein geschlossener Browser kann nicht geweckt werden. Der Server plant Erinnerungen weiter, solange sein Prozess läuft.",
  Enabled: "Aktiviert",
  Paused: "Pausiert",
  "Next {time}": "Nächste Ausführung {time}",
  "Pause {name}": "{name} pausieren",
  "Resume {name}": "{name} fortsetzen",
  "Delete reminder {name}": "Erinnerung {name} löschen",
  "Every {count} {unit}": "Alle {count} {unit}",
  second: "Sekunde",
  seconds: "Sekunden",
  minute: "Minute",
  minutes: "Minuten",
  hour: "Stunde",
  hours: "Stunden",
  day: "Tag",
  days: "Tage",
  "Run status check": "Status prüfen",
  "Export trace": "Ausführungsverlauf exportieren",
  Blocked: "Blockiert",
  Verified: "Geprüft",
  completed: "abgeschlossen",
  blocked: "blockiert",
  active: "aktiv",
  cancelled: "abgebrochen",
  enabled: "aktiviert",
  paused: "pausiert",
  read: "Lesen",
  write: "Schreiben",
  "high-risk": "Hohes Risiko",
  "Issue a command to see its execution trace.":
    "Gib einen Befehl ein, um seinen Ausführungsverlauf zu sehen.",
  "Recent audit": "Letzte Protokolleinträge",
  OK: "OK",
  BLOCKED: "BLOCKIERT",
  Runtime: "Laufzeitumgebung",
  Workspace: "Arbeitsbereich",
  "Server persistence": "Serverspeicher",
  "Browser storage": "Browserspeicher",
  "AI conversation": "KI-Gespräch",
  Configured: "Eingerichtet",
  "Provider not configured": "Anbieter nicht eingerichtet",
  "Saved notes": "Gespeicherte Notizen",
  "Active timers": "Aktive Timer",
  "Enabled reminders": "Aktive Erinnerungen",
  "Refresh runtime": "Laufzeitstatus aktualisieren",
  "Tool registry ·": "Tool-Verzeichnis ·",
  tools: "Tools",
  "Your name": "Dein Name",
  "Read-only commands and workspace": "Befehle und Arbeitsbereich nur lesen",
  "Connected to the Nexo server": "Mit dem Nexo-Server verbunden",
  "Browser-local assistant": "Lokaler Browser-Assistent",
  "Open-ended conversation uses your configured server AI provider. Relevant notes and recent conversation are included with your request.":
    "Freie Gespräche verwenden den eingerichteten KI-Anbieter auf deinem Server. Passende Notizen und der jüngste Gesprächsverlauf werden mit der Anfrage übertragen.",
  "Notes, timers, reminders and live data work without an AI key. For open-ended conversation, run the Node server with OPENAI_API_KEY. Keys remain on the server. See README for setup.":
    "Notizen, Timer, Erinnerungen und Live-Daten funktionieren ohne KI-Schlüssel. Für freie Gespräche starte den Node-Server mit OPENAI_API_KEY. Schlüssel bleiben auf dem Server. Die Einrichtung ist in der README beschrieben.",
  "Refresh connection": "Verbindung aktualisieren",
  "Weather location ·": "Wetterstandort ·",
  "Not set": "Nicht festgelegt",
  Latitude: "Breitengrad",
  Longitude: "Längengrad",
  "Set location": "Standort festlegen",
  "Enter valid latitude and longitude.":
    "Gib einen gültigen Breiten- und Längengrad ein.",
  "Weather location updated": "Wetterstandort aktualisiert",
  "Speak assistant responses": "Antworten des Assistenten vorlesen",
  "Recognition language": "Sprache der Spracherkennung",
  Voice: "Stimme",
  "Browser default": "Browser-Standard",
  "Speech speed ·": "Sprechgeschwindigkeit ·",
  "Test voice": "Stimme testen",
  "Export workspace": "Arbeitsbereich exportieren",
  "Download recovery file": "Wiederherstellungsdatei herunterladen",
  "Enable desktop notifications": "Desktop-Benachrichtigungen aktivieren",
  "Mark all as read": "Alle als gelesen markieren",
  "Completed timers and scheduled reminders appear here.":
    "Abgelaufene Timer und geplante Erinnerungen erscheinen hier.",
  "{title} is complete.": "{title} ist abgelaufen.",
  "Nexo reminder": "Nexo-Erinnerung",
  View: "Anzeigen",
  "Use a duration such as 5 min, 1 hour or 30 seconds (up to 7 days).":
    "Verwende eine Dauer wie 5 min, 1 Stunde oder 30 Sekunden (bis zu 7 Tage).",
  "Choose a reminder time.": "Wähle einen Zeitpunkt für die Erinnerung.",
  "Speech output is unavailable in this browser.":
    "Die Sprachausgabe ist in diesem Browser nicht verfügbar.",
  "Desktop notifications are unavailable in this browser.":
    "Desktop-Benachrichtigungen sind in diesem Browser nicht verfügbar.",
  "Desktop notifications enabled while Nexo is open.":
    "Desktop-Benachrichtigungen sind aktiviert, solange Nexo geöffnet ist.",
  "In-app notifications remain available.":
    "Benachrichtigungen in Nexo bleiben verfügbar.",
  "Voice recognition is unavailable in this browser. Use the text console.":
    "Die Spracherkennung ist in diesem Browser nicht verfügbar. Verwende die Textkonsole.",
  "Voice input could not start. Check microphone permissions.":
    "Die Spracheingabe konnte nicht gestartet werden. Prüfe die Mikrofonberechtigung.",
  "Voice input unavailable: {reason}":
    "Spracheingabe nicht verfügbar: {reason}",
  "recognition failed": "Erkennung fehlgeschlagen",
  "not-allowed": "Mikrofonzugriff nicht erlaubt",
  "no-speech": "Keine Sprache erkannt",
  "audio-capture": "Kein Mikrofon verfügbar",
  network: "Verbindungsfehler",
  "Enter fullscreen": "Vollbild öffnen",
  "Exit fullscreen": "Vollbild verlassen",
  "{action} (F)": "{action} (F)",
  "An unexpected error occurred.": "Ein unerwarteter Fehler ist aufgetreten.",
  "Reload Page": "Seite neu laden",
  "Page Not Found": "Seite nicht gefunden",
  "Sorry, the page you are looking for doesn't exist.":
    "Die gesuchte Seite existiert leider nicht.",
  "It may have been moved or deleted.":
    "Sie wurde möglicherweise verschoben oder gelöscht.",
  "Go Home": "Zur Startseite",
  "Clear sky": "Klarer Himmel",
  "Mostly clear": "Überwiegend klar",
  "Partly cloudy": "Teilweise bewölkt",
  Overcast: "Bedeckt",
  Fog: "Nebel",
  "Rime fog": "Gefrierender Nebel",
  "Light drizzle": "Leichter Nieselregen",
  Drizzle: "Nieselregen",
  "Heavy drizzle": "Starker Nieselregen",
  "Freezing drizzle": "Gefrierender Nieselregen",
  "Heavy freezing drizzle": "Starker gefrierender Nieselregen",
  "Light rain": "Leichter Regen",
  Rain: "Regen",
  "Heavy rain": "Starker Regen",
  "Freezing rain": "Gefrierender Regen",
  "Heavy freezing rain": "Starker gefrierender Regen",
  "Light snow": "Leichter Schneefall",
  Snow: "Schnee",
  "Heavy snow": "Starker Schneefall",
  "Snow grains": "Schneegriesel",
  "Rain showers": "Regenschauer",
  "Heavy rain showers": "Starke Regenschauer",
  "Violent rain showers": "Sehr starke Regenschauer",
  "Snow showers": "Schneeschauer",
  "Heavy snow showers": "Starke Schneeschauer",
  Thunderstorm: "Gewitter",
  "Thunderstorm with hail": "Gewitter mit Hagel",
  "Severe thunderstorm with hail": "Schweres Gewitter mit Hagel",
  "Conditions unavailable": "Wetterlage nicht verfügbar",
  "Read actual runtime and workspace status.":
    "Aktuellen Laufzeit- und Arbeitsbereichsstatus lesen.",
  "List supported commands.": "Unterstützte Befehle anzeigen.",
  "Save a note, fact or preference.":
    "Eine Notiz, einen Fakt oder eine Präferenz speichern.",
  "Read saved notes.": "Gespeicherte Notizen lesen.",
  "Search note content and tags.": "Notizinhalte und Tags durchsuchen.",
  "Delete a saved note.": "Eine gespeicherte Notiz löschen.",
  "Start a persistent countdown.":
    "Einen dauerhaft gespeicherten Timer starten.",
  "List active countdowns.": "Aktive Timer auflisten.",
  "Cancel a countdown by ID or unique title.":
    "Einen Timer über seine ID oder einen eindeutigen Titel abbrechen.",
  "Create a scheduled or recurring reminder.":
    "Eine geplante oder wiederkehrende Erinnerung erstellen.",
  "List scheduled reminders.": "Geplante Erinnerungen auflisten.",
  "Pause or resume a reminder.": "Eine Erinnerung pausieren oder fortsetzen.",
  "Delete a recurring reminder.": "Eine wiederkehrende Erinnerung löschen.",
  "Mark notifications as read.": "Benachrichtigungen als gelesen markieren.",
  "Fetch live weather at provided coordinates.":
    "Aktuelles Wetter für die angegebenen Koordinaten abrufen.",
  "Fetch current public headlines.":
    "Aktuelle öffentliche Nachrichten abrufen.",
  "Answer using the configured AI provider, or explain available local functions.":
    "Mit dem eingerichteten KI-Anbieter antworten oder verfügbare lokale Funktionen erklären.",
  "Saved note: {content}": "Notiz gespeichert: {content}",
  "No matching notes yet. Save one with ‘Remember: …’.":
    "Noch keine passenden Notizen. Speichere eine mit „Merke dir: …“.",
  "Add a note with ‘Remember: your note’ or use New note in Knowledge.":
    "Speichere eine Notiz mit „Merke dir: deine Notiz“ oder nutze Neue Notiz im Wissensbereich.",
  "Use a duration from 1 second to 7 days, for example ‘Set a 5 min timer’ or ‘Remind me in 1 hour to stretch’.":
    "Verwende eine Dauer von 1 Sekunde bis 7 Tage, etwa „Stelle einen Timer auf 5 Minuten“ oder „Erinnere mich in 1 Stunde an Dehnen“.",
  "{title} started for {duration}. Due {time}.":
    "{title} für {duration} gestartet. Fällig um {time}.",
  "Try ‘Remind me every 30 minutes to stretch’ (up to 7 days).":
    "Versuche „Erinnere mich alle 30 Minuten an Dehnen“ (bis zu 7 Tage).",
  "Recurring reminder created: {prompt}. Next run {time}.":
    "Wiederkehrende Erinnerung erstellt: {prompt}. Nächste Ausführung {time}.",
  "{title} — {status}, due {time} ({id})":
    "{title} — {status}, fällig {time} ({id})",
  "No active timers. Try ‘Set a 5 min timer’.":
    "Keine aktiven Timer. Versuche „Stelle einen Timer auf 5 Minuten“.",
  "Cancelled {title}.": "{title} abgebrochen.",
  "No recurring reminders. Try ‘Remind me every 30 minutes to stretch’.":
    "Keine wiederkehrenden Erinnerungen. Versuche „Erinnere mich alle 30 Minuten an Dehnen“.",
  "Runtime {runtime}; {tools} tools, {notes} notes, {timers} active timers and {reminders} recurring reminders. Uptime {uptime} seconds.":
    "Laufzeit {runtime}; {tools} Tools, {notes} Notizen, {timers} aktive Timer und {reminders} wiederkehrende Erinnerungen. Betriebszeit {uptime} Sekunden.",
  "{condition}, {temperature}°C (feels like {apparent}°C). Wind {wind} km/h. {timezone}.":
    "{condition}, {temperature} °C (gefühlt {apparent} °C). Wind {wind} km/h. {timezone}.",
  "Enable location access or set coordinates in Settings to get current weather.":
    "Erlaube den Standortzugriff oder lege Koordinaten in den Einstellungen fest, um das aktuelle Wetter zu erhalten.",
  "No headlines are available right now.":
    "Zurzeit sind keine Nachrichten verfügbar.",
  "Workspace briefing: {notes} notes and {timers} active countdowns.":
    "Arbeitsbereichsübersicht: {notes} Notizen und {timers} aktive Timer.",
  "External calendars require a configured provider connection. You can use local timers and recurring reminders now.":
    "Externe Kalender benötigen eine eingerichtete Anbieteranbindung. Lokale Timer und wiederkehrende Erinnerungen kannst du bereits nutzen.",
  "Try: ‘Remember: …’, ‘Read my notes’, ‘Find notes about …’, ‘Set a 5 min timer’, ‘Remind me every 30 minutes to stretch’, ‘Show timers’, ‘Weather’, ‘News’, ‘System status’, or ‘Summarize today’. English and German note/timer commands are supported.":
    "Versuche: „Merke dir: …“, „Zeige meine Notizen“, „Suche Notizen nach …“, „Stelle einen Timer auf 5 Minuten“, „Erinnere mich alle 30 Minuten an Dehnen“, „Zeige Timer“, „Wetter“, „Nachrichten“, „Systemstatus“ oder „Tagesübersicht“. Englische und deutsche Befehle werden unterstützt.",
  "I can manage your notes, timers and reminders, and read live weather and news. For open-ended AI conversation, connect a server with an AI provider in Settings.":
    "Ich kann deine Notizen, Timer und Erinnerungen verwalten sowie aktuelles Wetter und Nachrichten lesen. Für freie KI-Gespräche verbinde einen Server mit einem KI-Anbieter in den Einstellungen.",
  "Why did the algorithm stay calm? It had already considered the edge cases.":
    "Warum blieb der Algorithmus gelassen? Er hatte die Grenzfälle bereits berücksichtigt.",
  "Execution blocked: {error}": "Ausführung blockiert: {error}",
  "Permission denied: requires {required}, granted {granted}":
    "Berechtigung fehlt: benötigt {required}, freigegeben {granted}",
  "Unknown tool: {tool}": "Unbekanntes Tool: {tool}",
  "Confirmation required for high-risk tool: {tool}":
    "Bestätigung für das Tool mit hohem Risiko erforderlich: {tool}",
  "Invalid input for {tool}: {reason}":
    "Ungültige Eingabe für {tool}: {reason}",
  "Please check your input.": "Bitte prüfe deine Eingabe.",
  "Execution failed": "Ausführung fehlgeschlagen",
  "No response was returned": "Es wurde keine Antwort zurückgegeben",
  "Memory is full. Delete or export notes first.":
    "Der Notizspeicher ist voll. Lösche oder exportiere zuerst Notizen.",
  "Note not found": "Notiz nicht gefunden",
  "Too many active timers": "Zu viele aktive Timer",
  "Active timer not found": "Aktiver Timer nicht gefunden",
  "More than one timer has this title. Use its ID.":
    "Mehrere Timer haben diesen Titel. Verwende die ID.",
  "Choose a future reminder time":
    "Wähle einen zukünftigen Zeitpunkt für die Erinnerung",
  "Too many reminders": "Zu viele Erinnerungen",
  "Automation not found": "Erinnerung nicht gefunden",
  "This one-time reminder has expired. Create a new reminder.":
    "Diese einmalige Erinnerung ist abgelaufen. Erstelle eine neue Erinnerung.",
  "No AI provider is configured": "Es ist kein KI-Anbieter eingerichtet",
  "AI provider returned no text response":
    "Der KI-Anbieter hat keine Textantwort zurückgegeben",
  "AI provider is unavailable (HTTP {status}). Your notes and timers remain available.":
    "Der KI-Anbieter ist nicht verfügbar (HTTP {status}). Deine Notizen und Timer bleiben verfügbar.",
  "Wait for the current command to finish":
    "Warte, bis der aktuelle Befehl abgeschlossen ist",
  "Reconnect the server before issuing another command":
    "Verbinde den Server erneut, bevor du einen weiteren Befehl eingibst",
  "Workspace refresh failed":
    "Der Arbeitsbereich konnte nicht aktualisiert werden",
  "Backend unavailable": "Server nicht verfügbar",
  "Reminder update failed": "Erinnerungen konnten nicht aktualisiert werden",
  "Command failed": "Befehl fehlgeschlagen",
  "Another tab saved invalid workspace data; current data was preserved.":
    "Ein anderer Tab hat ungültige Arbeitsbereichsdaten gespeichert. Die aktuellen Daten wurden beibehalten.",
  "Preferences apply to this session; browser storage is unavailable.":
    "Die Einstellungen gelten für diese Sitzung; der Browserspeicher ist nicht verfügbar.",
  "Saved workspace could not be read. Download the recovery file in Settings before clearing browser data.":
    "Der gespeicherte Arbeitsbereich konnte nicht gelesen werden. Lade die Wiederherstellungsdatei in den Einstellungen herunter, bevor du Browserdaten löschst.",
  "Browser storage is unavailable. This session is temporary; export it before closing this page.":
    "Der Browserspeicher ist nicht verfügbar. Diese Sitzung ist vorübergehend; exportiere sie, bevor du die Seite schließt.",
  "Saved workspace needs recovery. Export it in Settings before clearing browser data.":
    "Der gespeicherte Arbeitsbereich muss wiederhergestellt werden. Exportiere ihn in den Einstellungen, bevor du Browserdaten löschst.",
  "Workspace could not be saved. Export your data or free browser storage and retry.":
    "Der Arbeitsbereich konnte nicht gespeichert werden. Exportiere deine Daten oder gib Browserspeicher frei und versuche es erneut.",
  "Workspace could not be loaded. Restore its backup before continuing.":
    "Der Arbeitsbereich konnte nicht geladen werden. Stelle zuerst seine Sicherung wieder her.",
  "A workspace session is required":
    "Eine Arbeitsbereichssitzung ist erforderlich",
} satisfies Record<string, string>;

export function translate(
  language: Language,
  message: string,
  values: TranslationValues = {}
): string {
  const template =
    language === "de"
      ? ((german as Record<string, string>)[message] ?? message)
      : message;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match
  );
}

export function formatDate(
  language: Language,
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  return new Intl.DateTimeFormat(localeFor(language), options).format(
    new Date(value)
  );
}

export function formatDuration(language: Language, seconds: number): string {
  const count = seconds >= 60 ? seconds / 60 : seconds;
  const unit =
    seconds >= 60
      ? count === 1
        ? "minute"
        : "minutes"
      : count === 1
        ? "second"
        : "seconds";
  return `${new Intl.NumberFormat(localeFor(language)).format(count)} ${translate(language, unit)}`;
}

export function formatSchedule(language: Language, schedule: string): string {
  const match = /^every (\d+)([smhd])$/.exec(schedule);
  if (!match) return formatDate(language, schedule);
  const count = Number(match[1]);
  const unit = { s: "second", m: "minute", h: "hour", d: "day" }[
    match[2] as "s" | "m" | "h" | "d"
  ];
  return translate(language, "Every {count} {unit}", {
    count: new Intl.NumberFormat(localeFor(language)).format(count),
    unit: translate(language, count === 1 ? unit : `${unit}s`),
  });
}

export function translateError(language: Language, message: string): string {
  if (language === "en") return message;
  const t = (key: string, values?: TranslationValues) =>
    translate(language, key, values);
  let match =
    /^Permission denied: requires (read|write|high-risk), granted (read|write|high-risk)$/.exec(
      message
    );
  if (match)
    return t("Permission denied: requires {required}, granted {granted}", {
      required: t(match[1]),
      granted: t(match[2]),
    });
  match = /^Unknown tool: (.+)$/.exec(message);
  if (match) return t("Unknown tool: {tool}", { tool: match[1] });
  match = /^Confirmation required for high-risk tool: (.+)$/.exec(message);
  if (match)
    return t("Confirmation required for high-risk tool: {tool}", {
      tool: match[1],
    });
  match = /^Invalid input for ([^:]+): (.+)$/s.exec(message);
  if (match)
    return t("Invalid input for {tool}: {reason}", {
      tool: match[1],
      reason: t("Please check your input."),
    });
  match =
    /^AI provider is unavailable \(HTTP (\d+)\)\. Your notes and timers remain available\.$/.exec(
      message
    );
  if (match)
    return t(
      "AI provider is unavailable (HTTP {status}). Your notes and timers remain available.",
      { status: match[1] }
    );
  if (/^\s*\[\s*\{/.test(message)) return t("Please check your input.");
  return t(message);
}
