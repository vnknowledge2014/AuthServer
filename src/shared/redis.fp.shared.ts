import { BadRequestException } from '@nestjs/common';
import {
  cfnCheckExistRedis,
  cfnDeleteRedis,
  cfnGetMgetRedis,
  cfnGetRedis,
  cfnInsertRedis,
  cfnSearchRedis,
} from '.';
import TE from 'fp-ts/TaskEither';

export function cfnTEInsertRedis(
  key: string,
  value: string,
  ttl = 60,
): TE.TaskEither<Error, string> {
  return TE.tryCatch(
    () => cfnInsertRedis(key, value, ttl),
    () => {
      throw new BadRequestException('Cannot insert cache');
    },
  );
}

export function cfnTEGetRedis(key: string): TE.TaskEither<Error, string> {
  return TE.tryCatch(
    () => cfnGetRedis(key),
    () => {
      throw new BadRequestException('Cannot get cache');
    },
  );
}

export function cfnTEGetMgetRedis(
  keys: string[],
): TE.TaskEither<Error, string[]> {
  return TE.tryCatch(
    () => cfnGetMgetRedis(keys),
    () => {
      throw new BadRequestException('Cannot get cache');
    },
  );
}

export function cfnTESearchRedis(key: string): TE.TaskEither<Error, string[]> {
  return TE.tryCatch(
    () => cfnSearchRedis(key),
    () => {
      throw new BadRequestException('Cannot search cache');
    },
  );
}

export function cfnTEDeleteRedis(key: string): TE.TaskEither<Error, number> {
  return TE.tryCatch(
    () => cfnDeleteRedis(key),
    () => {
      throw new BadRequestException('Cannot delete cache');
    },
  );
}

export function cfnTECheckExistRedis(key: string): TE.TaskEither<Error, any> {
  return TE.tryCatch(
    () => cfnCheckExistRedis(key),
    () => {
      throw new BadRequestException('Cannot check exits key');
    },
  );
}
