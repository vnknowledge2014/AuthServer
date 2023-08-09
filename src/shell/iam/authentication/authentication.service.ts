import {
  TSignInSchema,
  TSignUpSchema,
  TResetPassSchema,
  TSignInRecoverySchema,
} from '../../../core/iam/authentication/schemas';
import {
  tryCatch as TE_tryCatch,
  chain as TE_chain,
  fromTask as TE_fromTask,
  match as TE_match,
  of as TE_of,
  TaskEither as TE_TaskEither,
  map as TE_map,
  left as TE_left,
  right as TE_right,
} from 'fp-ts/TaskEither';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { pipe } from 'fp-ts/lib/function';
import { genSalt } from 'bcrypt';
import {
  cfnCheckRefreshToken,
  cfnDeleteRedis,
  cfnExecutePost,
  cfnGetMgetRedis,
  cfnGetRedis,
  cfnInsertRedis,
  cfnSearchRedis,
  ERedisPrefix,
  pfnCompare,
  pfnDecrypt,
  pfnEncrypt,
  pfnHash,
} from 'src/shared';
import {
  cfnFindOneUser,
  cfnFindUniqueUser,
  cfnTECreateUser,
  cfnTEGetUserApiKey,
  cfnUpdateUser,
  cfnTECreateUserApiKey,
  cfnTEDeleteUserApiKeys,
  cfnTEGetUserApiKeys,
} from 'src/repositories';
import { Prisma, TfaStatusEnum, user as UserModel } from '@prisma/client';
import {
  pfnGenerateSecret,
  pfnVerifyCode,
  TAuthTokens,
  TRequiredTFA,
} from 'src/core';
import { randomUUID } from 'crypto';
import nanoid from 'nanoid';
import { JwtService } from '@nestjs/jwt';
import { jwt_configuration } from '../config/jwt.config';
import { IActiveUserData } from 'src/shell/interfaces';
import { toDataURL } from 'qrcode';

const jwtService = new JwtService();

export async function cfnSignUp(sign_up_schema: TSignUpSchema) {
  const { email, password } = sign_up_schema;
  const salt = await genSalt();

  return await pipe(
    cfnCheckDuplicateUser(email),
    TE_chain(() => TE_fromTask(() => pfnHash(password, salt))),
    TE_chain((hashed_assword) =>
      cfnTECreateUser({ email, password: hashed_assword }),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      () => null,
    ),
  )();
}

