import { policy, Prisma } from '@prisma/client';
import { tryCatch as TE_tryCatch, TaskEither } from 'fp-ts/TaskEither';
import {
  cfnCreatePolicy,
  cfnFindOnePolicy,
  cfnGetPolicies,
  cfnUpdatePolicy,
} from '.';

function cfnTECreatePolicy(
  data: Prisma.policyCreateInput,
): TaskEither<Error, policy> {
  return TE_tryCatch(
    () => cfnCreatePolicy(data),
    (err) => {
      throw err;
    },
  );
}

function cfnTEUpdatePolicy(
  conditions: Prisma.policyWhereInput,
  data: Prisma.policyUpdateInput,
) {
  return TE_tryCatch(
    () => cfnUpdatePolicy(conditions, data),
    (err) => {
      throw err;
    },
  );
}

function cfnTEFindOnePolicy(conditions: Prisma.policyWhereInput) {
  return TE_tryCatch(
    () => cfnFindOnePolicy(conditions),
    (err) => {
      throw err;
    },
  );
}

function cfnTEFindPolicies(conditions: Prisma.policyWhereInput) {
  return TE_tryCatch(
    () => cfnGetPolicies(conditions),
    (err) => {
      throw err;
    },
  );
}

export {
  cfnTECreatePolicy,
  cfnTEUpdatePolicy,
  cfnTEFindOnePolicy,
  cfnTEFindPolicies,
};
