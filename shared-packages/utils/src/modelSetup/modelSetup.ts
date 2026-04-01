import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";

type CreateChatModelOptions = {
  model?: string;
  temperature?: number;
};

export const createChatModel = ({
  model = "llama3",
  temperature = 0.7,
}: CreateChatModelOptions = {}): ChatOllama => {
  return new ChatOllama({ model, temperature });
};

export const createEmbeddings = (
  model = "nomic-embed-text",
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
    collectionName: config?.collectionName ?? "default",
    url: config?.url ?? "http://localhost:8000",
  });
};

