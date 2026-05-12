import { logger } from "@repo/utils";
import { runPromptTransformation } from "./promptTransformation";
import { runGameWriter } from "../utils/markdownWriter/gameWriter";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

const TEST_QUESTION = `I want something like Catan but with more conflict`;

export const main = async (userQuestion = TEST_QUESTION) => {
  logger.info("Asking A wizard for an answer...");
  // run the prompt extractor
  const dataExtracted = await runPromptTransformation(userQuestion);

  logger.info("Data Extracted now on to the fun part...");
  const markdown = await runGameWriter(dataExtracted, userQuestion);

  // display the results
  marked.use(markedTerminal());

  const output = await marked.parse(markdown);

  process.stdout.write(output);
};

if (require.main === module) {
  main();
}
