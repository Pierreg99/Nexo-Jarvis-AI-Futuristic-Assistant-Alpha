# Ladeanimationsprüfung

Am 16. August 2026 wurde die neue Ladeanimation direkt im laufenden Dashboard geprüft. Beim initialen Nachrichtenabruf und nach manueller Aktualisierung waren die cyanfarbenen Skeleton-Balken sowie die vertikale Scanline im News-Relay sichtbar. Der Ladezustand verschwindet nach Eingang der Headlines und wird durch die verlinkten Nachrichten ersetzt.

Die Wetteranimation ist an `weatherLoading` gebunden und zeigt beim Abruf einen orbitalen Statusindikator mit dem Text `Reading local telemetry`. Die globale `prefers-reduced-motion`-Regel reduziert alle Animationen auf eine minimale Dauer, behält aber die sichtbare Struktur und die Statusbeschriftung bei.

Desktop-, Tablet- und Mobilansichten wurden nach der CSS- und JSX-Änderung geprüft. TypeScript, Vitest und Produktions-Build waren erfolgreich.
