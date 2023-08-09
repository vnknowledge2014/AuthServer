import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export let redis_client: Redis | null;
export let prisma_client: PrismaClient | null;

function cfnConnectPrisma() {
  const prisma = new PrismaClient();

  prisma
    .$connect()
    .then(() => {
      console.log('Prisma connected successfully');
    })
    .catch(() => {
      throw new Error('Prisma connect failed');
    });

  prisma_client = prisma;
}

function cfnConnectRedis() {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
  });

  redis_client = redis;
}

export const cfnConnectAll = async () => {
  cfnConnectPrisma();
  cfnConnectRedis();
};
