import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redis = null;

export const connectRedis = async () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    redis.on('connect', () => logger.info('✅ Redis connected'));
    redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    return redis;
  } catch (err) {
    logger.error(`Redis connection failed: ${err.message}`);
    throw err;
  }
};

export const getRedis = () => {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
};

export default redis;
