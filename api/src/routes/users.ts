import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { UpdateUserPatch } from '../../../src/types/api';
import { getSql } from '../db/client';
import { mapUserRow, mapUsersToRecord } from '../db/mappers';
import { requireAuth, requireRole, requireSelfOrRole } from '../middleware/auth';

export const usersRouter = new Hono<AppEnv>();

usersRouter.use('*', requireAuth);

usersRouter.get('/', requireRole('admin', 'coach'), async (c) => {
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM users`;
  return c.json(mapUsersToRecord(rows));
});

usersRouter.get('/:uid', async (c) => {
  const uid = c.req.param('uid');
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM users WHERE uid = ${uid} LIMIT 1`;
  return rows.length ? c.json(mapUserRow(rows[0])) : c.json(null);
});

usersRouter.patch('/:uid', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const user = c.get('user');

  const sql = getSql(c.env);
  const existingRows = await sql`SELECT * FROM users WHERE uid = ${uid} LIMIT 1`;
  if (existingRows.length === 0) {
    return c.json({ error: 'User not found', code: 'users/not-found' }, 404);
  }

  const existing = existingRows[0];
  const body = await c.req.json<UpdateUserPatch>();
  const isAdmin = user.role === 'admin';

  const name = body.name !== undefined ? body.name.trim() : String(existing.name ?? '');
  const photoData =
    body.photoData !== undefined ? body.photoData : ((existing.photo_data as string | null) ?? null);
  const role = isAdmin && body.role !== undefined ? body.role : String(existing.role ?? 'member');
  const gymId =
    isAdmin && body.gymId !== undefined
      ? body.gymId
      : ((existing.gym_id as string | null) ?? null);
  const coachId =
    isAdmin && body.coachId !== undefined
      ? body.coachId
      : ((existing.coach_id as string | null) ?? null);

  const updated = await sql`
    UPDATE users
    SET name = ${name},
        role = ${role},
        gym_id = ${gymId},
        coach_id = ${coachId},
        photo_data = ${photoData}
    WHERE uid = ${uid}
    RETURNING *
  `;

  return c.json(mapUserRow(updated[0]));
});
