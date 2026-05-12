import chalk from "chalk";

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
};
