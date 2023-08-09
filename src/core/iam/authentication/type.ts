export type TRequiredTFA = { requireTfa: boolean };

export type TAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  sessionId: string;
};

export type TUserSocialId = {
  email: string;
  googleId?: string;
  facebookId?: string;
  githubId?: string;
};

export type TUserId = {
  id?: number;
};

export type TTfaSecret = {
  uri: string;
  secret: string;
};
