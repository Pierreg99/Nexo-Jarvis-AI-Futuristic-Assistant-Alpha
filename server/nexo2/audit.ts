import { defaultAssistant } from "./runtime";
export const audit = defaultAssistant.audit.bind(defaultAssistant);
export const recentAudit = defaultAssistant.recentAudit.bind(defaultAssistant);
export type { AuditEntry } from "../../shared/nexo/types";
