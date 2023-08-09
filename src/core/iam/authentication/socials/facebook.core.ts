export function pfnGetFacebookOAuthDialogUrl(): string {
  const url = `${process.env.FACEBOOK_AUTH_TOKEN_ENDPOINT}?client_id=${
    process.env.FACEBOOK_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.FACEBOOK_CALLBACK_URL,
  )}&scope=email`;

  return url;
}
