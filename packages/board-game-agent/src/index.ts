import readline from "readline";
import chalk from "chalk";
import { logger } from "@repo/utils";
import { COMMANDS } from "./cli/commands";
import { handleQuery } from "./cli/query";

// Part 3
// Then store the previous questions in memory and keep it for that chat

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

rl.on("line", async (input) => {
  const trimmed = input.trim();

  if (trimmed in COMMANDS) {
    COMMANDS[trimmed]?.();
  } else {
    await handleQuery(trimmed);
  }
}).on("close", () => {
  console.log(chalk.cyan("See you later"));
  process.exit(0);
});

const init = async () => {
  console.log(chalk.blue("Welcome ") + chalk.red("back ") + chalk.green("!"));
  rl.prompt();
};

init();
