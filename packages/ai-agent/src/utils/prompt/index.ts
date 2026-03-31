import { loadPrompt } from "./promptLoader.js";
import type { Prompt } from "./promptLoader.js";

const REPORT_PROMPT_NAME = "report-agent";
const EXTRACT_THEME_PROMPT_NAME = "extract-theme-agent";
const EXTRACT_THEME_WRITER_PROMPT_NAME = "extract-writer-agent";
const QUERY_TRANSFORMER_PROMPT_NAME = "query-transformer-agent";

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

export const getExtractThemeWriterPrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(EXTRACT_THEME_WRITER_PROMPT_NAME, version);
};

/**
 * Use the query transformer prompt that will take a user question and
 * strip out all the extra words to leave behind the keywords and what is important
 * to search against
 * @param version prompt version to use defualts to latest
 * @returns
 */
export const getQueryTransformerPrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(QUERY_TRANSFORMER_PROMPT_NAME, version);
};

export { loadPrompt };
export type { Prompt };
