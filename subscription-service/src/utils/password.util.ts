import * as crypto from 'crypto';

const SALT_LENGTH = 16;
const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = await pbkdf2Async(plain, salt);
  return `${salt}:${derivedKey}`;
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  const [salt, storedKey] = hash.split(':');
  if (!salt || !storedKey) {
    return false;
  }
  const derivedKey = await pbkdf2Async(plain, salt);
  return crypto.timingSafeEqual(Buffer.from(storedKey, 'hex'), Buffer.from(derivedKey, 'hex'));
}

function pbkdf2Async(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      DIGEST,
      (err, derivedKey) => {
        if (err) {
          return reject(err);
        }
        resolve(derivedKey.toString('hex'));
      },
    );
  });
}

