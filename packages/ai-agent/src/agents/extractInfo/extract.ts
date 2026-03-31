import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import logger from "../../utils/logger/logger.js";
import defaultVectorStore, {
  createChatModel,
} from "../../utils/modelSetup/modelSetup.js";
import {
  getExtractThemePrompt,
  getQueryTransformerPrompt,
} from "../../utils/prompt/index.js";
import { z } from "zod";

// Define the expected output schema
const ExtractThemeOutputSchema = z.object({
  themes: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  blockers: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
});

export type ExtractThemeOutput = z.infer<typeof ExtractThemeOutputSchema>;

export const runExtraction = async (
  userQuestion: string,
  promptVersion = "latest",
): Promise<ExtractThemeOutput> => {
  logger.info("🔍 Starting Structured Extraction...");

  const vectorStore = defaultVectorStore();
  const llm = createChatModel({
    temperature: 0,
  });

  const queryTransformerPrompt = await getQueryTransformerPrompt(promptVersion);
  const promptData = await getExtractThemePrompt(promptVersion);

  logger.debug(`📝 Using prompt: ${promptData.name} v${promptData.version}`);

  const queryTemplate = PromptTemplate.fromTemplate(queryTransformerPrompt.template);
  const prompt = PromptTemplate.fromTemplate(promptData.template);
  const parser = new JsonOutputParser<ExtractThemeOutput>();

  const retriever = vectorStore.asRetriever({ k: 5 });

  const chain = RunnableSequence.from([
    RunnableSequence.from([
      {
        optimizedQuery: async (input: { question: string }) => {
          const transformed = await queryTemplate.invoke({ question: input.question });
          const response = await llm.invoke(transformed);
          return response.content as string;
        },
        originalQuestion: (input: { question: string }) => input.question,
      },
      {
        // Use the optimized query for retrieval, keep original question for the prompt
        context: async (input: { optimizedQuery: string }) => {
          const docs = await retriever.invoke(input.optimizedQuery);
          return docs.map((d) => d.pageContent).join("\n\n");
        },
        question: (input: { originalQuestion: string }) => input.originalQuestion,
      },
    ]),
    prompt,
    llm,
    parser,
  ]);

  const result = await chain.invoke({
    question: userQuestion,
  });

  logger.info("\n📋 RAW LLM OUTPUT:\n");
  logger.info(JSON.stringify(result, null, 2));

  // Validate output against schema
  const validatedResult = ExtractThemeOutputSchema.parse(result);

  logger.info("\n✅ EXTRACTED DATA:\n");
  logger.info(JSON.stringify(validatedResult, null, 2));

  return validatedResult;
};
