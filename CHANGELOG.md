# Changelog

Alle relevanten Änderungen am Projekt werden in umgekehrt chronologischer Reihenfolge dokumentiert.

## [Unreleased]

### Dokumentation

Die Projektinformationen werden in README, Changelog und Fortschrittsbericht zentralisiert. Setup, Architektur, Datenquellen, Tests und bekannte Grenzen sind jetzt nachvollziehbar beschrieben.

## [0.3.0] — Live-Dashboard

### Hinzugefügt

Das Dashboard enthält ein Live-Wettermodul mit browserseitiger Standortfreigabe, aktueller Temperatur, gefühlter Temperatur, Wetterlage, Windgeschwindigkeit und Zeitzone. Das Modul besitzt Lade-, Fehler- und Berechtigungszustände und vermeidet Schätzdaten bei verweigerter Standortfreigabe.

Das Nachrichtenmodul lädt aktuelle verlinkbare Technologie-Schlagzeilen aus der Hacker-News-Algolia-Schnittstelle. Eine manuelle Aktualisierung, Aktualisierung beim Fensterfokus sowie sichtbare Lade- und Fehlerzustände sind enthalten.

Das Kalendermodul besitzt einen Verbindungsdialog mit Google-Calendar- und Outlook-Calendar-Auswahl. Da der Nutzer keine externe Kalenderanbindung aktiviert hat, bleibt der Zustand sicher nicht verbunden und zeigt keine künstlichen Ereignisse.

Die Live-Module wurden in das Orbital-Instrumentation-Design integriert und für Desktop, Tablet und Mobilansicht geprüft.

### Technisch

Die Fullstack-Grundlage mit Express, tRPC, Drizzle, Authentifizierung und Vitest wurde ergänzt. `server/liveData.ts` kapselt Datentypen, öffentliche Datenquellen und Wettercode-Normalisierung. Unit-Tests prüfen die Wettercode-Normalisierung.

## [0.2.0] — Orbital Instrumentation

### Hinzugefügt

Die zentrale Command-Bay wurde mit holografischem Kern, radialen Orbitalringen, Telemetrie, Signalpfaden, Sprachsteuerung, lokaler Befehlsverarbeitung und responsiven Peripheriemodulen umgesetzt.

### Design

Die visuelle Sprache verwendet Graphit, Nexo Cyan und sparsame Amber-Zustände. Die zentrale Nexo-Prism-Marke und die generierten Atmosphären-Assets wurden in die Oberfläche eingebunden.

## [0.1.0] — Initiale Oberfläche

### Hinzugefügt

Grundstruktur des Nexo-Jarvis-Webprojekts mit React, Navigation, Command-Bay-Shell und erster interaktiver Assistentenansicht.
