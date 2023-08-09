import { Prisma, user } from '@prisma/client';
import { prisma_client } from 'src/shared';

async function cfnCreateUser(data: Prisma.userCreateInput) {
  return await prisma_client.user.create({ data });
}

async function cfnUpdateUser(
  condition: Partial<user>,
  user: Prisma.userUpdateInput,
) {
  return await prisma_client.user.update({ where: condition, data: user });
}

async function cfnDeleteUser(condition: Partial<user>) {
  return await prisma_client.user.delete({ where: condition });
}

async function cfnFindOneAndSelectUser(
  condition: Prisma.userWhereInput,
  select?: Prisma.userSelect,
) {
  return await prisma_client.user.findFirst({
    where: condition,
    select: select,
  });
}

async function cfnFindOneUser(condition: Prisma.userWhereInput) {
  return await prisma_client.user.findFirst({
    where: condition,
  });
}

async function cfnFindUniqueUser(
  condition: Prisma.userWhereUniqueInput,
  select?: Prisma.userSelect,
) {
  return await prisma_client.user.findUnique({ where: condition, select });
}

async function cfnFindManyUser(
  condition: Prisma.userWhereInput,
  take = 10,
  skip = 0,
  select?: Prisma.userSelect,
) {
  return await prisma_client.user.findMany({
    where: condition,
    select,
    take,
    skip,
  });
}

async function cfnCountUser(condition: Prisma.userWhereInput) {
  return await prisma_client.user.count({ where: condition });
}

export {
  cfnCreateUser,
  cfnUpdateUser,
  cfnDeleteUser,
  cfnFindOneUser,
  cfnFindUniqueUser,
  cfnFindManyUser,
  cfnCountUser,
  cfnFindOneAndSelectUser,
};
