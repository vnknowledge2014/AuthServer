import NodeVault from 'node-vault';
import dotenv from 'dotenv';
import Z from 'zod';
import { pipe } from 'fp-ts/lib/function';
import {
  tryCatch as TE_tryCatch,
  chain as TE_chain,
  right as TE_right,
} from 'fp-ts/lib/TaskEither';

dotenv.config();

const validate_string = Z.string().refine(
  (value) => value !== null && value !== undefined && value.length > 0,
);

function pfnParseBoolean(config: string): boolean {
  const boolean_obj = { true: true, false: false };

  return boolean_obj[config];
}

function pfnValidateNumber(
  number_config: Z.ZodNumber | Z.ZodDefault<Z.ZodNumber>,
) {
  return Z.preprocess((str: string) => +str, number_config);
}

function pfnValidateBoolean(
  boolean_config: Z.ZodBoolean | Z.ZodDefault<Z.ZodBoolean>,
) {
  return Z.preprocess((str: string) => pfnParseBoolean(str), boolean_config);
}

const env_schema = Z.object({
  // 2FA
  TFA_APP_NAME: validate_string,

  // DB configuration
  // DB_HOST: validate_string,
  // DB_NAME: validate_string,
  // DB_USER: validate_string,
  // DB_PASSWORD: validate_string,
  // DB_PORT: pfnValidateNumber(Z.number().min(1).max(65535).default(3000)),

  // Cache configuration
  REDIS_HOST: validate_string,
  REDIS_PORT: pfnValidateNumber(Z.number().min(1).max(65535).default(6379)),

  // App configuration
  APP_EXPOSE_PORT: pfnValidateNumber(
    Z.number().min(1).max(65535).default(3088),
  ),

  // JWT
  JWT_SECRET: validate_string,
  JWT_TOKEN_AUDIENCE: validate_string,
  JWT_TOKEN_ISSUER: validate_string,
  JWT_ACCESS_TOKEN_TTL: pfnValidateNumber(Z.number().default(3600)),
  JWT_REFRESH_TOKEN_TTL: pfnValidateNumber(Z.number().default(86400)),

  // FE Links
  FE_SOCIAL_LOGIN_REDIRECT: validate_string,
  FE_FORGOT_PASS_LINK: validate_string,

  // Social Login
  CREDENTIALS_CODE_TTL: pfnValidateNumber(Z.number().default(360)),

  // Google
  GOOGLE_CLIENT_ID: validate_string,
  GOOGLE_CLIENT_SECRET: validate_string,

  // Google Oauth2 configuration
  GOOGLE_AUTH_TOKEN_ENDPOINT: validate_string,
  GOOGLE_ACCESS_TOKEN_ENDPOINT: validate_string,
  GOOGLE_CALLBACK_URL: validate_string,
  GOOGLE_SCOPE: validate_string,

  // Facebook
  FACEBOOK_CLIENT_ID: validate_string,
  FACEBOOK_CLIENT_SECRET: validate_string,

  // Facebook Oauth2 configuration
  FACEBOOK_AUTH_TOKEN_ENDPOINT: validate_string,
  FACEBOOK_ACCESS_TOKEN_ENDPOINT: validate_string,
  FACEBOOK_CALLBACK_URL: validate_string,
  FACEBOOK_SCOPE: validate_string,

  // TTL for forgot token in seconds
  FORGOT_TOKEN_TTL: pfnValidateNumber(Z.number().default(60)),

  // Encryption settings
  ALGORITHM: validate_string,
  ENCRYPT_SALT: validate_string,
  ENCRYPT_KEY: validate_string,

  // Authen config
  ENABLE_GOOGLE_AUTHEN: pfnValidateBoolean(Z.boolean().default(false)),
  ENABLE_GOOGLE_PKCE_AUTHEN: pfnValidateBoolean(Z.boolean().default(false)),
  ENABLE_FACEBOOK_AUTHEN: pfnValidateBoolean(Z.boolean().default(false)),
  ENABLE_FACEBOOK_PKCE_AUTHEN: pfnValidateBoolean(Z.boolean().default(false)),
  ENABLE_TWITTER_AUTHEN: pfnValidateBoolean(Z.boolean().default(false)),
  ENABLE_TWITTER_PKCE_AUTHEN: pfnValidateBoolean(Z.boolean().default(false)),

  // Recaptcha
  RECAPTCHA_SECRET: validate_string,

  // Github Oauth2 configuration
  GITHUB_CLIENT_ID: validate_string,
  GITHUB_SECRET_KEY: validate_string,
  GITHUB_CALLBACK_URL: validate_string,
});

async function cfnGetEnviroments(): Promise<Record<string, string>> {
  const role_id = process.env.ROLE_ID;
  const secret_id = process.env.SECRET_ID;
  const vault_endpoint = process.env.VALUT_END_POINT;
  const vault_path_secret = process.env.VAULT_PATH_SECRET;
  const unseal_key = process.env.UNSEAL_KEY;

  const vault = NodeVault({ apiVersion: 'v1', endpoint: vault_endpoint });

  await vault.unseal({ key: unseal_key });

  const result = await vault.approleLogin({ role_id, secret_id });

  vault.token = result.auth.client_token;

  const { data } = await vault.read(vault_path_secret);

  return data.data;
}

function cfnParseEnviroments(env_data: any): void {
  env_schema.parse(env_data);

  return env_data;
}

function pfnSetEnviroments(env_data: any) {
  process.env = { ...process.env, ...env_data };
}

export async function cfnSetEnviroments(): Promise<void> {
  await pipe(
    TE_tryCatch(
      () => cfnGetEnviroments(),
      (err: any) => {
        throw new Error(err);
      },
    ),
    TE_chain((result) =>
      TE_tryCatch(
        async () => cfnParseEnviroments(result),
        (err: any) => {
          if (err instanceof Z.ZodError) {
            const error_details = err.errors;

            let error_message = 'Error in environment variables: \n';

            error_details.forEach((error) => {
              error_message += `${error.path}: ${error.message}\n`;
            });

            throw new Error(error_message);
          }
        },
      ),
    ),
    TE_chain((result) => TE_right(pfnSetEnviroments(result))),
  )();
}
