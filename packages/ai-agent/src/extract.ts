import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import logger from "./utils/logger/logger.js";
import defaultVectorStore, {
  createChatModel,
} from "./utils/modelSetup/modelSetup";
import { getExtractThemePrompt } from "./utils/prompt";

const runExtraction = async (promptVersion = "latest") => {
  logger.info("🔍 Starting Structured Extraction...");

  const vectorStore = defaultVectorStore();
  const llm = createChatModel();

  const promptData = await getExtractThemePrompt(promptVersion);
  logger.debug(`📝 Using prompt: ${promptData.name} v${promptData.version}`);

  const prompt = PromptTemplate.fromTemplate(promptData.template);
  const parser = new JsonOutputParser();

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

  const result = await chain.invoke({ query: "" });

  logger.info("\n✅ EXTRACTED DATA:\n");
  logger.info(result);

  return result;
};

runExtraction().catch(logger.error);
