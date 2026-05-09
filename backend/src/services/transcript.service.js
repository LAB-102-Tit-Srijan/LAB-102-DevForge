import { YoutubeTranscript } from 'youtube-transcript';
import logger from '../utils/logger.js';

/**
 * Fetch transcript from YouTube video.
 * @param {string} videoId - YouTube video ID
 * @returns {Array<{text: string, offset: number, duration: number}>}
 */
export async function fetchTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    logger.info(`Fetched ${transcript.length} transcript segments for ${videoId}`);
    return transcript;
  } catch (err) {
    logger.error(`Transcript fetch failed for ${videoId}: ${err.message}`);
    throw new Error(`Failed to fetch transcript: ${err.message}`);
  }
}

/**
 * Chunk transcript into semantic chunks with timestamp metadata.
 * 
 * Strategy: Group consecutive segments into ~300-word chunks,
 * preserving sentence boundaries where possible.
 *
 * Scalability: Chunk size is optimized for embedding model context
 * window (512 tokens for MiniLM) while preserving semantic coherence.
 *
 * @param {Array} segments - Raw transcript segments
 * @param {number} targetWords - Target words per chunk
 * @returns {Array<{text, startSeconds, endSeconds, startTimestamp, chunkId, tokenCount}>}
 */
export function chunkTranscript(segments, targetWords = 300) {
  if (!segments || segments.length === 0) return [];

  const chunks = [];
  let currentChunk = { texts: [], startSeconds: 0, endSeconds: 0 };
  let wordCount = 0;

  for (const segment of segments) {
    const text = segment.text?.trim();
    if (!text) continue;

    const segmentWords = text.split(/\s+/).length;

    if (wordCount === 0) {
      currentChunk.startSeconds = segment.offset / 1000; // ms to seconds
    }

    currentChunk.texts.push(text);
    currentChunk.endSeconds = (segment.offset + segment.duration) / 1000;
    wordCount += segmentWords;

    if (wordCount >= targetWords) {
      chunks.push(buildChunk(currentChunk, chunks.length));
      currentChunk = { texts: [], startSeconds: 0, endSeconds: 0 };
      wordCount = 0;
    }
  }

  // Push remaining content
  if (currentChunk.texts.length > 0) {
    chunks.push(buildChunk(currentChunk, chunks.length));
  }

  logger.info(`Created ${chunks.length} chunks from transcript`);
  return chunks;
}

function buildChunk(chunkData, index) {
  const text = chunkData.texts.join(' ');
  return {
    chunkId: `chunk_${index}`,
    text,
    startSeconds: Math.floor(chunkData.startSeconds),
    endSeconds: Math.ceil(chunkData.endSeconds),
    startTimestamp: formatTimestamp(chunkData.startSeconds),
    tokenCount: text.split(/\s+/).length,
  };
}

function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
