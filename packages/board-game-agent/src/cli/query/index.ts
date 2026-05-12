import { logger } from "@repo/utils";
import ora from "ora";
import chalk from "chalk";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { askQueryReturnMarkdown } from "../../agents/query";

const spinner = ora("Loading unicorns");

export const handleQuery = async (prompt: string) => {
  logger.debug(`Asking query with prompt:`, prompt);

  spinner.start();
  const markdownString = await askQueryReturnMarkdown(prompt);

  marked.use(markedTerminal());

  const output = await marked.parse(markdownString);

  spinner.stop();

  console.log(chalk.magenta("Agent results:"));
  process.stdout.write(output);
};
