export const pfnMicrosoftAuthenConfig = () => {
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    scope: encodeURIComponent(process.env.MICROSOFT_SCOPE),
    callbackUrl: encodeURIComponent(process.env.MICROSOFT_CALLBACK_URL),
    tenantId: process.env.MICROSOFT_TENANT_ID,
  };
};

export const pfnStringifyBody = (data: object) => {
  let body_string = '';

  for (const key in data) {
    body_string += `${key}=${data[key]}&`;
  }
  body_string = body_string.slice(0, -1);

  return body_string;
};

export const pfnGetMicrosoftAuthUrl = () => {
  const cfg = pfnMicrosoftAuthenConfig();
  return `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/authorize?scope=${cfg.scope}&response_type=code&client_id=${cfg.clientId}&redirect_uri=${cfg.callbackUrl}`;
};
