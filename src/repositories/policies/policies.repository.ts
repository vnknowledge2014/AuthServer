import { Prisma } from '@prisma/client';
import { prisma_client } from 'src/shared';

async function cfnCreatePolicy(data: Prisma.policyCreateInput) {
  return await prisma_client.policy.create({ data });
}

async function cfnUpdatePolicy(
  conditions: Prisma.policyWhereInput,
  data: Prisma.policyUpdateInput,
) {
  return await prisma_client.policy.updateMany({ where: conditions, data });
}

async function cfnFindOnePolicy(condition: Prisma.policyWhereInput) {
  return await prisma_client.policy.findFirst({
    where: condition,
  });
}

async function cfnGetPolicies(conditions: Prisma.policyWhereInput) {
  return await prisma_client.policy.findMany({ where: conditions });
}

export { cfnCreatePolicy, cfnUpdatePolicy, cfnFindOnePolicy, cfnGetPolicies };
