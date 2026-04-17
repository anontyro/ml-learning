import { join } from "path";
import { loadPrompt } from "@repo/utils";
import type { Prompt } from "@repo/utils";

const getPromptDir = () => {
  let currentDir = __dirname;
  for (let i = 0; i < 3; i++) {
    currentDir = join(currentDir, "..");
  }
  return join(currentDir, "prompts");
};

const PROMPTS_DIR = getPromptDir();

const QUERY_TRANSFORM_PROMPT = "query-transformer";
const QUERY_BOARD_GAME = "query-board-game";

/**
 * Loads the standard transformer prompt for general transformation of the user input
 * This will strip out unrequired words and provide a richer keyword input for the model
 * @param version
 * @returns
 */
export const getQueryTransformerPrompt = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(QUERY_TRANSFORM_PROMPT, version, PROMPTS_DIR);
};

/**
 * Loads the standard board game prompt to work with general questions
 * @param version
 * @returns
 */
export const getQueryBoardGame = async (
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> => {
  return loadPrompt(QUERY_BOARD_GAME, version, PROMPTS_DIR);
};
