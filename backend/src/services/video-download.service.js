import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

// Use bundled ffmpeg binary for local dev; Docker image has system ffmpeg
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const TEMP_DIR = process.env.TEMP_DIR || './temp';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure directories exist on module load
await fs.ensureDir(TEMP_DIR);
await fs.ensureDir(UPLOAD_DIR);

/**
 * Download audio from a YouTube URL using yt-dlp.
 *
 * Scalability: yt-dlp is the industry-standard tool for YouTube
 * downloads and handles rate limiting, format selection, and
 * geo-restrictions automatically.
 *
 * @param {string} url - YouTube video URL
 * @returns {Promise<string>} Path to downloaded audio file
 */
export async function downloadYoutubeAudio(url) {
  const filename = `yt_${Date.now()}`;
  const outputTemplate = path.join(TEMP_DIR, `${filename}.%(ext)s`);

  try {
    // Download best audio, convert to mp3 for consistent format
    // --no-playlist: don't download playlists
    // -x: extract audio only
    // --audio-format mp3: convert to mp3
    // --audio-quality 3: decent quality, smaller file size (~128kbps)
    const cmd = `yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 3 -o "${outputTemplate}" "${url}"`;
    logger.info(`Downloading YouTube audio: ${url}`);

    const { stdout, stderr } = await execAsync(cmd, { timeout: 300000 }); // 5 min timeout
    logger.debug(`yt-dlp output: ${stdout}`);

    // Find the output file (yt-dlp creates it with .mp3 extension)
    const outputPath = path.join(TEMP_DIR, `${filename}.mp3`);

    // Verify file exists
    if (await fs.pathExists(outputPath)) {
      const stats = await fs.stat(outputPath);
      logger.info(`Downloaded audio: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
      return outputPath;
    }

    // Fallback: search for any file matching the pattern
    const files = await fs.readdir(TEMP_DIR);
    const match = files.find((f) => f.startsWith(filename));
    if (match) {
      const matchPath = path.join(TEMP_DIR, match);
      logger.info(`Downloaded audio (fallback): ${matchPath}`);
      return matchPath;
    }

    throw new Error('yt-dlp completed but output file not found');
  } catch (err) {
    logger.error(`YouTube download failed: ${err.message}`);
    throw new Error(`Failed to download YouTube audio: ${err.message}`);
  }
}

/**
 * Extract audio from an uploaded video file using ffmpeg.
 *
 * @param {string} videoPath - Path to the uploaded video file
 * @returns {Promise<string>} Path to extracted audio file
 */
export async function extractAudio(videoPath) {
  const outputPath = path.join(TEMP_DIR, `audio_${Date.now()}.mp3`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate(128)
      .output(outputPath)
      .on('start', (cmd) => logger.debug(`ffmpeg command: ${cmd}`))
      .on('end', () => {
        logger.info(`Audio extracted: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`ffmpeg error: ${err.message}`);
        reject(new Error(`Failed to extract audio: ${err.message}`));
      })
      .run();
  });
}

/**
 * Get audio file duration in seconds using ffmpeg.
 *
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<number>} Duration in seconds
 */
export async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * Split audio file into segments for large file transcription.
 * Groq Whisper has a 25MB file size limit.
 *
 * @param {string} audioPath - Path to audio file
 * @param {number} segmentDuration - Duration of each segment in seconds (default 15 min)
 * @returns {Promise<Array<{path: string, offset: number}>>} Array of segment info
 */
export async function splitAudio(audioPath, segmentDuration = 900) {
  const segments = [];
  const duration = await getAudioDuration(audioPath);
  const segmentCount = Math.ceil(duration / segmentDuration);

  if (segmentCount <= 1) {
    return [{ path: audioPath, offset: 0 }];
  }

  logger.info(`Splitting audio into ${segmentCount} segments (${segmentDuration}s each)`);

  for (let i = 0; i < segmentCount; i++) {
    const startTime = i * segmentDuration;
    const segPath = path.join(TEMP_DIR, `segment_${Date.now()}_${i}.mp3`);

    await new Promise((resolve, reject) => {
      ffmpeg(audioPath)
        .setStartTime(startTime)
        .setDuration(Math.min(segmentDuration, duration - startTime))
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .output(segPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    segments.push({ path: segPath, offset: startTime });
  }

  return segments;
}

/**
 * Clean up temporary files after processing.
 *
 * @param {string[]} paths - Array of file paths to delete
 */
export async function cleanupTempFiles(paths) {
  for (const p of paths) {
    try {
      await fs.remove(p);
      logger.debug(`Cleaned up: ${p}`);
    } catch {
      logger.warn(`Failed to cleanup: ${p}`);
    }
  }
}
