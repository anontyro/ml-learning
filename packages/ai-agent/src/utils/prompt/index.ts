import { join } from "path";
import { loadPrompt } from "@repo/utils";
import type { Prompt } from "@repo/utils";

// Resolve path to prompts directory relative to this package's root.
// In development (tsx): __dirname = src/utils/prompt  → go up 3 levels
// In production (built): __dirname = dist/utils/prompt → go up 3 levels
const getPromptDir = () => {
  let currentDir = __dirname;
  for (let i = 0; i < 3; i++) {
    currentDir = join(currentDir, "..");
  }
  return join(currentDir, "prompts");
};

const PROMPTS_DIR = getPromptDir();

const REPORT_PROMPT_NAME = "report-agent";
const EXTRACT_THEME_PROMPT_NAME = "extract-theme-agent";
const EXTRACT_THEME_WRITER_PROMPT_NAME = "extract-writer-agent";
const QUERY_TRANSFORMER_PROMPT_NAME = "query-transformer-agent";

export const getReportPrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(REPORT_PROMPT_NAME, version, PROMPTS_DIR);
};

export const getExtractThemePrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(EXTRACT_THEME_PROMPT_NAME, version, PROMPTS_DIR);
};

export const getExtractThemeWriterPrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(EXTRACT_THEME_WRITER_PROMPT_NAME, version, PROMPTS_DIR);
};

export const getQueryTransformerPrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(QUERY_TRANSFORMER_PROMPT_NAME, version, PROMPTS_DIR);
};

export { loadPrompt };
export type { Prompt };
