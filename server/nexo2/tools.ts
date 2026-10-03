import { defaultAssistant } from "./runtime";
export const registerTool =
  defaultAssistant.registerTool.bind(defaultAssistant);
export const listTools = defaultAssistant.listTools.bind(defaultAssistant);
export const getTool = defaultAssistant.getTool.bind(defaultAssistant);
export const executeTool = defaultAssistant.executeTool.bind(defaultAssistant);
export const toolCall = defaultAssistant.toolCall.bind(defaultAssistant);
