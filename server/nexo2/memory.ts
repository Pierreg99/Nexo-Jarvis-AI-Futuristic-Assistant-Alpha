import { defaultAssistant } from "./runtime";
export const remember = defaultAssistant.remember.bind(defaultAssistant);
export const listMemory = defaultAssistant.listMemory.bind(defaultAssistant);
export const searchMemory =
  defaultAssistant.searchMemory.bind(defaultAssistant);
export const clearMemory = defaultAssistant.clearMemory.bind(defaultAssistant);
export const removeMemory =
  defaultAssistant.removeMemory.bind(defaultAssistant);
