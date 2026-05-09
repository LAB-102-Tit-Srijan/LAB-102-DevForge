import Groq, { toFile } from 'groq-sdk';
import fs from 'fs-extra';
import path from 'path';
import { splitAudio } from './video-download.service.js';
import logger from '../utils/logger.js';

const WHISPER_MODEL = 'whisper-large-v3-turbo';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Groq Whisper limit

let groq = null;
const getGroq = () => {
  if (!groq) {
    groq = new Groq({ 
      apiKey: process.env.GROQ_API_KEY,
      timeout: 4 * 60 * 1000, // 4 minutes
      maxRetries: 3,
    });
  }
  return groq;
};

/**
 * Transcribe an audio file using Groq Whisper.
 *
 * If the file exceeds 25MB, it's automatically split into
 * segments and transcribed sequentially with correct timestamp
 * offsets.
 *
 * Scalability: Groq Whisper provides ultra-fast transcription
 * (~10x real-time), making processing efficient even for long
 * lectures. Segment-based splitting handles arbitrarily long
 * audio files.
 *
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<Array<{text: string, start: number, end: number}>>}
 */
export async function transcribeAudio(audioPath) {
  const stats = await fs.stat(audioPath);
  logger.info(`Transcribing audio: ${audioPath} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);

  // If file is small enough, transcribe directly
  if (stats.size <= MAX_FILE_SIZE) {
    return transcribeSingleFile(audioPath, 0);
  }

  // File too large — split and transcribe segments
  logger.info('Audio file exceeds 25MB limit, splitting into segments...');
  return transcribeLargeAudio(audioPath);
}

/**
 * Transcribe a single audio file (must be under 25MB).
 *
 * @param {string} audioPath - Path to audio file
 * @param {number} timeOffset - Time offset in seconds to add to timestamps
 * @returns {Promise<Array<{text: string, start: number, end: number}>>}
 */
async function transcribeSingleFile(audioPath, timeOffset = 0) {
  const client = getGroq();

  try {
    const buffer = await fs.readFile(audioPath);
    const file = await toFile(buffer, path.basename(audioPath));

    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: WHISPER_MODEL,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Extract segments with timestamps
    const segments = (transcription.segments || []).map((seg) => ({
      text: seg.text?.trim() || '',
      start: (seg.start || 0) + timeOffset,
      end: (seg.end || 0) + timeOffset,
    })).filter((seg) => seg.text.length > 0);

    logger.info(`Transcribed ${segments.length} segments (offset: ${timeOffset}s)`);
    return segments;
  } catch (err) {
    logger.error(`Whisper transcription failed: ${err.message}`);
    throw new Error(`Transcription failed: ${err.message}`);
  }
}

/**
 * Transcribe a large audio file by splitting into segments.
 *
 * @param {string} audioPath - Path to the large audio file
 * @returns {Promise<Array<{text: string, start: number, end: number}>>}
 */
async function transcribeLargeAudio(audioPath) {
  const segments = await splitAudio(audioPath);
  const allTranscriptions = [];
  const tempPaths = [];

  for (const segment of segments) {
    try {
      const segTranscriptions = await transcribeSingleFile(segment.path, segment.offset);
      allTranscriptions.push(...segTranscriptions);
    } catch (err) {
      logger.error(`Segment transcription failed at offset ${segment.offset}: ${err.message}`);
      // Continue with remaining segments rather than failing entirely
    }

    // Track temp files for cleanup (skip the original audio path)
    if (segment.path !== audioPath) {
      tempPaths.push(segment.path);
    }
  }

  // Cleanup segment files
  for (const p of tempPaths) {
    await fs.remove(p).catch(() => {});
  }

  logger.info(`Total transcription: ${allTranscriptions.length} segments from ${segments.length} audio chunks`);
  return allTranscriptions;
}
