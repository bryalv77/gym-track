import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
} from '../../../src/types/api';
import type { Role } from '../../../src/types';
import { getSql, generateId } from '../db/client';
import { mapUserRow } from '../db/mappers';
import { hashPassword, verifyPassword, signAuthToken, LEGACY_PREFIX } from '../utils/crypto';
import { requireAuth } from '../middleware/auth';

export const authRouter = new Hono<AppEnv>();

authRouter.post('/register', async (c) => {
  const body = await c.req.json<RegisterRequest>();
  if (!body.password || body.password.length < 6) {
    return c.json({ error: 'Weak password', code: 'auth/weak-password' }, 400);
  }
  const email = (body.email ?? '').trim().toLowerCase();
  const name = (body.name ?? '').trim();
  if (!email || !name) {
    return c.json({ error: 'Missing required fields', code: 'auth/invalid-argument' }, 400);
  }
  // Public sign-up can never create an admin; promote users in the database.
  const role: Role = body.role === 'coach' ? 'coach' : 'member';

  const sql = getSql(c.env);
  const existing = await sql`SELECT uid FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    return c.json({ error: 'Email already in use', code: 'auth/email-already-in-use' }, 409);
  }

  if (role === 'coach') {
    if (!body.gymId || !body.coachCode) {
      return c.json({ error: 'Invalid coach code', code: 'auth/invalid-coach-code' }, 403);
    }
    const gymRows = await sql`SELECT coach_code FROM gyms WHERE id = ${body.gymId} LIMIT 1`;
    if (gymRows.length === 0 || String(gymRows[0].coach_code) !== body.coachCode) {
      return c.json({ error: 'Invalid coach code', code: 'auth/invalid-coach-code' }, 403);
    }
  }

  const uid = generateId();
  const passwordHash = await hashPassword(body.password);
  const createdAt = Date.now();
  const gymId = body.gymId ?? null;

  const inserted = await sql`
    INSERT INTO users (uid, name, email, password_hash, role, gym_id, coach_id, photo_data, created_at)
    VALUES (${uid}, ${name}, ${email}, ${passwordHash}, ${role}, ${gymId}, ${null}, ${null}, ${createdAt})
    RETURNING *
  `;

  const profile = mapUserRow(inserted[0]);
  const secret = c.env.JWT_SECRET;
  const token = await signAuthToken({ uid, email, role }, secret);

  const response: AuthResponse = { token, profile };
  return c.json(response, 201);
});

authRouter.post('/login', async (c) => {
  const body = await c.req.json<LoginRequest>();
  const email = (body.email ?? '').trim().toLowerCase();
  const sql = getSql(c.env);

  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  if (rows.length === 0) {
    return c.json({ error: 'User not found', code: 'auth/user-not-found' }, 401);
  }

  const row = rows[0];
  const storedHash = String(row.password_hash ?? '');
  const valid = await verifyPassword(body.password ?? '', storedHash, c.env);
  if (!valid) {
    return c.json({ error: 'Invalid credentials', code: 'auth/invalid-credential' }, 401);
  }
  // Upgrade users migrated from Firebase to the native hash on their first login.
  if (storedHash.startsWith(LEGACY_PREFIX)) {
    const upgraded = await hashPassword(body.password);
    await sql`UPDATE users SET password_hash = ${upgraded} WHERE uid = ${row.uid}`;
  }

  const profile = mapUserRow(row);
  const secret = c.env.JWT_SECRET;
  const token = await signAuthToken(
    { uid: profile.uid, email: profile.email, role: profile.role },
    secret,
  );

  const response: AuthResponse = { token, profile };
  return c.json(response);
});

authRouter.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM users WHERE uid = ${user.uid} LIMIT 1`;
  if (rows.length === 0) {
    return c.json({ error: 'User not found', code: 'auth/user-not-found' }, 404);
  }
  return c.json(mapUserRow(rows[0]));
});

authRouter.post('/change-password', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<ChangePasswordRequest>();
  const sql = getSql(c.env);

  const rows = await sql`SELECT password_hash FROM users WHERE uid = ${user.uid} LIMIT 1`;
  if (rows.length === 0) {
    return c.json({ error: 'User not found', code: 'auth/user-not-found' }, 404);
  }

  const valid = await verifyPassword(
    body.currentPassword ?? '',
    String(rows[0].password_hash ?? ''),
    c.env,
  );
  if (!valid) {
    return c.json({ error: 'Current password incorrect', code: 'auth/wrong-password' }, 401);
  }

  const newHash = await hashPassword(body.newPassword);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE uid = ${user.uid}`;
  return c.json({ ok: true });
});
