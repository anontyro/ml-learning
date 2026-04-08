import {
  createChatModel,
  createEmbeddings,
  createVectorStore,
} from "@repo/utils";

import { config } from "@dotenvx/dotenvx";
config({ path: [".env", ".env.local"] });

const defaultVectorStore = () => {
  const embeddings = createEmbeddings(process.env.EMBEDDING_MODEL);

  return createVectorStore(embeddings, {
    collectionName: process.env.COLLECTION_NAME ?? "",
    url: process.env.CHROMA_URL ?? "",
  });
};

export { createChatModel, createEmbeddings, createVectorStore };

export default defaultVectorStore;
