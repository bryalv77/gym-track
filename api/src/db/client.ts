import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { EnvBindings } from '../types';

export type SqlClient = NeonQueryFunction<false, false>;

/**
 * Returns a stateless Neon HTTP query client bound to the Worker's DATABASE_URL.
 * Ideal for Cloudflare Workers edge execution with zero TCP handshake overhead.
 */
export function getSql(env: EnvBindings): SqlClient {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL binding is not configured');
  }
  return neon(env.DATABASE_URL);
}

/** Generates a URL-safe unique ID similar to Firebase push keys. */
export function generateId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let id = '';
  for (let i = 0; i < bytes.length; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return `${Date.now().toString(36)}_${id}`;
}
