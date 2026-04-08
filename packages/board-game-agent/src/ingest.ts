import * as crypto from "crypto";
import { config } from "@dotenvx/dotenvx";
config({ path: [".env", ".env.local"] });
import { logger } from "@repo/utils";
import { parseBoardGames } from "./utils/parsing/parseCSV/parseBoardGameCSV";
import striptags from "striptags";
import defaultVectorStore from "./utils/modelSetup/modelSetup";
import { Document } from "langchain";

const generateHash = (content: string) => {
  const hash = crypto.createHash("sha256");

  hash.update(content);

  return hash.digest("hex");
};

const readCsvFile = async () => {
  logger.info(`Loading CSV file...`);
  const { games, failures } = await parseBoardGames({ limit: 10000 });

  logger.debug(`Extracted ${games.length} rows from the CSV`);
  if (failures.length > 0) {
    logger.warn(`Skipped ${failures.length} unparseable rows`, {
      failedIds: failures.map((f) => f.id),
    });
  }

  return games;
};

const runIngestion = async () => {
  logger.info(`Ingestion Starting`);

  const games = await readCsvFile();

  const documents = games.map((g) => {
    const cleanDescription = striptags(g.description).slice(0, 3000);
    const pageContent = [
      g.name,
      g.categories.join(","),
      g.mechanics.join(","),
      cleanDescription,
    ]
      .filter(Boolean)
      .join(". ");

    const contentHash = generateHash(pageContent);

    return new Document({
      id: g.id,
      pageContent,
      metadata: {
        name: g.name,
        rank: g.rank,
        yearpublished: g.yearpublished,
        minplayers: g.minplayers,
        maxplayers: g.maxplayers,
        playingtime: g.playingtime,
        minage: g.minage,
        average: g.average,
        bayesaverage: g.bayesaverage,
        is_expansion: g.is_expansion,
        categories: g.categories.join(";"),
        mechanics: g.mechanics.join(";"),
        contentHash,
      },
    });
  });

  logger.debug(
    `Created documents, sample page content from document`,
    documents[0].pageContent,
  );

  const vectorStore = defaultVectorStore();

  const BATCH_SIZE = 100;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batchDocs = documents.slice(i, i + BATCH_SIZE);
    const batchIds = games.slice(i, i + BATCH_SIZE).map((g) => g.id);
    await vectorStore.addDocuments(batchDocs, { ids: batchIds });
    logger.info(
      `Synced batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        documents.length / BATCH_SIZE,
      )} (${i + batchDocs.length}/${documents.length} documents)`,
    );
  }

  logger.info("💾 Documents synced to ChromaDB (New/Updated only).");

  return vectorStore;
};

runIngestion().catch(logger.error);
