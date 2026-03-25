import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
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

  const result = await chain.invoke({
    query: "Extract themes and blockers from the weekly updates",
  });

  logger.info("\n✅ EXTRACTED DATA (RAW):\n");
  logger.info(JSON.stringify(result, null, 2));

  return result;
};

runExtraction().catch((err) => {
  logger.error("Full error:", err);
  console.error("Full error:", err);
});
