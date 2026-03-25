import { loadPrompt } from "./promptLoader.js";
import type { Prompt } from "./promptLoader.js";

const REPORT_PROMPT_NAME = "report-agent";
const EXTRACT_THEME_PROMPT_NAME = "extract-theme-agent";

export const getReportPrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(REPORT_PROMPT_NAME, version);
};

export const getExtractThemePrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(EXTRACT_THEME_PROMPT_NAME, version);
};

export { loadPrompt };
export type { Prompt };
