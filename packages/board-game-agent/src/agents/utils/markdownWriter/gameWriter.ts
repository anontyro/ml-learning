import { PromptTemplate } from "@langchain/core/prompts";
import { getGameMarkdownWriter } from "../../../utils/prompt";
import { QueryBoardGameOutput } from "../../query/promptTransformation";
import { createChatModel, logger } from "@repo/utils";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const runGameWriter = async (
  matchedGames: QueryBoardGameOutput,
  userQuestion: string,
  promptVersion = "latest",
) => {
  logger.debug("🔍 Starting Board Game Writer to build the markdown output");

  const llm = createChatModel();
  const promptData = await getGameMarkdownWriter(promptVersion);

  logger.debug(`📝 Using prompt: ${promptData.name} v${promptData.version}`);

  const prompt = PromptTemplate.fromTemplate(promptData.template);
  const parser = new StringOutputParser();

  const chain = prompt.pipe(llm).pipe(parser);

  const result = await chain.invoke({
    question: userQuestion,
    context: JSON.stringify(matchedGames),
  });

  logger.debug(`Created an output for the games given`);
  logger.debug(result);

  return result;
};
