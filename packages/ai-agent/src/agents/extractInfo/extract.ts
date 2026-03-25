import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import logger from "../../utils/logger/logger.js";
import defaultVectorStore, {
  createChatModel,
} from "../../utils/modelSetup/modelSetup.js";
import { getExtractThemePrompt } from "../../utils/prompt/index.js";
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
  promptVersion = "latest",
): Promise<ExtractThemeOutput> => {
  logger.info("🔍 Starting Structured Extraction...");

  const vectorStore = defaultVectorStore();
  const llm = createChatModel({
    temperature: 0,
  });

  const promptData = await getExtractThemePrompt(promptVersion);
  logger.debug(`📝 Using prompt: ${promptData.name} v${promptData.version}`);

  const prompt = PromptTemplate.fromTemplate(promptData.template);
  const parser = new JsonOutputParser<ExtractThemeOutput>();

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

  logger.info("\n📋 RAW LLM OUTPUT:\n");
  logger.info(JSON.stringify(result, null, 2));

  // Validate output against schema
  const validatedResult = ExtractThemeOutputSchema.parse(result);

  logger.info("\n✅ EXTRACTED DATA:\n");
  logger.info(JSON.stringify(validatedResult, null, 2));

  return validatedResult;
};
