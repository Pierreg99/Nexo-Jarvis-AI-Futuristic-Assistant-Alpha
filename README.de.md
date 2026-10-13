# Nexo Jarvis

**Eine persönliche Befehlszentrale für Notizen, Timer, Erinnerungen, Spracheingabe und aktuelle Informationen.** Nexo verbindet eine orbitale Oberfläche mit einer Berechtigungsprüfung für Befehle im Browser und auf dem Node.js-Server.

[English](README.md) · [Deutsch](README.de.md) · [Live-Demo öffnen](https://pierreg99.github.io/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/)

## Screenshots

| Befehlszentrale · Englisch | Arbeitsbereich · Deutsch |
| --- | --- |
| ![Nexo-Befehlszentrale auf dem Desktop, auf Englisch](docs/screenshots/dashboard-en.webp) | ![Nexo-Einstellungen auf Deutsch](docs/screenshots/settings-de.webp) |

**Ansicht auf dem Smartphone · Deutsch**

![Nexo-Befehlszentrale auf dem Smartphone, auf Deutsch](docs/screenshots/dashboard-mobile-de.webp)

## Funktionen

- Notizen speichern, durchsuchen und löschen. Löschungen lassen sich rückgängig machen.
- Timer und einmalige oder wiederkehrende Erinnerungen erstellen, pausieren, fortsetzen, abbrechen und anzeigen.
- In-App-Benachrichtigungen für fällige Aufgaben anzeigen; Desktop-Benachrichtigungen sind optional, solange Nexo geöffnet ist.
- Berechtigungen, Ergebnisse, Ausführungsverläufe und Audit-Protokolle im Terminal und Systemmonitor prüfen.
- Englische oder deutsche Browser-Spracherkennung, auswählbare Stimme und einstellbare Sprachausgabe nutzen.
- Den zustandsabhängig animierten 3D-Fusionskern erleben: Plasmaströme und Magnetfeldringe reagieren auf Zuhören, Nachdenken und Sprechen. Bei fehlendem WebGL bleibt eine leichtere 2D-Ansicht verfügbar.
- Aktuelles Wetter und Schlagzeilen abrufen und den Standort in den Einstellungen festlegen.
- Optional einen serverseitigen, OpenAI-kompatiblen KI-Anbieter für freie Gespräche einrichten. Anbieterschlüssel bleiben auf dem Server. KI-Antworten können keine Tools ausführen.
- Die Oberfläche zwischen Englisch und Deutsch umschalten. Bei der ersten Nutzung übernimmt Nexo die Browsersprache und speichert die Auswahl im Browser.

## Schnellstart

Voraussetzung: Node.js **22 oder neuer** und die in `package.json` festgelegte pnpm-Version.

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Öffne die lokale Adresse, die der Entwicklungsserver ausgibt. Notizen, Timer, Erinnerungen, Sprachfunktionen und öffentliche Live-Daten funktionieren ohne KI-Schlüssel und ohne Datenbank. Im reinen Browserbetrieb wird der Arbeitsbereich im jeweiligen Browserprofil gespeichert.

### Beispielbefehle

| Englisch | Deutsch | Funktion |
| --- | --- | --- |
| `Remember: review the launch checklist` | `Merke dir: Startliste prüfen` | Notiz speichern |
| `Read my notes` | `Zeige meine Notizen` | Notizen auflisten |
| `Find notes about launch` | `Suche Notizen zu Start` | Notizen durchsuchen |
| `Set a 5 min timer for tea` | `Stelle einen Timer auf 5 Minuten` | Countdown starten |
| `Remind me in 1 hour to stretch` | `Erinnere mich in 1 Stunde ans Dehnen` | Einmalige Erinnerung anlegen |
| `Remind me every 30 minutes to stretch` | `Erinnere mich alle 30 Minuten ans Dehnen` | Wiederkehrende Erinnerung anlegen |
| `Show timers` | `Zeige Timer` | Aktive Aufgaben auflisten |
| `Weather` / `News` | `Wetter` / `Nachrichten` | Aktuelle öffentliche Daten abrufen |
| `System status` / `Help` | `Systemstatus` / `Hilfe` | Arbeitsbereich prüfen / Befehle anzeigen |

Timer unterstützen Sekunden, Minuten, Stunden und kombinierte Zeitspannen bis zu sieben Tagen. Genaue Termine und wiederkehrende Intervalle lassen sich außerdem im Modul **Timer & Erinnerungen** festlegen.

### Optionale KI-Gespräche

Richte einen Anbieter auf einem privaten Node.js-Server über Umgebungsvariablen ein:

```dotenv
OPENAI_API_KEY=your-server-side-key
OPENAI_BASE_URL=https://api.openai.com/v1
NEXO_AI_MODEL=gpt-4.1-mini
```

KI-Gespräche sind standardmäßig auf angemeldete Benutzer beschränkt. Auf einem privaten Server ohne OAuth lassen sie sich mit `NEXO_AI_ALLOW_GUESTS=true` für Besucher aktivieren. Für öffentliche Installationen sollte der Zugriff authentifiziert sein. Bei KI-Gesprächen werden die jüngsten Gesprächseinträge und passende gespeicherte Notizen an den eingerichteten Anbieter übertragen. Notizen, Timer und andere Befehle laufen weiterhin über Nexo und seine validierten Tools.

Ein vorhandener Manus-Anbieter lässt sich mit `BUILT_IN_FORGE_API_KEY` und `BUILT_IN_FORGE_API_URL` konfigurieren.

## Deployment und Datenspeicherung

### Node.js-Server

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

Der Server stellt `/api/health` und die Arbeitsbereich-API unter `/api/trpc` bereit. Über `NEXO_DATA_DIR` lässt sich das Verzeichnis für Arbeitsbereichdateien festlegen; Standard ist `.nexo-data/`. Bewahre es auf persistentem Speicher auf und nimm es in Backups auf. Dateispeicherung und Erinnerungsplaner sind für einen einzelnen Node.js-Prozess ausgelegt. Installationen mit mehreren Instanzen benötigen gemeinsamen Speicher und einen koordinierten Planer.

### Statisches Hosting

GitHub-Pages-Builds verwenden automatisch den Repository-Pfad. Für einen manuellen Build dieser Pages-Adresse:

```bash
VITE_BASE_PATH=/Nexo-Jarvis-AI-Futuristic-Assistant-Alpha/ corepack pnpm build
```

Der statische Betrieb nutzt dieselbe Befehlslogik und `localStorage` im Browser. Er hat keine Server-API und keinen serverseitigen KI-Anbieter. Für Browser-Erinnerungen muss die Seite geöffnet bleiben. Ein geschlossener oder pausierter Browser kann nicht geweckt werden. Beim nächsten Öffnen prüft Nexo deshalb überfällige Aufgaben.

## Aufbau und Berechtigungen

`shared/nexo/` enthält die Befehlsverarbeitung, Schemas, Tool-Registry, Notizen, Timer und Erinnerungen. Der Browser verwendet diese Engine direkt; der Node.js-Server führt dieselbe Engine mit getrennten, persistenten Arbeitsbereichen aus. `shared/i18n.ts` enthält englische und deutsche Texte sowie Datumsformate für die gewählte Sprache.

Tools haben die Berechtigungsstufen `read`, `write` oder `high-risk`. Im Nur-Lesen-Modus sind Schreibzugriffe gesperrt. Hochriskante Tools erfordern eine zusätzliche Bestätigung; die öffentliche Assistant-API akzeptiert nur Lese- und Schreibtools. Externe Kalenderanbieter sind noch nicht verbunden. Spracheingabe, Standortzugriff und Desktop-Benachrichtigungen hängen von den Browserfunktionen und Berechtigungen ab.
