import * as crypto from "crypto";
import * as fs from "fs";
import { join } from "path";
import { readdir } from "fs/promises";
import { config } from "@dotenvx/dotenvx";
config({ path: [".env", ".env.local"] });
import { logger } from "@repo/utils";
import { Chroma } from "@langchain/community/vectorstores/chroma";

const generateDocumentId = (content: string) => {
  const hash = crypto.createHash("sha256");

  hash.update(content);

  return hash.digest("hex");
};

const runIngestion = async () => {
  logger.info(`Ingestion Starting`);
};

runIngestion().catch(logger.error);
