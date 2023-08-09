import { Prisma } from '@prisma/client';
import { tryCatch as TE_tryCatch } from 'fp-ts/TaskEither';
import {
  cfnCreateUserApiKey,
  cfnDeleteUserApiKeys,
  cfnGetUserApiKey,
  cfnGetUserApiKeys,
} from '.';

function cfnTEGetUserApiKey(conditions: Prisma.api_keyWhereInput) {
  return TE_tryCatch(
    () => cfnGetUserApiKey(conditions),
    (err) => {
      throw err;
    },
  );
}

function cfnTECreateUserApiKey(data: Prisma.api_keyCreateInput) {
  return TE_tryCatch(
    () => cfnCreateUserApiKey(data),
    (err) => {
      throw err;
    },
  );
}

function cfnTEDeleteUserApiKeys(conditions: Prisma.api_keyWhereInput) {
  return TE_tryCatch(
    () => cfnDeleteUserApiKeys(conditions),
    (err) => {
      throw err;
    },
  );
}

function cfnTEGetUserApiKeys(
  conditions: Prisma.api_keyWhereInput,
  select?: Prisma.api_keySelect,
) {
  return TE_tryCatch(
    () => cfnGetUserApiKeys(conditions, select),
    (err) => {
      throw err;
    },
  );
}

export {
  cfnTEGetUserApiKey,
  cfnTECreateUserApiKey,
  cfnTEDeleteUserApiKeys,
  cfnTEGetUserApiKeys,
};
