import { getVideoQueue } from '../config/queue.js';
import logger from '../utils/logger.js';

/**
 * Enqueue a video processing job.
 *
 * Scalability: BullMQ provides reliable job processing with
 * automatic retries, back-pressure handling, and horizontal
 * scaling via multiple worker instances.
 */
export async function enqueueVideoProcessing(videoData) {
  const queue = getVideoQueue();
  const job = await queue.add('process-video', videoData, {
    jobId: videoData.videoId,
  });
  logger.info(`Enqueued video processing job: ${job.id}`);
  return job;
}
