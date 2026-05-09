import { Queue } from 'bullmq';
import Redis from 'ioredis';
import logger from '../utils/logger.js';

let videoQueue = null;

export const getVideoQueue = () => {
  if (!videoQueue) {
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
    videoQueue = new Queue('video-processing', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
    logger.info('✅ BullMQ video queue initialized');
  }
  return videoQueue;
};

export default getVideoQueue;
