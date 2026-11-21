// Minimal typings for the one node:crypto function the Worker uses (nodejs_compat).
declare module 'node:crypto' {
  export function scrypt(
    password: Uint8Array,
    salt: Uint8Array,
    keylen: number,
    options: { N: number; r: number; p: number; maxmem: number },
    callback: (error: Error | null, derivedKey: Uint8Array) => void,
  ): void;
}
