export function pfnGetGithubOAuthDialogUrl(): string {
  const url = `https://github.com/login/oauth/authorize?client_id=${
    process.env.GITHUB_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.GITHUB_CALLBACK_URL,
  )}&scope=user`;

  return url;
}
