import logger from "../../utils/logger/logger";
import { runExtraction } from "./extract";
import { runWriter } from "./writer";

const main = async () => {
  const results = await runExtraction().catch((err) => {
    logger.error("Full error:", err);

    throw err;
  });

  const writtenOutput = await runWriter(results);
};

main();
