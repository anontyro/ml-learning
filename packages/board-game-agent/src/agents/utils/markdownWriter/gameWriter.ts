import { PromptTemplate } from "@langchain/core/prompts";
import defaultVectorStore from "../../../utils/modelSetup/modelSetup";
import { getGameMarkdownWriter } from "../../../utils/prompt";
import { QueryBoardGameOutput } from "../../query/promptTransformation";
import { createChatModel, logger } from "@repo/utils";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export const runGameWriter = async (
  matchedGames: QueryBoardGameOutput,
  promptVersion = "latest",
) => {
  logger.debug("🔍 Starting Board Game Writer to build the markdown output");

  const vectorStore = defaultVectorStore();
  const llm = createChatModel();

  const promptData = await getGameMarkdownWriter(promptVersion);
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
    query: JSON.stringify(matchedGames),
  });

  logger.debug(`Created an output for the games given`);
  logger.debug(result);

  return result;
};
