export function pfnGetGoogleOAuthDialogUrl(): string {
  const url =
    process.env.GOOGLE_AUTH_TOKEN_ENDPOINT +
    '?client_id=' +
    process.env.GOOGLE_CLIENT_ID +
    '&redirect_uri=' +
    process.env.GOOGLE_CALLBACK_URL +
    '&response_type=code' +
    '&scope=profile+email+openid';

  return url;
}
