import * as fs from "fs";
import * as path from "path";
import logger from "../../utils/logger/logger";
import { runExtraction } from "./extract";
import { runWriter } from "./writer";

const writeMarkdownToFile = (markdown: string, fileName: string) => {
  const outputPath = path.join(__dirname, "../../../output/reports", fileName);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown);
  logger.info(`Markdown file save to ${outputPath}`);
};

const main = async () => {
  const results = await runExtraction().catch((err) => {
    logger.error("Full error:", err);

    throw err;
  });

  const markdown = await runWriter(results);

  writeMarkdownToFile(markdown, "themes.md");
};

main();
