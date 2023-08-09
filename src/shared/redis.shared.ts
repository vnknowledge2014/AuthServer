import { BadRequestException } from '@nestjs/common';
import { redis_client } from '.';

export async function cfnInsertRedis(key: string, value: string, ttl = 60) {
  return await redis_client.set(key, value, 'EX', ttl);
}

export async function cfnGetRedis(key: string) {
  return await redis_client.get(key);
}

export async function cfnGetMgetRedis(keys: string[]) {
  return await redis_client.mget(keys);
}

export async function cfnSearchRedis(key: string) {
  return await redis_client.keys(`${key}*`);
}

export async function cfnDeleteRedis(key: string) {
  return await redis_client.del(key);
}

export async function cfnCheckExistRedis(key: string) {
  return await redis_client.exists(key);
}

export async function cfnCheckRefreshToken(key: string, token_id: string) {
  const redis_vaule = await redis_client.get(key);

  if (!redis_vaule) {
    throw new BadRequestException('Refresh token is invalid');
  }

  const refresh_token_id = redis_vaule.split(';')[0];

  if (refresh_token_id !== token_id) {
    throw new BadRequestException('Refresh token is invalid');
  }

  return true;
}
