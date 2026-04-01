import { config } from "@dotenvx/dotenvx";
config({ path: [".env", ".env.local"] });
import { logger } from "@repo/utils";

const runIngestion = async () => {
  logger.info(`Ingestion Starting`);
};

runIngestion().catch(logger.error);
