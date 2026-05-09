import logger from '../utils/logger.js';

/**
 * Chunk transcript segments into semantic groups.
 *
 * Groups consecutive Whisper segments into ~300-word chunks,
 * preserving both start and end timestamps.
 *
 * Scalability: Chunk size is optimized for embedding model
 * context window (512 tokens for MiniLM) and LLM context
 * relevance. Larger chunks provide more context but may
 * dilute retrieval precision.
 *
 * @param {Array<{text: string, start: number, end: number}>} segments
 * @param {number} targetWords - Target words per chunk (default 300)
 * @returns {Array<{chunkId, text, startSeconds, endSeconds, startTimestamp, endTimestamp, tokenCount}>}
 */
export function chunkTranscript(segments, targetWords = 300) {
  if (!segments || segments.length === 0) return [];

  const chunks = [];
  let currentTexts = [];
  let currentStart = 0;
  let currentEnd = 0;
  let wordCount = 0;

  for (const segment of segments) {
    const text = segment.text?.trim();
    if (!text) continue;

    const segmentWords = text.split(/\s+/).length;

    if (currentTexts.length === 0) {
      currentStart = segment.start;
    }

    currentTexts.push(text);
    currentEnd = segment.end;
    wordCount += segmentWords;

    if (wordCount >= targetWords) {
      chunks.push(buildChunk(currentTexts, currentStart, currentEnd, chunks.length));
      currentTexts = [];
      wordCount = 0;
    }
  }

  // Push remaining content
  if (currentTexts.length > 0) {
    chunks.push(buildChunk(currentTexts, currentStart, currentEnd, chunks.length));
  }

  logger.info(`Created ${chunks.length} chunks from ${segments.length} transcript segments`);
  return chunks;
}

/**
 * Build a single chunk object with full metadata.
 */
function buildChunk(texts, startSeconds, endSeconds, index) {
  const text = texts.join(' ');
  return {
    chunkId: `chunk_${index}`,
    text,
    startSeconds: Math.floor(startSeconds),
    endSeconds: Math.ceil(endSeconds),
    startTimestamp: formatTimestamp(startSeconds),
    endTimestamp: formatTimestamp(endSeconds),
    tokenCount: text.split(/\s+/).length,
  };
}

/**
 * Format seconds into mm:ss string.
 */
function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
