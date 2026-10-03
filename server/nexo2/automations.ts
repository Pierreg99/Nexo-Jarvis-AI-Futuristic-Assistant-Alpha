import { defaultAssistant } from "./runtime";
export const createAutomation =
  defaultAssistant.createAutomation.bind(defaultAssistant);
export const listAutomations =
  defaultAssistant.listAutomations.bind(defaultAssistant);
export const setAutomationEnabled =
  defaultAssistant.setAutomationEnabled.bind(defaultAssistant);
