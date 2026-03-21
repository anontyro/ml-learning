import * as path from "path";

export const CONFIG = {
  CHROMA_URL: "http://localhost:8000",
  COLLECTION_NAME: "weekly-updates",
  DOCS_DIR: path.resolve(__dirname, "../docs"),
  EMBEDDING_MODEL: "nomic-embed-text",
  LLM_MODEL: "llama3",
  LLM_TEMPERATURE: 0.7,
};
