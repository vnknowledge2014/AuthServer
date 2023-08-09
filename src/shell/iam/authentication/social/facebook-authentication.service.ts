import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { pipe } from 'fp-ts/lib/function';
import {
  of as TE_of,
  TaskEither as TE_TaskEither,
  chain as TE_chain,
  match as TE_match,
  left as TE_left,
  right as TE_right,
  tryCatch as TE_tryCatch,
  map as TE_map,
} from 'fp-ts/TaskEither';
import { user as UserModel } from '@prisma/client';
import { TAuthTokens, TRequiredTFA } from 'src/core';
import {
  cfnExecutePost,
  cfnFetchData,
  cfnGenSocialRandomKey,
} from 'src/shared';
import {
  cfnTECreateUser,
  cfnTEFindOneUser,
  cfnTEUpdateUser,
} from 'src/repositories';
import {
  cfnCacheAuthTokens,
  cfnReturnTokens,
  cfnVerifyTfaCode,
} from '../authentication.service';

const facebookUrl = 'https://graph.facebook.com/v15.0/';
const facebookScope = process.env.FACEBOOK_SCOPE;

export async function cfnFbAuthenticate(
  token: string,
  tfa_code: string,
  user_agent: string,
): Promise<TAuthTokens | TRequiredTFA> {
  const url = `${facebookUrl}/me?fields=${facebookScope}&access_token=${token}`;

  return await pipe(
    TE_of(cfnCheckEnableSocialAuth()),
    () => {
      return TE_tryCatch(
        async () => {
          const data = await cfnFetchData(url);

          const { id, email } = data;

          if (!email || !id) {
            throw new BadRequestException('User email or id is not found');
          }

          return { email, id };
        },
        (err) => {
          throw err;
        },
      );
    },
    TE_chain(({ email, id }) =>
      cfnUpsertUserWithFb(email, id, user_agent, tfa_code),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => {
        return val;
      },
    ),
  )();
}

export async function cfnHandleFacebookOAuthDialogUrl(
  auth_token: string,
  user_agent: string,
): Promise<string> {
  const randomKey = await pipe(
    cfnGetFbAccessToken(auth_token),
    TE_chain((response) =>
      response.access_token
        ? TE_right(response.access_token)
        : TE_left(new BadRequestException('Access token is not found')),
    ),
    TE_chain((accessToken) => cfnGetFbUserData(accessToken)),
    TE_chain((response) =>
      !response.email || !response.id
        ? TE_left(new BadRequestException('User email or id is not found'))
        : cfnUpsertUserWithFbPkce(
            response.email as string,
            response.id as string,
            user_agent,
          ),
    ),
    TE_chain((data) =>
      TE_tryCatch(
        () =>
          cfnGenSocialRandomKey(
            `${data.refreshToken};${data.tfaSecret};${data.sessionId}`,
          ),
        (err) => {
          throw err;
        },
      ),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();

  return `${process.env.FE_SOCIAL_LOGIN_REDIRECT}?code=${randomKey}`;
}

function cfnGetFbAccessToken(auth_code: string): TE_TaskEither<never, any> {
  const url = `${process.env.FACEBOOK_ACCESS_TOKEN_ENDPOINT}?client_id=${
    process.env.FACEBOOK_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.FACEBOOK_CALLBACK_URL,
  )}&client_secret=${encodeURIComponent(
    process.env.FACEBOOK_CLIENT_SECRET,
  )}&code=${auth_code}`;

  return TE_tryCatch(
    () => cfnExecutePost(url),
    (err) => {
      throw err;
    },
  );
}

function cfnUpsertUserWithFbPkce(
  email: string,
  facebook_id: string,
  user_agent: string,
): TE_TaskEither<never, TAuthTokens & { tfaSecret: string }> {
  return pipe(
    cfnTEFindOneUser({ email }),
    TE_chain((user: UserModel) => {
      if (!user) {
        return cfnTECreateUser({ email, facebookId: facebook_id });
      }

      if (!user.facebookId) {
        return cfnTEUpdateUser({ email }, { facebookId: facebook_id });
      }
    }),
    TE_chain((user) =>
      pipe(
        cfnCacheAuthTokens(user, user_agent),
        TE_map((result) => ({ result, user })),
      ),
    ),
    TE_chain(({ result, user }) =>
      TE_of({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.session_id,
        tfaSecret: user.tfaSecret,
      }),
    ),
  );
}

function cfnGetFbUserData(access_token: string): TE_TaskEither<never, any> {
  const url = `https://graph.facebook.com/v7.0/me?fields=email&access_token=${access_token}`;

  return TE_tryCatch(
    () => cfnExecutePost(url),
    (err) => {
      throw err;
    },
  );
}

function cfnCheckEnableSocialAuth(): void {
  const isEnable = process.env.ENABLE_FACEBOOK_AUTHEN === 'true';

  if (!isEnable) throw new ForbiddenException('Facebook auth is disabled');
}

function cfnUpsertUserWithFb(
  email: string,
  facebook_id: string,
  user_agent: string,
  tfa_code?: string,
): TE_TaskEither<never, TAuthTokens | TRequiredTFA> {
  return pipe(
    cfnTEFindOneUser({ email }),
    TE_chain((user: UserModel) =>
      !user
        ? cfnInsertUserAndGenTokens(email, facebook_id, user_agent)
        : cfnUpdateUserAndGenTokens(user, facebook_id, user_agent, tfa_code),
    ),
  );
}

function cfnInsertUserAndGenTokens(
  email: string,
  facebook_id: string,
  user_agent: string,
): TE_TaskEither<never, TAuthTokens> {
  return pipe(
    cfnTECreateUser({ email: email, facebookId: facebook_id }),
    TE_chain((user) => cfnCacheAuthTokens(user, user_agent)),
    TE_chain((result) =>
      TE_of({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.session_id,
      }),
    ),
  );
}

function cfnUpdateUserAndGenTokens(
  user: UserModel,
  facebook_id: string,
  user_agent: string,
  tfa_code: string,
): TE_TaskEither<never, TRequiredTFA | TAuthTokens> {
  return pipe(
    facebook_id
      ? cfnTEUpdateUser({ email: user.email }, { facebookId: facebook_id })
      : null,
    TE_chain(() => cfnVerifyTfaCode(user, tfa_code)),
    TE_chain(
      (result): TE_TaskEither<never, TRequiredTFA | TAuthTokens> =>
        'requireTfa' in result
          ? TE_of({ requireTfa: true })
          : cfnReturnTokens(result, user_agent, true),
    ),
  );
}
