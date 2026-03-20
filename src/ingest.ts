import * as crypto from "crypto";
import * as fs from "fs";
import { readdir } from "fs/promises";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { CONFIG } from "./config.js";
import { join } from "path";
import {
  createEmbeddings,
  createVectorStore,
} from "./utils/modelSetup/modelSetup.js";

const generateDocumentId = (content: string, filePath: string): string => {
  const hash = crypto.createHash("sha256");

  hash.update(filePath + content);

  return hash.digest("hex");
};

const readDocs = async (dir: string = CONFIG.DOCS_DIR) => {
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

const runIngestion = async (): Promise<Chroma | null> => {
  const embeddings = createEmbeddings();

  if (!fs.existsSync(CONFIG.DOCS_DIR)) {
    console.log("❌ Docs folder not found. Skipping ingestion.");
    return null;
  }

  const docs = await readDocs();

  console.log("🔢 Generating embeddings for documents...");
  const testText = docs[0]?.pageContent?.slice(0, 50);
  const testEmbedding = await embeddings.embedDocuments([testText || "test"]);
  console.log(
    `✅ Embedding generated (vector size: ${testEmbedding[0]?.length} dimensions)`,
  );

  const vectorStore = createVectorStore(embeddings);

  await vectorStore.addDocuments(docs);

  console.log("💾 Documents synced to ChromaDB (New/Updated only).");
  return vectorStore;
};

runIngestion().catch(console.error);
