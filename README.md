# Nexo Jarvis

Nexo Jarvis ist eine futuristische persönliche Command-Bay-Oberfläche im Stil eines orbitalen Instrumentenpults. Die Anwendung kombiniert einen holografischen Nexo-Kern, Browser-Sprachsteuerung, lokale Befehlsverarbeitung sowie kompakte Live-Module für Wetter und Nachrichten.

> **Projektstatus:** Die Kernoberfläche und die Live-Module sind umgesetzt und geprüft. Eine externe Kalenderanbindung ist bewusst nicht aktiviert; das Kalender-Modul zeigt daher einen sicheren, nicht verbundenen Status.

## Funktionen

| Bereich | Status | Beschreibung |
| --- | --- | --- |
| Orbital Instrumentation UI | Umgesetzt | Dunkle Command-Bay mit radialem Kern, Telemetrie, Signalpfaden und responsiven Modulen. |
| Sprachsteuerung | Umgesetzt | Browser-native Spracherkennung und Sprachausgabe, sofern der Browser die benötigten APIs unterstützt. |
| Lokale Befehle | Umgesetzt | Befehle wie Notizen, Timer, Fokusmodus und Systemabfragen werden lokal verarbeitet. |
| Wetter | Umgesetzt | Standortbasierte aktuelle Wetterwerte über Open-Meteo; Standortfreigabe ist optional. |
| Nachrichten | Umgesetzt | Aktuelle verlinkbare Technologie-Schlagzeilen über die Hacker-News-Algolia-Schnittstelle mit manueller Aktualisierung. |
| Kalender | Sicherer Status | Google Calendar und Outlook Calendar sind nicht verbunden. Es werden keine erfundenen Termine angezeigt. |

## Lokale Entwicklung

Vorausgesetzt werden Node.js 22 oder eine kompatible aktuelle Node-Version sowie pnpm. Abhängigkeiten werden mit `pnpm install` installiert. Der Entwicklungsserver startet mit `pnpm dev`; die Anwendung ist danach über die vom Webprojekt bereitgestellte Vorschau erreichbar.

Die wichtigsten Prüfungen lauten:

```bash
pnpm check
pnpm test
pnpm build
```

`pnpm check` führt die TypeScript-Prüfung aus, `pnpm test` startet die Vitest-Suite und `pnpm build` erzeugt den Produktions-Build für Client und Server.

## Architektur

Die Oberfläche liegt unter `client/src/pages/Home.tsx` und nutzt die bestehende Nexo-Jarvis-Designsprache aus `client/src/index.css`. Server- und tRPC-Strukturen befinden sich unter `server/`; die Daten-Normalisierung für Wetter und Nachrichten ist in `server/liveData.ts` dokumentiert. Die Fullstack-Erweiterung stellt Authentifizierung, Datenbank- und Servergrundlagen bereit, wird für die öffentlichen Live-Module derzeit aber nicht als Kalenderdatenspeicher verwendet.

Die Wetter- und Nachrichtenmodule aktualisieren ihre Daten beim Laden, bei Fensterfokus und über manuelle Schaltflächen. Lade- und Fehlerzustände werden sichtbar dargestellt. Der Wetterabruf benötigt die browserseitige Standortfreigabe; bei verweigerter Freigabe zeigt das Modul keine Schätzwerte an.

## Datenquellen

Für Wetterdaten wird Open-Meteo verwendet. Die Schnittstelle liefert aktuelle Temperatur, gefühlte Temperatur, Wettercode, Windgeschwindigkeit und Zeitzone [1]. Für Nachrichten wird die öffentliche Hacker-News-Algolia-Schnittstelle verwendet, die aktuelle Beiträge mit Titel, Link und Zeitstempel liefert [2]. Die Anzeige verlinkt direkt auf die jeweiligen Originalseiten.

## Designprinzipien

Die visuelle Richtung heißt **Orbital Instrumentation**. Nexo Cyan markiert aktive Signale und Interaktion; Amber bleibt auf Warn- und Zustandsindikatoren begrenzt. Die zentrale Orbitalgrafik besitzt die höchste visuelle Priorität, während Wetter, Nachrichten und Kalender als verbundene Peripheriemodule erscheinen.

## Bekannte Grenzen

Die Kalenderauswahl im Verbindungsdialog ist vorbereitet, führt aber ohne aktivierte externe Integration keine OAuth-Autorisierung durch. Entsprechend werden keine Kalenderereignisse geladen. Für eine spätere Kalenderanbindung müssen Anbieterfreigaben und eine belastbare OAuth- beziehungsweise Connector-Konfiguration ergänzt werden.

Die Live-Daten sind für die geöffnete Dashboard-Sitzung ausgelegt. Eine dauerhafte Hintergrundsynchronisierung ist in diesem Stand nicht aktiviert. Außerdem hängt die Sprachsteuerung von den Browserfähigkeiten und Berechtigungen des jeweiligen Endgeräts ab.

## Verzeichnisübersicht

| Pfad | Zweck |
| --- | --- |
| `client/src/pages/Home.tsx` | Command-Bay und Live-Module |
| `client/src/index.css` | Globale Gestaltung, Layout und Animationen |
| `server/liveData.ts` | Typen und serverseitige Daten-Normalisierung |
| `server/routers.ts` | tRPC-Verträge für Authentifizierung und Live-Daten |
| `server/liveData.test.ts` | Unit-Tests für Wettercode-Normalisierung |
| `todo.md` | Verifizierbare Projektaufgaben und Historie |
| `CHANGELOG.md` | Versionierte Änderungen |
| `PROGRESS.md` | Aktueller Fortschrittsbericht |

## Referenzen

[1]: https://open-meteo.com/en/docs "Open-Meteo Weather API Documentation"

[2]: https://hn.algolia.com/api "Hacker News Algolia API"
