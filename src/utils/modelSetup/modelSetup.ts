import { CONFIG } from "../../config.js";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";

export const createChatModel = (
  model = CONFIG.LLM_MODEL,
  temperature = CONFIG.LLM_TEMPERATURE,
): ChatOllama => {
  const llm = new ChatOllama({
    model,
    temperature,
  });

  return llm;
};

export const createEmbeddings = (
  model = CONFIG.EMBEDDING_MODEL,
): OllamaEmbeddings => {
  return new OllamaEmbeddings({ model });
};

type VectorProps = {
  collectionName: string;
  url: string;
};

export const createVectorStore = (
  embeddings: OllamaEmbeddings,
  config?: VectorProps,
): Chroma => {
  return new Chroma(embeddings, {
    collectionName: config?.collectionName ?? CONFIG.COLLECTION_NAME,
    url: config?.url ?? CONFIG.CHROMA_URL,
  });
};

const defaultVectorStore = () => {
  const embeddings = createEmbeddings();
  return createVectorStore(embeddings);
};

export default defaultVectorStore;