export async function cfnSignIn(
  sign_in_schema: TSignInSchema,
  user_agent: string,
) {
  const { email, password } = sign_in_schema;
  const remember_me = sign_in_schema.rememberMe;
  const tfa_code = sign_in_schema.tfaCode;
  const recaptcha_token = sign_in_schema.recaptchaToken;

  return await pipe(
    cfnVerifyRecaptcha(recaptcha_token),
    TE_chain(() => cfnCheckExistUser({ email })),
    TE_chain((user) =>
      user
        ? TE_right(user)
        : TE_left(new NotFoundException('User is not found')),
    ),
    TE_chain((user) => {
      return TE_tryCatch(
        async () => {
          await pfnComparePassword(password, user.password);

          return user;
        },
        (err) => {
          throw err;
        },
      );
    }),
    TE_chain((user) => cfnVerifyTfaCode(user, tfa_code)),
    TE_chain(
      (result): TE_TaskEither<never, TRequiredTFA | TAuthTokens> =>
        'requireTfa' in result
          ? TE_of({ requireTfa: true })
          : cfnReturnTokens(result, user_agent, remember_me),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnRefreshTokens(
  refresh_token: string,
  session_id?: string,
  user_agent?: string,
) {
  return await pipe(
    verifyRefreshToken(refresh_token),
    TE_chain((result) =>
      pipe(
        cfnCheckExistUser({ id: result.sub }),
        TE_map((user) => ({
          refresh_token_id: result.refreshTokenId,
          user,
        })),
      ),
    ),
    TE_chain(({ user, refresh_token_id }) =>
      pipe(
        cfnValidateRefreshToken(user.id, refresh_token_id, session_id),
        TE_map(() => user),
      ),
    ),
    TE_chain((user) => cfnCacheAuthTokens(user, user_agent, session_id)),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => {
        return {
          accessToken: val.accessToken,
          refreshToken: val.refreshToken,
          sessionId: val.session_id,
        };
      },
    ),
  )();
}

export async function cfnChangePassword(email: string, password: string) {
  const salt = await genSalt();

  await pipe(
    TE_fromTask(() => pfnHash(password, salt)),
    TE_chain((hashed_password) =>
      TE_tryCatch(
        () => cfnUpdateUser({ email }, { password: hashed_password }),
        (err) => {
          throw err;
        },
      ),
    ),
  )();
}

export async function cfnForgotPassword(email: string) {
  const change_pass_token = randomUUID().split('-').join('');

  return await pipe(
    cfnCheckExistUser({ email }),
    TE_chain(() =>
      TE_fromTask(() =>
        cfnInsertRedis(
          `${ERedisPrefix.FORGOT_PASS}-${change_pass_token}`,
          email,
          +process.env.FORGOT_TOKEN_TTL,
        ),
      ),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      () => `${process.env.FE_FORGOT_PASS_LINK}?token=${change_pass_token}`,
    ),
  )();
}

export async function cfnResetPassword(reset_pass_schema: TResetPassSchema) {
  const { password, token } = reset_pass_schema;
  const salt = await genSalt();

  await pipe(
    TE_tryCatch(
      async () => {
        const redis_value = await cfnGetRedis(
          `${ERedisPrefix.FORGOT_PASS}-${token}`,
        );

        if (!redis_value) {
          throw new BadRequestException('Invalid token');
        }

        return redis_value;
      },
      (err) => {
        throw err;
      },
    ),
    TE_chain((redis_value) => cfnCheckExistUser({ email: redis_value })),
    TE_chain((user) =>
      pipe(
        TE_fromTask(() => pfnHash(password, salt)),
        TE_map((hashed_password) => ({
          hashed_password,
          user,
        })),
      ),
    ),
    TE_chain(({ user, hashed_password }) =>
      TE_tryCatch(
        () =>
          cfnUpdateUser({ email: user.email }, { password: hashed_password }),
        (err) => {
          throw err;
        },
      ),
    ),
    TE_chain(() =>
      TE_fromTask(() => cfnDeleteRedis(`${ERedisPrefix.FORGOT_PASS}-${token}`)),
    ),
  )();
}

export async function cfnGetConfig() {
  const config = {
    enableGoogleAuthen: process.env.ENABLE_GOOGLE_AUTHEN,
    enableGooglePKCEAuthen: process.env.ENABLE_GOOGLE_PKCE_AUTHEN,
    enableFacebookAuthen: process.env.ENABLE_FACEBOOK_AUTHEN,
    enableFacebookPKCEAuthen: process.env.ENABLE_FACEBOOK_PKCE_AUTHEN,
    enableTwitterAuthen: process.env.ENABLE_TWITTER_AUTHEN,
    enableTwitterPKCEAuthen: process.env.ENABLE_TWITTER_PKCE_AUTHEN,
  };

  return pipe(parseBoolean(config));
}

export async function cfnLogOut(access_token: string, session_id: string) {
  await pipe(
    TE_tryCatch(
      async () => jwtService.verifyAsync(access_token, jwt_configuration),
      (err) => {
        throw err;
      },
    ),
    TE_chain((payload) =>
      TE_fromTask(() => cfnDeleteRedis(`user-${payload.sub}-${session_id}`)),
    ),
  )();
}

export async function cfnGenerateQrCode(
  email: string,
  tfa: typeof TfaStatusEnum.enable | typeof TfaStatusEnum.disable,
) {
  return await pipe(
    TE_tryCatch(
      () => cfnUpdateUser({ email }, { tfaStatus: tfa }),
      (err) => {
        throw err;
      },
    ),
    TE_chain(() =>
      tfa == TfaStatusEnum.disable ? TE_of(null) : generateQRCode(email),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnGenerateRecoveryCode(email: string) {
  return pipe(
    cfnGenerateUniqueArray(6),
    (recoveryCodes: string[]) => {
      const encryptedCodes = recoveryCodes.map((recoveryCode) =>
        pfnEncrypt(recoveryCode.toString()),
      );

      return {
        recoveryCodes,
        encryptedCodes,
      };
    },
    ({ recoveryCodes, encryptedCodes }) => {
      TE_tryCatch(
        () =>
          cfnUpdateUser({ email }, { recoveryCode: encryptedCodes.join(';') }),
        (err) => {
          throw err;
        },
      )();

      return recoveryCodes;
    },
  );
}

export async function cfnSignInRecovery(
  sign_in_recovery_schema: TSignInRecoverySchema,
  user_agent: string,
) {
  const { email, password } = sign_in_recovery_schema;
  const recovery_code = sign_in_recovery_schema.recoveryCode;

  return await pipe(
    cfnCheckExistUser({ email }),
    TE_chain((user) => {
      return TE_tryCatch(
        async () => {
          await pfnComparePassword(password, user.password);

          return user;
        },
        (err) => {
          throw err;
        },
      );
    }),
    TE_chain((user) => {
      const encrypted_recovery_code = pfnEncrypt(recovery_code.toString());
      return TE_of({ encrypted_recovery_code, user });
    }),
    TE_chain(({ user, encrypted_recovery_code }) =>
      pipe(
        cfnHandleRecoveryCode(user, encrypted_recovery_code),
        TE_map((newRecoveryCode) => ({ user, newRecoveryCode })),
      ),
    ),
    TE_chain(({ user, newRecoveryCode }) =>
      pipe(
        TE_tryCatch(
          () =>
            cfnUpdateUser(
              { email: user.email },
              { recoveryCode: newRecoveryCode },
            ),
          (err) => {
            throw err;
          },
        ),
        TE_map(() => user),
      ),
    ),
    TE_chain((user) => cfnCacheAuthTokens(user, user_agent)),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => {
        return {
          accessToken: val.accessToken,
          refreshToken: val.refreshToken,
          sessionId: val.session_id,
        };
      },
    ),
  )();
}

export async function cfnGetDevices(user_id: number) {
  return await pipe(
    TE_fromTask(() => cfnSearchRedis(`user-${user_id}-`)),
    TE_chain((keys) => TE_fromTask(() => cfnGetMgetRedis(keys))),
    TE_chain((values) =>
      TE_of(
        values.map((value) => {
          const user_agent = value.split(';').slice(2).join('');
          return user_agent;
        }),
      ),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnGetPkceCredentials(
  code: string,
  tfa_code?: string,
  user_agent?: string,
) {
  return await pipe(
    TE_tryCatch(
      async () => {
        const redis_value = await cfnGetRedis(
          `${ERedisPrefix.USER_CREDENTIALS}-${code}`,
        );

        if (!redis_value) {
          throw new BadRequestException('Invalid token');
        }

        return redis_value;
      },
      (err) => {
        throw err;
      },
    ),
    TE_chain((redis_value) => {
      const decrypted_data = pfnDecrypt(redis_value);
      const split_string = decrypted_data.split(';');
      return TE_of({
        refresh_token: split_string[0],
        tfa_secret: split_string[1],
        session_id: split_string[2],
      });
    }),
    TE_chain(({ refresh_token, tfa_secret, session_id }) =>
      pipe(
        cfnVerifyPkceTfaCode(tfa_secret, tfa_code),
        TE_map((required_tfa) => ({ required_tfa, refresh_token, session_id })),
      ),
    ),
    TE_chain(
      (result): TE_TaskEither<never, TRequiredTFA | TAuthTokens> =>
        result.required_tfa
          ? TE_of({ requireTfa: true })
          : cfnPkceRefreshTokens(
              result.refresh_token,
              result.session_id,
              user_agent,
            ),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnVerifyTfa(email: string, tfa_code: string) {
  return await pipe(
    cfnCheckExistUser({ email }),
    TE_chain((user) => cfnVerifyTfaCode(user, tfa_code)),
    TE_match(
      (err) => {
        throw err;
      },
      () => true,
    ),
  )();
}

export async function cfnGetSession(apiKey: string, user_agent: string) {
  return await pipe(
    cfnTEGetUserApiKey({ key: apiKey }),
    TE_chain((user_api_key) =>
      !user_api_key || !user_api_key.user
        ? TE_left(new NotFoundException('Api key not found'))
        : TE_right(user_api_key.user),
    ),
    TE_chain((user) => cfnReturnTokens(user, user_agent, false)),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val.sessionId,
    ),
  )();
}

export async function cfnCreateApiKey(email: string) {
  const api_key = nanoid.nanoid(128);

  return await pipe(
    cfnCheckExistUser({ email }),
    TE_chain((user) =>
      cfnTECreateUserApiKey({
        key: api_key,
        user: { connect: { id: user.id } },
      }),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnGetApiKeys(userId: number) {
  return await pipe(
    cfnTEGetUserApiKeys({ userId }, { id: true, key: true }),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnRevokeApiKey(userId: number, apiKeys: string[]) {
  return await pipe(
    cfnTEDeleteUserApiKeys({ userId, key: { in: apiKeys } }),
    TE_match(
      (err) => {
        throw err;
      },
      () => true,
    ),
  )();
}

function cfnPkceRefreshTokens(
  refresh_token: string,
  session_id: string,
  user_agent: string,
): TE_TaskEither<never, TAuthTokens> {
  return TE_tryCatch(
    () => cfnRefreshTokens(refresh_token, session_id, user_agent),
    (err) => {
      throw err;
    },
  );
}

function cfnCheckDuplicateUser(email: string): TE_TaskEither<never, void> {
  return TE_tryCatch(
    async () => {
      const exist_user = await cfnFindUniqueUser({ email });

      if (exist_user) {
        throw new ConflictException('Email already in use');
      }
    },
    (err) => {
      throw err;
    },
  );
}

function cfnVerifyRecaptcha(recaptcha_token: string) {
  const url =
    'https://www.google.com/recaptcha/api/siteverify?secret=' +
    process.env.RECAPTCHA_SECRET +
    '&response=' +
    recaptcha_token;

  return TE_tryCatch(
    async () => {
      if (recaptcha_token) {
        const data = await cfnExecutePost(url);

        if (!data.success || data.score < 0.5) {
          throw new BadRequestException('Invalid recaptcha token');
        }
      }
    },
    (err) => {
      throw err;
    },
  );
}

function cfnCheckExistUser(conditions: Prisma.userWhereInput) {
  return TE_tryCatch(
    async () => {
      const user = await cfnFindOneUser(conditions);

      if (!user) {
        throw new NotFoundException('User is not found');
      }

      return user;
    },
    (err) => {
      throw err;
    },
  );
}

async function pfnComparePassword(password: string, hashed_password: string) {
  const is_equal = await pfnCompare(password, hashed_password);

  if (!is_equal) {
    throw new BadRequestException('Incorrect password');
  }
}

function cfnGenAuthTokens(user: UserModel, refresh_token_id: string) {
  return TE_fromTask(async () => {
    const [accessToken, refreshToken] = await Promise.all([
      cfnSignToken(user.id, 3600, {
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isFirstLogin: user.tfaStatus == TfaStatusEnum.init ? true : false,
      }),
      cfnSignToken(user.id, 86400, { refreshTokenId: refresh_token_id }),
    ]);

    return { accessToken, refreshToken };
  });
}

function verifyRefreshToken(refresh_token: string) {
  return TE_fromTask(async () => {
    const { sub, refreshTokenId } = await jwtService.verifyAsync<
      Pick<IActiveUserData, 'sub'> & { refreshTokenId: string }
    >(refresh_token, jwt_configuration);

    return {
      sub,
      refreshTokenId,
    };
  });
}

function cfnValidateRefreshToken(
  user_id: number,
  refresh_token_id: string,
  session_id: string,
) {
  const key = `user-${user_id}-${session_id}`;

  return TE_tryCatch(
    async () => {
      await cfnCheckRefreshToken(key, refresh_token_id);

      await cfnDeleteRedis(key);
    },
    (err) => {
      throw err;
    },
  );
}

function parseBoolean(
  config: Record<string, string | boolean>,
): Record<string, string | boolean> {
  for (const key in config) {
    if (config[key] === 'true') config[key] = true;
    else if (config[key] === 'false') config[key] = false;
  }

  return config;
}

function generateQRCode(email: string) {
  return pipe(
    TE_of(pfnGenerateSecret(email)),
    TE_chain(({ uri, secret }) =>
      pipe(
        TE_tryCatch(
          () =>
            cfnUpdateUser(
              { email },
              { tfaSecret: secret, tfaStatus: TfaStatusEnum.enable },
            ),
          (err) => {
            throw err;
          },
        ),
        TE_map(() => ({ uri, secret })),
      ),
    ),
    TE_chain(({ uri, secret }) =>
      pipe(
        genBase64Image(uri),
        TE_map((base64) => ({ base64, secret })),
      ),
    ),
  );
}

function genBase64Image(uri: string): TE_TaskEither<Error, string> {
  return TE_tryCatch(
    () =>
      new Promise((resolve, reject) => {
        toDataURL(uri, function (err, code) {
          if (err) {
            reject(reject);
            return;
          }
          resolve(code);
        });
      }),
    () => {
      throw new BadRequestException('Crate Base64 error');
    },
  );
}

function cfnGenerateUniqueArray(size: number): string[] {
  const set = new Set<string>();

  while (set.size < size) {
    const randomNumber = Math.floor(Math.random() * 900000 + 100000);
    set.add(randomNumber.toString());
  }

  return Array.from(set);
}

function cfnHandleRecoveryCode(
  user: UserModel,
  encrypted_recovery_code: string,
) {
  const user_recovery_code = user.recoveryCode;

  return TE_tryCatch(
    async () => {
      if (!user_recovery_code || user_recovery_code.length === 0) {
        throw new BadRequestException('User does not enable recovery code');
      }

      const recovery_code_arr = user_recovery_code.split(';');

      const index = recovery_code_arr.indexOf(encrypted_recovery_code);

      if (index === -1) {
        throw new BadRequestException('Incorrect recovery code');
      }

      recovery_code_arr.splice(index, 1);

      return recovery_code_arr.join(';');
    },
    (err) => {
      throw err;
    },
  );
}

function cfnVerifyPkceTfaCode(
  // refresh_token: string,
  tfa_secret: string,
  tfa_code: string,
  // session_id: string,
) {
  return TE_tryCatch(
    async () => {
      if (tfa_secret != 'null') {
        if (!tfa_code) return { requireTfa: true };

        const is_valid = pfnVerifyCode(tfa_code, tfa_secret);

        if (!is_valid) {
          throw new BadRequestException('Invalid TFA code');
        }
      }

      return;

      // return { refresh_token, session_id };
    },
    (err) => {
      throw err;
    },
  );
}

async function cfnSignToken<T>(
  user_id: number,
  expires_in: number,
  payload?: T,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessTokenTtl, refreshTokenTtl, ...jwtSignConfiguration } =
    jwt_configuration;

  return await jwtService.signAsync(
    {
      sub: user_id,
      ...payload,
    },
    {
      ...jwtSignConfiguration,
      expiresIn: expires_in,
    },
  );
}

export function cfnCacheAuthTokens(
  user: UserModel,
  user_agent: string,
  session_id?: string,
) {
  const refresh_token_id = randomUUID();
  const session = session_id || nanoid.nanoid();

  return pipe(
    cfnGenAuthTokens(user, refresh_token_id),
    TE_chain((result) => {
      const redis_value =
        user_agent && user_agent.length
          ? `${refresh_token_id};${result.accessToken};${user_agent}`
          : `${refresh_token_id};${result.accessToken}`;

      return TE_of({ ...result, redis_value });
    }),
    TE_chain((result) => {
      cfnInsertRedis(
        `user-${user.id}-${session}`,
        result.redis_value,
        +process.env.JWT_ACCESS_TOKEN_TTL,
      );
      return TE_of({
        ...result,
        session_id: session,
      });
    }),
  );
}

export function cfnVerifyTfaCode(
  user: UserModel,
  tfa_code: string,
): TE_TaskEither<never, UserModel | TRequiredTFA> {
  return TE_tryCatch(
    async () => {
      if (user.tfaStatus == TfaStatusEnum.enable) {
        if (!tfa_code) return { requireTfa: true };

        const is_valid = pfnVerifyCode(tfa_code, user.tfaSecret);

        if (!is_valid) {
          throw new BadRequestException('Invalid TFA code');
        }
      }

      return user;
    },
    (err) => {
      throw err;
    },
  );
}

export function cfnReturnTokens(
  user: UserModel,
  userAgent: string,
  rememberMe: boolean,
): TE_TaskEither<never, TAuthTokens> {
  return pipe(
    cfnCacheAuthTokens(user, userAgent),
    TE_chain((result) =>
      rememberMe
        ? TE_of({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            sessionId: result.session_id,
          })
        : TE_of({
            accessToken: result.accessToken,
            sessionId: result.session_id,
          }),
    ),
  );
}
