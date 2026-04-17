import * as fs from "fs";
import * as path from "path";
import { logger } from "@repo/utils";
import { runPromptTransformation } from "./promptTransformation";

const TEST_QUESTION = `I want something like Catan but with more conflict`;

const main = async () => {
  logger.info("Asking A wizard for an answer...");
  // run the prompt extractor
  const dataExtracted = await runPromptTransformation(TEST_QUESTION);

  logger.info("Data Extracted now on to the fun part...");

  // pass the results to get the question answered

  // return the result as a markdown display
};

main();
