# Nexo Jarvis

Nexo Jarvis ist eine futuristische persönliche Command-Bay-Oberfläche im Stil eines orbitalen Instrumentenpults. Die Anwendung kombiniert einen holografischen Nexo-Kern, Browser-Sprachsteuerung, lokale Befehlsverarbeitung sowie kompakte Live-Module für Wetter und Nachrichten.

> **Projektstatus:** Die visuelle Command-Bay und die Live-Module sind etabliert. Mit Nexo 2.0 kommt jetzt eine typisierte Agent-Ausführungsschicht mit Tools, Memory, Automationen, Permissions, Audit-Trace und CI hinzu.

## Nexo 2.0

Die neue Ausführungsschicht liegt unter `server/nexo2/` und folgt dem Ablauf:

`Input → Intent → Tool Calls → Verification → Response → Audit Trace`

Enthalten sind eine erweiterbare Tool-Registry, Permission-Gates für riskante Aktionen, Memory-Suche, Automation-Modelle und ein begrenzter Audit-Stream. Die bestehende Orbital-UI bleibt die Präsentationsschicht; die tRPC-Oberfläche unter `nexo2.*` stellt die Agent-Funktionen für das Frontend bereit.

### Funktionen

| Bereich | Status |
| --- | --- |
| Orbital Instrumentation UI | Umgesetzt |
| 3D Nexo Core | Umgesetzt |
| Browser Voice | Umgesetzt |
| Wetter / News | Umgesetzt |
| Agent Trace | Nexo 2.0 Foundation |
| Tool Registry | Nexo 2.0 Foundation |
| Memory | Nexo 2.0 Foundation |
| Automations | Nexo 2.0 Foundation |
| Permission Gates | Nexo 2.0 Foundation |
| Audit / Observability | Nexo 2.0 Foundation |
| CI Quality Gate | Umgesetzt |
| Externe Kalender | Bewusst noch autorisierungspflichtig |

## Entwicklung

Vorausgesetzt werden Node.js 22 oder eine kompatible aktuelle Node-Version sowie pnpm.

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

## Architektur

- `client/src/pages/Home.tsx` — Command-Bay und Live-Module
- `client/src/index.css` — Orbital-Instrumentation-Design
- `server/routers.ts` — tRPC-Verträge für Live- und Nexo-2.0-Funktionen
- `server/nexo2/agent.ts` — Agent-Orchestrierung
- `server/nexo2/tools.ts` — Tool-Registry und Tool-Ausführung
- `server/nexo2/memory.ts` — Memory-Primitive und Retrieval
- `server/nexo2/automations.ts` — Automationsmodell
- `server/nexo2/permissions.ts` — Berechtigungsmodell
- `server/nexo2/audit.ts` — Audit-/Observability-Stream
- `server/nexo2.test.ts` — Foundation-Regressionstests

## Sicherheitsprinzip

Leseoperationen sind grundsätzlich `read`. Normale Schreiboperationen verwenden `write`. Hochriskante Tools werden als `high-risk` markiert und benötigen eine zusätzliche explizite Bestätigung, bevor eine Ausführung erfolgen darf.

## Bekannte Grenzen

Memory und Automationen sind in dieser Foundation noch prozesslokal. Für Multi-User- und Produktionsbetrieb sollten sie in die vorhandene Drizzle-Datenbank persistiert werden. Externe Kalenderanbieter benötigen eine echte OAuth-/Connector-Konfiguration. Browser-Sprachfunktionen bleiben von den Fähigkeiten und Berechtigungen des verwendeten Browsers abhängig.
