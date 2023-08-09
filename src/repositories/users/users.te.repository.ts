import { Prisma, user } from '@prisma/client';
import { tryCatch as TE_tryCatch, TaskEither } from 'fp-ts/TaskEither';
import {
  cfnCreateUser,
  cfnUpdateUser,
  cfnDeleteUser,
  cfnFindManyUser,
  cfnCountUser,
  cfnFindOneAndSelectUser,
} from './users.repository';

function cfnTECreateUser(
  data: Prisma.userCreateInput,
): TaskEither<Error, user> {
  return TE_tryCatch(
    () => cfnCreateUser(data),
    (err) => {
      throw err;
    },
  );
}

function cfnTEUpdateUser(
  condition: Partial<user>,
  user: Prisma.userUpdateInput,
): TaskEither<Error, user> {
  return TE_tryCatch(
    () => cfnUpdateUser(condition, user),
    (err) => {
      throw err;
    },
  );
}

function cfnTEDeleteUser(condition: Partial<user>): TaskEither<Error, user> {
  return TE_tryCatch(
    () => cfnDeleteUser(condition),
    (err) => {
      throw err;
    },
  );
}

function cfnTEFindOneUser(
  condition: Prisma.userWhereInput,
  select?: Prisma.userSelect,
): TaskEither<Error, Partial<user>> {
  return TE_tryCatch(
    () => cfnFindOneAndSelectUser(condition, select),
    (err) => {
      throw err;
    },
  );
}

function cfnTEFindManyUser(
  condition: Prisma.userWhereInput,
  take = 10,
  skip = 0,
  select?: Prisma.userSelect,
): TaskEither<Error, Partial<user>[]> {
  return TE_tryCatch(
    () => cfnFindManyUser(condition, take, skip, select),
    (err) => {
      throw err;
    },
  );
}

function cfnTECountUser(
  condition: Prisma.userWhereInput,
): TaskEither<Error, number> {
  return TE_tryCatch(
    () => cfnCountUser(condition),
    (err) => {
      throw err;
    },
  );
}

export {
  cfnTECreateUser,
  cfnTEUpdateUser,
  cfnTEDeleteUser,
  cfnTEFindOneUser,
  cfnTEFindManyUser,
  cfnTECountUser,
};
