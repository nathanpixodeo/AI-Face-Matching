import IORedis from 'ioredis';
import { env } from './env';

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export async function disconnectRedis(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
