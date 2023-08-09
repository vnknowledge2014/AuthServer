import { compare, hash } from 'bcrypt';
import crypto from 'crypto';

export async function pfnHash(
  data: string | Buffer,
  salt: string,
): Promise<string> {
  return await hash(data, salt);
}

export async function pfnCompare(
  data: string | Buffer,
  encrypted: string,
): Promise<boolean> {
  return await compare(data, encrypted);
}

export function pfnEncrypt(text: string): string {
  const cipher = crypto.createCipheriv(
    process.env.ALGORITHM,
    process.env.ENCRYPT_KEY,
    Buffer.from(process.env.ENCRYPT_SALT, 'hex'),
  );

  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return encrypted.toString('hex');
}

export function pfnDecrypt(text: string): string {
  const iv = Buffer.from(process.env.ENCRYPT_SALT, 'hex');

  const encryptedText = Buffer.from(text, 'hex');

  const decipher = crypto.createDecipheriv(
    process.env.ALGORITHM,
    Buffer.from(process.env.ENCRYPT_KEY),
    iv,
  );

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}
