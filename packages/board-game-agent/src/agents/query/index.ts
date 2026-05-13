import { logger } from "@repo/utils";
import { runPromptTransformation } from "./promptTransformation";
import { runGameWriter } from "../utils/markdownWriter/gameWriter";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import MessageHistory from "../../utils/memory/MessageHistory";

const TEST_QUESTION = `I want something like Catan but with more conflict`;
const messageHistoryInstance = MessageHistory.getInstance();

/**
 * Function to transform the prompt to a much richer version
 * then run the llm to get the data from database and
 * then run a writer to turn that data into written piece
 * which is exported via markdown
 * @param userQuestion string
 * @returns string markdown format
 */
export const askQueryReturnMarkdown = async (userQuestion: string) => {
  const userHistory = messageHistoryInstance.getHistory();
  const dataExtracted = await runPromptTransformation(
    userQuestion,
    userHistory,
  );

  logger.info("Data Extracted now on to the fun part...");
  const markdown = await runGameWriter(dataExtracted, userQuestion);

  return markdown;
};

/**
 * Main function that will transform prompt, query the llm and get
 * markdown data back
 * will then used marked to display correctly in the terminal
 * This is a stand alone function
 * @param userQuestion string
 */
const main = async (userQuestion = TEST_QUESTION) => {
  logger.info("Asking A wizard for an answer...");

  const markdown = await askQueryReturnMarkdown(userQuestion);

  // display the results
  marked.use(markedTerminal());

  const output = await marked.parse(markdown);

  process.stdout.write(output);
};

if (require.main === module) {
  main();
}
