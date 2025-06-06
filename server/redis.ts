import Redis from 'ioredis';

let redis: Redis | null = null;

export function createRedisClient(): Redis | null {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl);

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('close', () => {
      console.log('Redis connection closed');
    });

    return redis;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

export function getRedisClient(): Redis | null {
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.disconnect();
    redis = null;
  }
}