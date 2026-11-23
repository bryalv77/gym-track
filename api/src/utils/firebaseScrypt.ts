import { scrypt } from 'node:crypto';
import { timingSafeEqual } from './timingSafeEqual';

// Firebase Auth's modified scrypt, used only to verify passwords of users
// migrated from Firebase. They are re-hashed with PBKDF2 on first login.
const ROUNDS = 8; // hash_config.rounds (scrypt r)
const MEM_COST = 14; // hash_config.mem_cost (N = 2^14)

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function verifyFirebaseScrypt(
  password: string,
  saltB64: string,
  expectedB64: string,
  signerKeyB64: string,
  saltSeparatorB64: string,
): Promise<boolean> {
  const salt = new Uint8Array([...b64(saltB64), ...b64(saltSeparatorB64)]);
  const N = 2 ** MEM_COST;
  const derived = await new Promise<Uint8Array>((resolve, reject) =>
    scrypt(
      new TextEncoder().encode(password),
      salt,
      64,
      { N, r: ROUNDS, p: 1, maxmem: 256 * N * ROUNDS },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
  const aesKey = await crypto.subtle.importKey('raw', derived.slice(0, 32), 'AES-CTR', false, [
    'encrypt',
  ]);
  const hashed = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-CTR', counter: new Uint8Array(16), length: 64 },
      aesKey,
      b64(signerKeyB64),
    ),
  );
  const actual = btoa(String.fromCharCode(...hashed));
  return timingSafeEqual(actual, expectedB64);
}
