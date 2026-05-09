import { ChromaClient } from 'chromadb';
import logger from '../utils/logger.js';

let client = null;

export const getChromaClient = () => {
  if (!client) {
    const url = process.env.CHROMA_URL || 'http://localhost:8000';
    client = new ChromaClient({ path: url });
    logger.info(`✅ ChromaDB client initialized (${url})`);
  }
  return client;
};

export default getChromaClient;
