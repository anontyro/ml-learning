import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

const CHROMA_URL = "http://localhost:8000";
const COLLECTION_NAME = "weekly-updates";

const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text" });
const llm = new ChatOllama({ model: "llama3", temperature: 0.7 });

const ingestDocuments = async (collectionName: string, url: string) => {
  console.log("📂 Loading documents from ./docs...");

  const loader = new DocxLoader("./docs");
  const docs = await loader.load();

  console.log(`✅ Loaded ${docs.length} documents.`);
};

async function main() {
  try {
    const vectorStore = await ingestDocuments(COLLECTION_NAME, CHROMA_URL);
  } catch (error) {
    console.error("❌ Error occurred:", error);
  }
}
