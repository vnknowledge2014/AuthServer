import { authenticator } from 'otplib';
import { TTfaSecret } from './type';

export const pfnGenerateSecret = (email: string): TTfaSecret => {
  const secret = authenticator.generateSecret();
  const app_name = process.env.TFA_APP_NAME || '';
  const uri = authenticator.keyuri(email, app_name, secret);
  return {
    uri,
    secret,
  };
};

export const pfnVerifyCode = (code: string, secret: string) => {
  return authenticator.verify({
    token: code,
    secret,
  });
};
