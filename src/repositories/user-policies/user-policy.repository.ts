import { Prisma } from '@prisma/client';
import { prisma_client } from 'src/shared';

async function cfnGetUserPolicies(conditions: Prisma.user_policyWhereInput) {
  return await prisma_client.user_policy.findMany({
    where: conditions,
    include: {
      policy: true,
    },
  });
}

async function cfnCreateUserPolicy(data: Prisma.user_policyCreateManyInput[]) {
  return await prisma_client.user_policy.createMany({
    data,
  });
}

async function cfnDeleteUserPolicies(conditions: Prisma.user_policyWhereInput) {
  return await prisma_client.user_policy.deleteMany({ where: conditions });
}

export { cfnGetUserPolicies, cfnCreateUserPolicy, cfnDeleteUserPolicies };
