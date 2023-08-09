import { pipe } from 'fp-ts/lib/function';
import { cfnTECreateWebhook } from 'src/repositories/webhooks';
import { match as TE_match } from 'fp-ts/TaskEither';

export async function cfnCreateWebhook(data: any, api_key: string) {
  return await pipe(
    cfnTECreateWebhook({ ...data, api_key }),
    TE_match(
      (err) => {
        throw err;
      },
      () => null,
    ),
  )();
}
