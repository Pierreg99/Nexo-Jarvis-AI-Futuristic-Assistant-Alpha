# Nexo 2.0 API Surface

The server exposes the Nexo 2.0 execution layer through the existing tRPC router.

Planned public read operations:
- `nexo2.tools.list`
- `nexo2.memory.search`
- `nexo2.automations.list`
- `nexo2.audit.recent`

Command execution:
- `nexo2.agent.run`

The agent endpoint returns both a user-facing response and an execution trace so the UI can render transparent activity without exposing secrets.
