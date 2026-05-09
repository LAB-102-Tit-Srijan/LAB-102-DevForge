import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redis = null;

export const connectRedis = async () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 10) return null; // Stop retrying after 10 attempts
        return Math.min(times * 200, 3000);
      },
      lazyConnect: true,
    });
    redis.on('connect', () => logger.info('✅ Redis connected'));
    redis.on('error', () => {}); // Suppress noisy error logs
    await redis.connect().catch(() => logger.warn('⚠️ Redis unavailable — caching disabled'));
    return redis;
  } catch (err) {
    logger.warn(`⚠️ Redis unavailable: ${err.message} — caching disabled`);
    return null;
  }
};

export const getRedis = () => {
  return redis; // May be null if Redis is unavailable
};

export default redis;
