import { Prisma } from '@prisma/client';
import { prisma_client } from 'src/shared';

async function cfnGetUserApiKey(conditions: Prisma.api_keyWhereInput) {
  return await prisma_client.api_key.findFirst({
    where: conditions,
    include: { user: true },
  });
}

async function cfnCreateUserApiKey(data: Prisma.api_keyCreateInput) {
  return await prisma_client.api_key.create({ data });
}

async function cfnDeleteUserApiKeys(conditions: Prisma.api_keyWhereInput) {
  return await prisma_client.api_key.deleteMany({
    where: conditions,
  });
}

async function cfnGetUserApiKeys(
  conditions: Prisma.api_keyWhereInput,
  select?: Prisma.api_keySelect,
) {
  return await prisma_client.api_key.findMany({
    where: conditions,
    select,
  });
}

export {
  cfnGetUserApiKey,
  cfnCreateUserApiKey,
  cfnDeleteUserApiKeys,
  cfnGetUserApiKeys,
};
