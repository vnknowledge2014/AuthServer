import { Prisma } from '@prisma/client';
import { tryCatch as TE_tryCatch } from 'fp-ts/TaskEither';
import {
  cfnCreateUserPolicy,
  cfnDeleteUserPolicies,
  cfnGetUserPolicies,
} from '.';

function cfnTEGetUserPolicies(condition: Prisma.user_policyWhereInput) {
  return TE_tryCatch(
    () => cfnGetUserPolicies(condition),
    (err) => {
      throw err;
    },
  );
}

function cfnTECreateUserPolicy(data: Prisma.user_policyCreateManyInput[]) {
  return TE_tryCatch(
    () => cfnCreateUserPolicy(data),
    (err) => {
      throw err;
    },
  );
}

function cfnTEDeleteUserPolicies(conditions: Prisma.user_policyWhereInput) {
  return TE_tryCatch(
    () => cfnDeleteUserPolicies(conditions),
    (err) => {
      throw err;
    },
  );
}

export { cfnTEGetUserPolicies, cfnTECreateUserPolicy, cfnTEDeleteUserPolicies };
