import { pipe } from 'fp-ts/lib/function';

function pfnParseBoolean(
  config: Record<string, string | boolean>,
): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};

  for (const key in config) {
    if (config[key] === 'true') result[key] = true;
    else if (config[key] === 'false') result[key] = false;
  }

  return result;
}

export function pfnGetConfig(): Record<string, string | boolean> {
  const config = {
    enableGoogleAuthen: process.env.ENABLE_GOOGLE_AUTHEN,
    enableGooglePKCEAuthen: process.env.ENABLE_GOOGLE_PKCE_AUTHEN,
    enableFacebookAuthen: process.env.ENABLE_FACEBOOK_AUTHEN,
    enableFacebookPKCEAuthen: process.env.ENABLE_FACEBOOK_PKCE_AUTHEN,
    enableTwitterAuthen: process.env.ENABLE_TWITTER_AUTHEN,
    enableTwitterPKCEAuthen: process.env.ENABLE_TWITTER_PKCE_AUTHEN,
  };

  return pipe(pfnParseBoolean(config));
}
