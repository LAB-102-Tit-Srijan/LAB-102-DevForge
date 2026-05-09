import { getRedis } from '../config/redis.js';
import logger from '../utils/logger.js';

const DEFAULT_TTL = 3600; // 1 hour

/**
 * Cache service using Redis.
 *
 * Scalability: Redis provides sub-millisecond reads for cached
 * responses, reducing LLM calls and ChromaDB queries for
 * frequently asked questions. Cache key format: videoId:hash
 */
export async function cacheGet(key) {
  try {
    const redis = getRedis();
    const value = await redis.get(key);
    if (value) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(value);
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  } catch (err) {
    logger.error(`Cache get error: ${err.message}`);
    return null;
  }
}

export async function cacheSet(key, value, ttl = DEFAULT_TTL) {
  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
    logger.debug(`Cache SET: ${key}`);
  } catch (err) {
    logger.error(`Cache set error: ${err.message}`);
  }
}

/**
 * Generate a normalized cache key from videoId and question.
 */
export function cacheKey(videoId, input) {
  const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');
  return `${videoId}:${simpleHash(normalized)}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
