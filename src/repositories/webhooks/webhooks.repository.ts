import { Prisma } from '@prisma/client';
import { prisma_client } from 'src/shared';

async function cfnCreateWebhook(data: Prisma.webhookCreateInput) {
  return await prisma_client.webhook.create({ data });
}

export { cfnCreateWebhook };
