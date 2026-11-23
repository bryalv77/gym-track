import type { Context, Next } from 'hono';
import type { AppEnv } from '../types';
import type { Role } from '../../../src/types';
import { verifyAuthToken } from '../utils/crypto';
import { getSql } from '../db/client';

/**
 * Verifies the `Authorization: Bearer <token>` header and loads the latest user
 * role from the database (so admin role promotions/demotions take effect immediately,
 * matching Firebase RTDB `root.child('users').child(auth.uid).child('role')`).
 */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', code: 'auth/unauthorized' }, 401);
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const secret = c.env.JWT_SECRET;
  const verified = await verifyAuthToken(token, secret);
  if (!verified) {
    return c.json({ error: 'Invalid or expired token', code: 'auth/invalid-credential' }, 401);
  }

  const sql = getSql(c.env);
  const rows = await sql`SELECT uid, email, role FROM users WHERE uid = ${verified.uid} LIMIT 1`;
  if (rows.length === 0) {
    return c.json({ error: 'Invalid or expired token', code: 'auth/invalid-credential' }, 401);
  }
  c.set('user', {
    uid: String(rows[0].uid),
    email: String(rows[0].email ?? verified.email),
    role: rows[0].role as Role,
  });

  await next();
}

/** Restricts a route to users holding one of the allowed roles. */
export function requireRole(...allowedRoles: Role[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user');
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ error: 'Forbidden', code: 'auth/forbidden' }, 403);
    }
    await next();
  };
}

/** Allows access if the authenticated user matches `:paramName` OR holds one of `allowedRoles`. */
export function requireSelfOrRole(paramName: string, ...allowedRoles: Role[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user');
    const targetUid = c.req.param(paramName);
    if (!user) {
      return c.json({ error: 'Unauthorized', code: 'auth/unauthorized' }, 401);
    }
    if (user.uid !== targetUid && !allowedRoles.includes(user.role)) {
      return c.json({ error: 'Forbidden', code: 'auth/forbidden' }, 403);
    }
    await next();
  };
}
