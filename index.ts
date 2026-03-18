import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { readdir } from "fs/promises";
import { join } from "path";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Document } from "@langchain/core/documents";

const CHROMA_URL = "http://localhost:8000";
const COLLECTION_NAME = "weekly-updates";
const DOCS_DIR = "./docs";

const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text" });
const llm = new ChatOllama({ model: "llama3", temperature: 0.7 });

const generateDocumentId = (content: string, filePath: string): string => {
  const hash = crypto.createHash("sha256");

  hash.update(filePath + content);

  return hash.digest("hex");
};

const readDocs = async (dir: string = DOCS_DIR) => {
  console.log(`📂 Loading documents from ${dir}...`);

  const files = await readdir(dir);
  const docxFiles = files.filter(
    (f) => f.endsWith(".docx") || f.endsWith(".doc"),
  );

  console.log(`Found ${docxFiles.length} .docx/.doc files`);

  const allDocs: Document<Record<string, any>>[] = [];
  for (const file of docxFiles) {
    console.log(`📄 Loading: ${file}`);
    const loader = new DocxLoader(join(dir, file));
    const docs = await loader.load();

    const docsWithIds = docs.map((d) => {
      const id = generateDocumentId(d.pageContent, d.metadata.source);
      return {
        ...d,
        id: id,
      };
    });
    allDocs.push(...docsWithIds);
  }

  console.log(`✅ Loaded ${allDocs.length} documents.`);
  return allDocs;
};

const ingestDocuments = async (
  collectionName: string,
  url: string,
): Promise<Chroma | null> => {
  if (!fs.existsSync(DOCS_DIR)) {
    console.log("❌ Docs folder not found. Skipping ingestion.");
    return null;
  }

  const docs = await readDocs();

  const vectorStore = new Chroma(embeddings, {
    collectionName,
    url,
  });

  await vectorStore.addDocuments(docs);

  console.log("💾 Documents synced to ChromaDB (New/Updated only).");
  return vectorStore;
};

const generateReport = async (vectorStore: Chroma) => {
  console.log("\n🤖 Agent is analyzing themes...");

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
        return docs.map(d => d.pageContent).join("\n\n");
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

async function main() {
  try {
    const vectorStore = await ingestDocuments(COLLECTION_NAME, CHROMA_URL);

    if (!vectorStore) {
      throw new Error("Unable to load vector store");
    }

    await generateReport(vectorStore);
  } catch (error) {
    console.error("❌ Error occurred:", error);
  }
}

main();
