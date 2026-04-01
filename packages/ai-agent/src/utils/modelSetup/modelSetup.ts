import { CONFIG } from "../../config";
import {
  createChatModel,
  createEmbeddings,
  createVectorStore,
} from "@repo/utils";

export { createChatModel, createEmbeddings, createVectorStore };

const defaultVectorStore = () => {
  const embeddings = createEmbeddings(CONFIG.EMBEDDING_MODEL);
  return createVectorStore(embeddings, {
    collectionName: CONFIG.COLLECTION_NAME,
    url: CONFIG.CHROMA_URL,
  });
};

export default defaultVectorStore;
