import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

// Use bundled ffmpeg binary for local dev; Docker image has system ffmpeg
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Downloads a video from an HTTP URL to a local temporary file.
 */
export async function downloadHttpVideo(url) {
  const outputPath = path.join(TEMP_DIR, `dl_${Date.now()}.mp4`);
  logger.info(`Downloading remote video to local storage: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`);
  await pipeline(res.body, createWriteStream(outputPath));
  return outputPath;
}

const TEMP_DIR = process.env.TEMP_DIR || './temp';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure directories exist on module load
await fs.ensureDir(TEMP_DIR);
await fs.ensureDir(UPLOAD_DIR);

/**
 * Download video from a YouTube URL using yt-dlp (spawn + watchdog).
 *
 * FIX-HANG-1: Uses single-stream "best[ext=mp4]/best" format to avoid
 * the ffmpeg audio-merge hang caused by YouTube DASH stream throttling.
 * FIX-HANG-2: Wraps spawn in a 5-minute watchdog that SIGKILLs on timeout.
 * FIX-HANG-3: Adds --socket-timeout / --fragment-retries to abort stale sockets.
 *
 * @param {string} url - YouTube video URL
 * @returns {Promise<string>} Path to downloaded video file
 */
export async function downloadYoutubeVideo(url) {
  const filename = `yt_${Date.now()}`;
  const outputTemplate = path.join(TEMP_DIR, `${filename}.%(ext)s`);

  try {
    // FIX-HANG-1: Single pre-muxed stream — no separate audio stream, no ffmpeg merge
    // FIX-HANG-5: Removed --merge-output-format, -x, --audio-format (all require separate streams)
    const args = [
      url,
      '-f', 'best[ext=mp4]/best',
      '-o', outputTemplate,
      '--no-playlist',
      '--socket-timeout', '30',     // FIX-HANG-3: abort if no data for 30s
      '--retries', '3',
      '--fragment-retries', '3',
      '--no-part',
      '--no-warnings',
      '--no-check-certificates'
    ];

    const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
    if (await fs.pathExists(cookiesPath)) {
      args.push('--cookies', cookiesPath);
      logger.info('Using cookies.txt for YouTube download');
    }

    logger.info(`Downloading YouTube video: ${url}`);

    // FIX-HANG-2: Hard watchdog — kill process if it hangs beyond 5 minutes
    const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
    await new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', args);
      let stderr = '';

      const watchdog = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new Error('yt-dlp timed out after 5 minutes — killed'));
      }, DOWNLOAD_TIMEOUT_MS);

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        if (data.toString().includes('%')) {
          logger.debug(`[yt-dlp] ${data.toString().trim()}`);
        }
      });

      proc.on('close', (code) => {
        clearTimeout(watchdog);
        if (code === 0) resolve();
        else reject(new Error(`yt-dlp exited with code ${code}:\n${stderr}`));
      });

      proc.on('error', (err) => {
        clearTimeout(watchdog);
        reject(new Error(`yt-dlp spawn error: ${err.message}`));
      });
    });

    // Find the output file
    const outputPath = path.join(TEMP_DIR, `${filename}.mp4`);
    if (await fs.pathExists(outputPath)) {
      const stats = await fs.stat(outputPath);
      logger.info(`Downloaded video: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
      return outputPath;
    }

    // Fallback: any file matching the prefix
    const files = await fs.readdir(TEMP_DIR);
    const match = files.find((f) => f.startsWith(filename));
    if (match) {
      const matchPath = path.join(TEMP_DIR, match);
      logger.info(`Downloaded video (fallback): ${matchPath}`);
      return matchPath;
    }

    throw new Error('yt-dlp completed but output file not found');
  } catch (err) {
    logger.error(`YouTube video download failed: ${err.message}`);
    throw new Error(`Failed to download YouTube video: ${err.message}`);
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
