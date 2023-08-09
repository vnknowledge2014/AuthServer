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
  fromTask as TE_fromTask,
} from 'fp-ts/TaskEither';
import { user as UserModel } from '@prisma/client';
import { TAuthTokens, TRequiredTFA, TUserSocialId } from 'src/core';
import {
  cfnCheckExistRedis,
  cfnExecutePost,
  cfnExecutePostData,
  cfnGenSocialRandomKey,
  cfnGetRedis,
  cfnInsertRedis,
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

export async function cfnGgAuthenticate(
  token: string,
  tfa_code: string,
  user_agent: string,
): Promise<TAuthTokens | TRequiredTFA> {
  return await pipe(
    TE_of(cfnCheckEnableSocialAuth()),
    () => handleTokenInRedis(token),
    TE_chain((idToken) => cfnVerifyGGIdToken(idToken)),
    TE_chain(({ email, googleId }) =>
      !email || !googleId
        ? TE_left(new BadRequestException('User email or id is not found'))
        : cfnUpsertUserWithGG(email, googleId, tfa_code, user_agent),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnHandleGoogleOAuthDialogUrl(
  auth_token: string,
  user_agent: string,
): Promise<string> {
  const randomKey = await pipe(
    cfnGetGoogleAccessToken(auth_token),
    TE_chain((response) =>
      response.access_token
        ? TE_right(response.access_token)
        : TE_left(new BadRequestException('Access token is not found')),
    ),
    TE_chain((accessToken) => cfnGetGoogleUserData(accessToken)),
    TE_chain((response) =>
      !response.email || !response.sub
        ? TE_left(new BadRequestException('User email or sub is not found'))
        : cfnUpsertUserWithGGPkce(
            response.email as string,
            response.sub as string,
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

function cfnGetGoogleAccessToken(
  auth_token: string,
): TE_TaskEither<never, any> {
  const url =
    process.env.GOOGLE_ACCESS_TOKEN_ENDPOINT +
    '?client_id=' +
    process.env.GOOGLE_CLIENT_ID +
    '&redirect_uri=' +
    process.env.GOOGLE_CALLBACK_URL +
    '&client_secret=' +
    process.env.GOOGLE_CLIENT_SECRET +
    '&code=' +
    auth_token +
    '&grant_type=authorization_code';

  return TE_tryCatch(
    () => cfnExecutePost(url),
    (err) => {
      throw err;
    },
  );
}

function cfnUpsertUserWithGGPkce(
  email: string,
  google_id: string,
  user_agent: string,
): TE_TaskEither<never, TAuthTokens & { tfaSecret: string }> {
  return pipe(
    cfnTEFindOneUser({ email }),
    TE_chain((user) => {
      if (!user) {
        return cfnTECreateUser({ email, googleId: google_id });
      }
      if (!user.facebookId) {
        return cfnTEUpdateUser({ email }, { googleId: google_id });
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

function cfnGetGoogleUserData(access_token: string): TE_TaskEither<never, any> {
  const url = `https://www.googleapis.com/oauth2/v3/userinfo?alt=json&access_token=${access_token}`;

  return TE_tryCatch(
    () => cfnExecutePost(url),
    (err) => {
      throw err;
    },
  );
}

function cfnCheckEnableSocialAuth(): void {
  const is_enable = process.env.ENABLE_FACEBOOK_AUTHEN === 'true';

  if (!is_enable) throw new ForbiddenException('Google auth is disabled');
}

function handleTokenInRedis(token: string): TE_TaskEither<never, any> {
  return pipe(
    TE_fromTask(() => cfnCheckExistRedis(token)),
    TE_chain((exist_token) =>
      exist_token !== 1 ? cfnTest(token) : cfnTest1(token),
    ),
  );
}

function cfnTest(auth_code: string): TE_TaskEither<never, any> {
  const url = 'https://oauth2.googleapis.com/token';
  const data = {
    grant_type: 'authorization_code',
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    code: auth_code,
    redirectUri: 'postmessage',
  };

  return pipe(
    TE_tryCatch(
      () => cfnExecutePostData(url, data),
      (err) => {
        throw err;
      },
    ),
    TE_chain((token) =>
      pipe(
        TE_fromTask(() => cfnInsertRedis(token, token.id_token, 3600)),
        TE_map(() => token.id_token),
      ),
    ),
  );
}

function cfnTest1(token: string): TE_TaskEither<never, string> {
  return pipe(
    TE_tryCatch(
      () => cfnGetRedis(token),
      (err) => {
        throw err;
      },
    ),
  );
}

function cfnVerifyGGIdToken(
  id_token: string,
): TE_TaskEither<never, TUserSocialId> {
  const url = 'https://oauth2.googleapis.com/tokeninfo';

  return pipe(
    TE_tryCatch(
      () => cfnExecutePostData(url, { id_token }),
      (err) => {
        throw err;
      },
    ),
    TE_map((data) => ({ email: data.email, googleId: data.sub })),
  );
}

function cfnUpsertUserWithGG(
  email: string,
  google_id: string,
  user_agent: string,
  tfa_code?: string,
): TE_TaskEither<never, TAuthTokens | TRequiredTFA> {
  return pipe(
    cfnTEFindOneUser({ email }),
    TE_chain((user: UserModel) =>
      !user
        ? cfnInsertUserAndGenTokens(email, google_id, user_agent)
        : cfnUpdateUserAndGenTokens(user, google_id, user_agent, tfa_code),
    ),
  );
}

function cfnInsertUserAndGenTokens(
  email: string,
  google_id: string,
  user_agent: string,
): TE_TaskEither<never, TAuthTokens> {
  return pipe(
    cfnTECreateUser({ email: email, googleId: google_id }),
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
  google_id: string,
  user_agent: string,
  tfa_code: string,
): TE_TaskEither<never, TRequiredTFA | TAuthTokens> {
  return pipe(
    google_id
      ? cfnTEUpdateUser({ email: user.email }, { googleId: google_id })
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
