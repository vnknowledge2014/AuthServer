import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  tryCatch as TE_tryCatch,
  TaskEither as TE_TaskEither,
  chain as TE_chain,
  of as TE_of,
  match as TE_match,
  left as TE_left,
  right as TE_right,
  map as TE_map,
} from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import {
  pfnMicrosoftAuthenConfig,
  pfnStringifyBody,
  TAuthTokens,
} from 'src/core';
import { cfnGenSocialRandomKey, cfnPostRequest } from 'src/shared';
import {
  cfnTECreateUser,
  cfnTEFindOneUser,
  cfnTEUpdateUser,
} from 'src/repositories';
import { cfnCacheAuthTokens } from '../authentication.service';

function cfnGetMicrosoftAccessToken(
  auth_code: string,
): TE_TaskEither<never, any> {
  const cfg = pfnMicrosoftAuthenConfig();

  const data = pfnStringifyBody({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    code: `${auth_code}`,
    redirect_uri: cfg.callbackUrl,
    grant_type: 'authorization_code',
  });

  const url = `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  return TE_tryCatch(
    () => cfnPostRequest(url, data, { headers }),
    (err) => {
      throw err;
    },
  );
}

const cfnGetMicrosoftUserInfo = (
  access_token: string,
): TE_TaskEither<never, any> => {
  const url = `https://graph.microsoft.com/v1.0/me`;

  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  return pipe(
    TE_tryCatch(
      () => cfnPostRequest(url, { headers }),
      (err) => {
        throw err;
      },
    ),
    TE_chain((response) =>
      response.id
        ? TE_right({
            id: response.id,
            email: (
              new JwtService().decode(access_token) as {
                email: string;
              }
            ).email,
          })
        : undefined,
    ),
  );
};

function cfnUpsertUserWithMicrosoftPkce(
  email: string,
  microsoft_id: string,
  user_agent: string,
): TE_TaskEither<never, TAuthTokens & { tfaSecret: string }> {
  return pipe(
    cfnTEFindOneUser({ email }),
    TE_chain((user) => {
      if (!user) {
        return cfnTECreateUser({ email, microsoftId: microsoft_id });
      }

      if (!user.microsoftId) {
        return cfnTEUpdateUser({ email }, { microsoftId: microsoft_id });
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

export async function cfnHandleMicrosoftCallback(
  auth_token: string,
  user_agent: string,
): Promise<string> {
  const randomKey = await pipe(
    cfnGetMicrosoftAccessToken(auth_token),
    TE_chain((response) =>
      response.access_token
        ? TE_right(response.access_token)
        : TE_left(new BadRequestException('Access token is not found')),
    ),
    TE_chain((accessToken) => cfnGetMicrosoftUserInfo(accessToken)),
    TE_chain((response) =>
      !response.email || !response.id
        ? TE_left(new BadRequestException('User email or sub is not found'))
        : cfnUpsertUserWithMicrosoftPkce(
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
