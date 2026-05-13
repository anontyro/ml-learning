import chalk from "chalk";
import MessageHistory from "../../utils/memory/MessageHistory";

const messageHistoryInstance = MessageHistory.getInstance();

const memory = () => {
  const memoryUsage = Math.floor(messageHistoryInstance.tokenPercentageUsage());
  if (memoryUsage > 75) {
    console.log(chalk.redBright(`Memory is currently at ${memoryUsage}%`));
    console.log(chalk.redBright(`Its probably time to /compact`));
    return;
  }
  if (memoryUsage > 50) {
    console.log(chalk.yellowBright(`Memory is currently at ${memoryUsage}%`));
    console.log(chalk.yellowBright(`You may want to consider compacting soon`));
    return;
  }
  console.log(chalk.greenBright(`Memory is currently at ${memoryUsage}%`));
  console.log(chalk.greenBright(`Still plenty of head room`));
};

const clear = () => {
  console.log(chalk.redBright("purging memory"));
  messageHistoryInstance.clear();
  console.log(chalk.redBright("completed"));
};

const compact = () => {
  console.log(chalk.redBright("clearing old data"));
  messageHistoryInstance.compact();
  console.log(chalk.redBright("completed"));
};

const quit = () => {
  console.log(chalk.redBright("Until next time..."));
  // rl.close();
  process.exit(0);
};

const help = () => {
  console.log(chalk.green("Here is a list of avaliable /commands:"));
  console.log(chalk.yellow("/quit - exit the program"));
  console.log(chalk.yellow("/help - well you know what this does"));
};

export const COMMANDS: Record<string, () => void> = {
  "/quit": quit,
  "/help": help,
  "/memory": memory,
  "/clear": clear,
  "/compact": compact,
};
