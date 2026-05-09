import { DefaultEmbeddingFunction } from 'chromadb';
import { getChromaClient } from '../config/chroma.js';
import logger from '../utils/logger.js';

const embedder = new DefaultEmbeddingFunction();

/**
 * Upsert transcript chunks into ChromaDB.
 *
 * Uses ChromaDB's built-in embedding function (all-MiniLM-L6-v2)
 * which runs server-side inside the ChromaDB container.
 *
 * Scalability: ChromaDB handles embedding generation internally,
 * so no external API calls are needed for embeddings. This reduces
 * latency and cost at scale.
 *
 * @param {string} videoId
 * @param {Array} chunks - Array of chunk objects
 */
export async function upsertChunks(videoId, chunks) {
  const client = getChromaClient();
  const collectionName = `video_${videoId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // Get or create collection with explicit embedder
  const collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata: { 'hnsw:space': 'cosine' },
    embeddingFunction: embedder,
  });

  // Batch upsert for efficiency
  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await collection.add({
      ids: batch.map((c) => c.chunkId),
      documents: batch.map((c) => c.text),
      metadatas: batch.map((c) => ({
        videoId,
        chunkId: c.chunkId,
        startSeconds: c.startSeconds,
        endSeconds: c.endSeconds,
        startTimestamp: c.startTimestamp,
        tokenCount: c.tokenCount,
      })),
    });
  }

  logger.info(`Upserted ${chunks.length} chunks for video ${videoId}`);
}

/**
 * Search for relevant chunks using semantic similarity.
 *
 * @param {string} videoId
 * @param {string} query
 * @param {number} topK - Number of results to return
 * @returns {Array<{text, startSeconds, endSeconds, startTimestamp, score}>}
 */
export async function searchChunks(videoId, query, topK = 5) {
  const client = getChromaClient();
  const collectionName = `video_${videoId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  try {
    const collection = await client.getCollection({
      name: collectionName,
      embeddingFunction: embedder,
    });
    const results = await collection.query({
      queryTexts: [query],
      nResults: topK,
    });

    if (!results.documents?.[0]) return [];

    return results.documents[0].map((doc, i) => ({
      text: doc,
      startSeconds: results.metadatas[0][i].startSeconds,
      endSeconds: results.metadatas[0][i].endSeconds,
      startTimestamp: results.metadatas[0][i].startTimestamp,
      score: results.distances?.[0]?.[i] || 0,
    }));
  } catch (err) {
    logger.error(`ChromaDB search failed: ${err.message}`);
    return [];
  }
}

/**
 * Get all chunks for a video (for summary generation).
 */
export async function getAllChunks(videoId) {
  const client = getChromaClient();
  const collectionName = `video_${videoId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  try {
    const collection = await client.getCollection({ name: collectionName });
    const results = await collection.get();

    if (!results.documents) return [];

    return results.documents.map((doc, i) => ({
      text: doc,
      ...results.metadatas[i],
    }));
  } catch (err) {
    logger.error(`ChromaDB getAllChunks failed: ${err.message}`);
    return [];
  }
}
