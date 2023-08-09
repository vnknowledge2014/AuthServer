import { Prisma } from '@prisma/client';
import { tryCatch as TE_tryCatch } from 'fp-ts/TaskEither';
import { cfnCreateWebhook } from '.';

function cfnTECreateWebhook(data: Prisma.webhookCreateInput) {
  return TE_tryCatch(
    () => cfnCreateWebhook(data),
    (err) => {
      throw err;
    },
  );
}

export { cfnTECreateWebhook };
