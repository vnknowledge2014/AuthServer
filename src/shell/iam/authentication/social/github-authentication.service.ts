import { BadRequestException } from '@nestjs/common';
import { pipe } from 'fp-ts/lib/function';
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
import { TAuthTokens, TUserSocialId } from 'src/core';
import {
  cfnTECreateUser,
  cfnTEFindOneUser,
  cfnTEUpdateUser,
} from 'src/repositories';
import {
  cfnFetchData,
  cfnGenSocialRandomKey,
  cfnPostRequest,
} from 'src/shared';
import { cfnCacheAuthTokens } from '../authentication.service';

export async function cfnHandleGithubOAuthDialogUrl(
  auth_token: string,
  user_agent: string,
): Promise<string> {
  const randomKey = await pipe(
    cfnGetGithubAccessToken(auth_token),
    TE_chain((response) =>
      response.access_token
        ? TE_right(response.access_token)
        : TE_left(new BadRequestException('Access token is not found')),
    ),
    TE_chain((accessToken) => cfnGetGithubUserData(accessToken)),
    TE_chain(([emails, profile]) => cfnHandleGithubData(emails, profile)),
    TE_chain(({ email, githubId }) =>
      cfnUpsertUserWithGithubPkce(email, githubId, user_agent),
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

function cfnGetGithubAccessToken(auth_code: string): TE_TaskEither<never, any> {
  const url = `https://github.com/login/oauth/access_token?client_id=${
    process.env.GITHUB_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.GITHUB_CALLBACK_URL,
  )}&client_secret=${encodeURIComponent(
    process.env.GITHUB_SECRET_KEY,
  )}&code=${auth_code}`;

  return TE_tryCatch(
    () => cfnPostRequest(url),
    (err) => {
      throw err;
    },
  );
}

function cfnGetGithubUserData(
  access_token: string,
): TE_TaskEither<never, [any, any]> {
  const url_emails = 'https://api.github.com/user/emails';
  const url_profile = 'https://api.github.com/user';
  const config = {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json',
    },
  };

  return TE_tryCatch(
    () =>
      Promise.all([
        cfnFetchData(url_emails, config),
        cfnFetchData(url_profile, config),
      ]),
    (err) => {
      throw err;
    },
  );
}

function cfnHandleGithubData(
  emails: any[],
  profile: any,
): TE_TaskEither<never, TUserSocialId> {
  return TE_tryCatch(
    async () => {
      const primary_email = emails.find(
        (email) => email.primary === true,
      )?.email;

      if (!primary_email || !profile.id) {
        throw new BadRequestException('User email or id is not found');
      }

      return { email: primary_email, githubId: profile.id.toString() };
    },
    (err) => {
      throw err;
    },
  );
}

function cfnUpsertUserWithGithubPkce(
  email: string,
  github_id: string,
  user_agent: string,
): TE_TaskEither<never, TAuthTokens & { tfaSecret: string }> {
  return pipe(
    cfnTEFindOneUser({ email }),
    TE_chain((user) => {
      if (!user) {
        return cfnTECreateUser({ email, githubId: github_id });
      }

      if (!user.githubId) {
        return cfnTEUpdateUser({ email }, { githubId: github_id });
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
