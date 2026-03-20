import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import defaultVectorStore, {
  createChatModel,
} from "./utils/modelSetup/modelSetup.js";

export const runGeneration = async () => {
  console.log("\n🤖 Agent is analyzing themes...");

  const vectorStore = defaultVectorStore();
  const llm = createChatModel();

  const retriever = vectorStore.asRetriever({ k: 5 });

  const prompt = PromptTemplate.fromTemplate(`
    You are an expert Project Manager.
    You have been given several weekly update documents.

    Context from documents:
    {context}

    Task:
    1. Identify common themes across these updates.
    2. Identify shared blockers.
    3. Generate a consolidated draft report using the template below.

    Template:
    ---
    WEEKLY CONSOLIDATED REPORT
    --------------------------
    📌 Key Themes:
    [List themes]

    🚧 Shared Blockers:
    [List blockers]

    📝 Draft Summary:
    [Write a paragraph summary]
    ---

    Report:
  `);

  const chain = RunnableSequence.from([
    {
      context: async (input: { query: string }) => {
        const docs = await retriever.invoke(input.query);
        return docs.map((d) => d.pageContent).join("\n\n");
      },
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  const report = await chain.invoke({ query: "weekly project updates status" });
  console.log("\n📋 GENERATED REPORT:\n");
  console.log(report);
  return report;
};

runGeneration().catch(console.error);
