import { sign, verify } from 'hono/jwt';
import type { AuthUser } from '../types';
import { isRole } from '../../../src/types';
import { verifyFirebaseScrypt } from './firebaseScrypt';
import { timingSafeEqual } from './timingSafeEqual';

export const LEGACY_PREFIX = 'fbscrypt:';

export interface LegacyHashConfig {
  FIREBASE_SCRYPT_SIGNER_KEY?: string;
  FIREBASE_SCRYPT_SALT_SEPARATOR?: string;
}

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function derivePbkdf2(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

/** Hashes a plaintext password using WebCrypto PBKDF2-SHA256 (`saltHex:hashHex`). */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return `${bytesToHex(salt)}:${await derivePbkdf2(password, salt)}`;
}

/** Verifies a plaintext password against a stored `saltHex:hashHex` string. */
export async function verifyPassword(
  password: string,
  storedHash: string,
  legacy: LegacyHashConfig = {},
): Promise<boolean> {
  if (storedHash.startsWith(LEGACY_PREFIX)) {
    const [, salt, hash] = storedHash.split(':');
    const { FIREBASE_SCRYPT_SIGNER_KEY: key, FIREBASE_SCRYPT_SALT_SEPARATOR: sep } = legacy;
    if (!salt || !hash || !key || sep === undefined) return false;
    return verifyFirebaseScrypt(password, salt, hash, key, sep);
  }
  const [saltHex, expectedHashHex] = storedHash.split(':');
  if (!saltHex || !expectedHashHex) return false;
  return timingSafeEqual(await derivePbkdf2(password, hexToBytes(saltHex)), expectedHashHex);
}

/** Signs a 30-day JWT for an authenticated GymTrack user. */
export async function signAuthToken(user: AuthUser, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: user.uid,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + 60 * 60 * 24 * 30,
    },
    secret,
    'HS256',
  );
}

/** Verifies a Bearer JWT and extracts the `AuthUser` payload. */
export async function verifyAuthToken(token: string, secret: string): Promise<AuthUser | null> {
  try {
    const payload = await verify(token, secret, 'HS256');
    const uid = typeof payload.sub === 'string' ? payload.sub : '';
    const email = typeof payload.email === 'string' ? payload.email : '';
    const role = payload.role;
    if (!uid || !isRole(role)) return null;
    return { uid, email, role };
  } catch {
    return null;
  }
}
