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
  const gameList = await parseBoardGames({ limit: 50 });

  logger.debug(`Extracted ${gameList.length} rows in the CSV`);

  return gameList;
};

const runIngestion = async () => {
  logger.info(`Ingestion Starting`);

  const games = await readCsvFile();

  const documents = games.map((g) => {
    const cleanDescription = striptags(g.description);
    const pageContent = `
    ${g.name}.
    ${g.categories.join(",")}.
    ${g.mechanics.join(",")}.
    ${cleanDescription}`;

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

  await vectorStore.addDocuments(documents);

  logger.info("💾 Documents synced to ChromaDB (New/Updated only).");

  return vectorStore;
};

runIngestion().catch(logger.error);
