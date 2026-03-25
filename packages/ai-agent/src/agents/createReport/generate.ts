import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import defaultVectorStore, {
  createChatModel,
} from "../../utils/modelSetup/modelSetup.js";
import { getReportPrompt } from "../../utils/prompt/index.js";
import logger from "../../utils/logger/logger.js";
import "@dotenvx/dotenvx/config";

export const runGeneration = async (promptVersion?: string) => {
  logger.info("\n🤖 Agent is analyzing themes...");

  const vectorStore = defaultVectorStore();
  const llm = createChatModel();

  const retriever = vectorStore.asRetriever({ k: 5 });

  // Load prompt from versioned prompt file
  const promptData = await getReportPrompt(promptVersion || "latest");
  logger.debug(`📝 Using prompt: ${promptData.name} v${promptData.version}`);

  const prompt = PromptTemplate.fromTemplate(promptData.template);
  const parser = new StringOutputParser();

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

  const report = await chain.invoke({ query: "weekly project updates status" });

  logger.info("\n📋 GENERATED REPORT:\n");
  logger.info(report);

  return report;
};
