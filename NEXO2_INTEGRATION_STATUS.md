# Nexo 2.0 Integration Status

The agent execution layer is now reachable from the application server through tRPC. The existing client command console remains compatible and can be migrated incrementally to `nexo2.agent.run` without replacing the established visual shell.

The foundation intentionally keeps memory and automations process-local until database persistence and a scheduler worker are added. High-risk operations remain gated by explicit confirmation semantics.
