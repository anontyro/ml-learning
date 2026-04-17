import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createChatModel, logger } from "@repo/utils";
import { z } from "zod";
import defaultVectorStore from "../../utils/modelSetup/modelSetup";
import {
  getQueryBoardGame,
  getQueryTransformerPrompt,
} from "../../utils/prompt";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/dist/output_parsers";

const BoardGameResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  yearpublished: z.number().int(),
  rank: z.number().int(),
  average: z.number(),
  bayesaverage: z.number(),
  usersrated: z.number().int().nullable().optional(),
  minplayers: z.number().int().nullable(),
  maxplayers: z.number().int().nullable(),
  playingtime: z.number().int().nullable(),
  minage: z.number().int().nullable(),
  is_expansion: z.boolean(),
  categories: z.array(z.string()),
  mechanics: z.array(z.string()),
  description: z.string(),
  why: z.string(),
});

export const QueryBoardGameOutputSchema = z.object({
  games: z.array(BoardGameResultSchema),
});

export type BoardGameResult = z.infer<typeof BoardGameResultSchema>;
export type QueryBoardGameOutput = z.infer<typeof QueryBoardGameOutputSchema>;

export const runPromptTransformation = async (
  userQuestion: string,
  promptVersion?: "latest",
): Promise<QueryBoardGameOutput> => {
  const vectorStore = defaultVectorStore();
  const llm = createChatModel({
    temperature: 0,
  });

  const queryTransformPrompt = await getQueryTransformerPrompt(promptVersion);
  const promptData = await getQueryBoardGame(promptVersion);

  const queryTemplate = PromptTemplate.fromTemplate(
    queryTransformPrompt.template,
  );
  const prompt = PromptTemplate.fromTemplate(promptData.template);

  const stringParser = new StringOutputParser();
  const jsonParser = new JsonOutputParser<QueryBoardGameOutput>();

  logger.debug("Loaded transformer and prompt");
  logger.debug(
    `📝 Using Transform prompt: ${queryTransformPrompt.name} v${queryTransformPrompt.version}`,
  );

  logger.debug(`📝 Using prompt: ${promptData.name} v${promptData.version}`);

  const retriever = vectorStore.asRetriever({ k: 5 });

  const chain = RunnableSequence.from([
    RunnableSequence.from([
      {
        optimizedQuery: async (input: { question: string }) => {
          const queryChain = queryTemplate.pipe(llm).pipe(stringParser);
          return await queryChain.invoke({ question: input.question });
        },
        originalQuestion: (input: { question: string }) => input.question,
      },
      {
        context: async (input: { optimizedQuery: string }) => {
          const docs = await retriever.invoke(input.optimizedQuery);

          return docs
            .map((d) => {
              const m = d.metadata;
              return [
                `ID: ${d.id}`,
                `Name: ${m.name}`,
                `Year Published: ${m.yearpublished}`,
                `Rank: ${m.rank}`,
                `Average Rating: ${m.average}`,
                `Bayes Average: ${m.bayesaverage}`,
                `Min Players: ${m.minplayers ?? "N/A"}`,
                `Max Players: ${m.maxplayers ?? "N/A"}`,
                `Playing Time: ${m.playingtime ?? "N/A"} minutes`,
                `Min Age: ${m.minage ?? "N/A"}`,
                `Is Expansion: ${m.is_expansion}`,
                `Categories: ${m.categories}`,
                `Mechanics: ${m.mechanics}`,
                `Description: ${d.pageContent}`,
              ].join("\n");
            })
            .join("\n\n---\n\n");
        },
        question: (input: { originalQuestion: string }) =>
          input.originalQuestion,
      },
    ]),
    prompt,
    llm,
    jsonParser,
  ]);

  logger.debug(`Execute user question: ${userQuestion}`);

  const result = await chain.invoke({
    question: userQuestion,
  });

  logger.debug("\n📋 RAW LLM OUTPUT:\n");
  logger.debug(JSON.stringify(result, null, 2));

  const validatedResult = QueryBoardGameOutputSchema.parse(result);

  logger.info("\n✅ EXTRACTED DATA:\n");
  logger.info(JSON.stringify(validatedResult, null, 2));

  return validatedResult;
};
