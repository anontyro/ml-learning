import chalk from "chalk";

const quit = () => {
  console.log(chalk.redBright("Until next time..."));
  // rl.close();
  process.exit(0);
};

export const COMMANDS: Record<string, () => void> = {
  "/quit": quit,
};
