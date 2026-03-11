import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { readdir } from "fs/promises";
import { join } from "path";

const CHROMA_URL = "http://localhost:8000";
const COLLECTION_NAME = "weekly-updates";

const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text" });
const llm = new ChatOllama({ model: "llama3", temperature: 0.7 });

const readDocs = async (dir: string = "./docs") => {
  console.log(`📂 Loading documents from ${dir}...`);

  const docsDir = "./docs";
  const files = await readdir(docsDir);
  const docxFiles = files.filter(
    (f) => f.endsWith(".docx") || f.endsWith(".doc"),
  );

  console.log(`Found ${docxFiles.length} .docx/.doc files`);

  const allDocs = [];
  for (const file of docxFiles) {
    console.log(`📄 Loading: ${file}`);
    const loader = new DocxLoader(join(docsDir, file));
    const docs = await loader.load();
    allDocs.push(...docs);
  }

  console.log(`✅ Loaded ${allDocs.length} documents.`);
  return allDocs;
};

const ingestDocuments = async (collectionName: string, url: string) => {
  const docs = readDocs();

  return docs;
};

async function main() {
  try {
    const docs = await ingestDocuments(COLLECTION_NAME, CHROMA_URL);
    console.log(
      "Documents:",
      docs.map((d) => d.pageContent?.slice(0, 50) + "..."),
    );
  } catch (error) {
    console.error("❌ Error occurred:", error);
  }
}

main();
