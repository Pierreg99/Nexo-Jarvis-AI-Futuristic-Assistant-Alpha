# Nexo Jarvis 2.0 Roadmap

## Foundation delivered in this increment

- Typed agent state and execution traces
- Permission hierarchy with explicit high-risk confirmation
- Extensible tool registry with audited execution
- Session memory primitives with ranked retrieval
- Automation records and enable/disable controls
- Quality-gate workflow for typecheck, test, and production build

## Next implementation layer

1. Persist memory, conversations, automations and audit events in the existing Drizzle database.
2. Add first-party tools for notes, timers, weather, headlines, files and calendar adapters.
3. Connect `runAgent` to the command console through the existing tRPC layer.
4. Add agent activity/trace panels to the Orbital Instrumentation UI.
5. Add confirmation dialogs for high-risk tool execution.
6. Add scheduled worker execution for automations.
7. Add retrieval-backed knowledge sources with source attribution.

The existing UI and 3D Nexo Core remain the presentation layer; the Nexo 2.0 modules form the execution layer behind it.
