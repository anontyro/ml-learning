import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import logger from "../../utils/logger/logger.js";
import defaultVectorStore, {
  createChatModel,
} from "../../utils/modelSetup/modelSetup.js";
import { getExtractThemeWriterPrompt } from "../../utils/prompt/index.js";
import { ExtractThemeOutput } from "./extract.js";

export const runWriter = async (
  extractedThemes: ExtractThemeOutput,
  promptVersion = "latest",
): Promise<any> => {
  logger.info("🔍 Starting Structured Extraction...");

  const vectorStore = defaultVectorStore();
  const llm = createChatModel();

  const promptData = await getExtractThemeWriterPrompt(promptVersion);
  logger.debug(`📝 Using prompt: ${promptData.name} v${promptData.version}`);

  const prompt = PromptTemplate.fromTemplate(promptData.template);
  const parser = new StringOutputParser();

  const retriever = vectorStore.asRetriever({ k: 5 });

  const chain = RunnableSequence.from([
    {
      context: async (input: { query: string }) => {
        const docs = await retriever.invoke(input.query);
        return docs.map((d) => d.pageContent).join("\n\n");
      },
    },
    prompt,
    llm,
    parser,
  ]);

  const result = await chain.invoke({
    query: JSON.stringify(extractedThemes),
  });

  logger.info("\n📋 THEMES AND BLOCKERS REPORT:\n");
  logger.info(result);

  return result;
};
