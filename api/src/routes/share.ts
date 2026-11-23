import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { GuestPlan, ShareCode } from '../../../src/types/api';
import { getSql } from '../db/client';
import { mapExerciseRow, mapRoutineRow } from '../db/mappers';
import { requireAuth, requireRole } from '../middleware/auth';

// No 0/O/1/I/L so codes survive being read aloud or typed from a screenshot.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** Coach/admin side: create, list and revoke plan codes. */
export const shareRouter = new Hono<AppEnv>();

shareRouter.use('*', requireAuth, requireRole('coach', 'admin'));

shareRouter.get('/', async (c) => {
  const user = c.get('user');
  const sql = getSql(c.env);
  const rows = await sql`
    SELECT s.code, s.routine_id, s.created_at, s.expires_at, r.name AS routine_name
    FROM share_codes s
    JOIN routines r ON r.id = s.routine_id
    WHERE s.coach_id = ${user.uid} AND s.revoked = FALSE
    ORDER BY s.created_at DESC
  `;
  const codes: ShareCode[] = rows.map((row) => ({
    code: String(row.code),
    routineId: String(row.routine_id),
    routineName: String(row.routine_name ?? ''),
    createdAt: Number(row.created_at),
    ...(row.expires_at != null ? { expiresAt: Number(row.expires_at) } : {}),
  }));
  return c.json(codes);
});

shareRouter.post('/', async (c) => {
  const user = c.get('user');
  const { routineId } = await c.req.json<{ routineId: string }>();
  const sql = getSql(c.env);
  const owned = await sql`SELECT id FROM routines WHERE id = ${routineId} AND coach_id = ${user.uid} LIMIT 1`;
  if (owned.length === 0) return c.json({ error: 'Routine not found' }, 404);

  const code = generateCode();
  await sql`
    INSERT INTO share_codes (code, coach_id, routine_id, created_at)
    VALUES (${code}, ${user.uid}, ${routineId}, ${Date.now()})
  `;
  return c.json({ code }, 201);
});

shareRouter.delete('/:code', async (c) => {
  const user = c.get('user');
  const sql = getSql(c.env);
  await sql`UPDATE share_codes SET revoked = TRUE WHERE code = ${c.req.param('code')} AND coach_id = ${user.uid}`;
  return c.json({ ok: true });
});

/** Public side: anyone holding a valid code can read that one routine (read-only, no account). */
export const guestRouter = new Hono<AppEnv>();

guestRouter.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== CODE_LENGTH) return c.json({ error: 'Invalid code', code: 'guest/invalid-code' }, 404);

  const sql = getSql(c.env);
  const rows = await sql`
    SELECT r.*, u.name AS coach_name
    FROM share_codes s
    JOIN routines r ON r.id = s.routine_id
    JOIN users u ON u.uid = s.coach_id
    WHERE s.code = ${code}
      AND s.revoked = FALSE
      AND (s.expires_at IS NULL OR s.expires_at > ${Date.now()})
    LIMIT 1
  `;
  if (rows.length === 0) return c.json({ error: 'Invalid code', code: 'guest/invalid-code' }, 404);

  const routine = mapRoutineRow(rows[0]);
  const ids = routine.items.map((item) => item.exerciseId);
  const exerciseRows = ids.length ? await sql`SELECT * FROM exercises WHERE id = ANY(${ids})` : [];
  const exercises = Object.fromEntries(exerciseRows.map((row) => {
    const exercise = mapExerciseRow(row);
    return [exercise.id, exercise];
  }));

  const plan: GuestPlan = {
    coachName: String(rows[0].coach_name ?? ''),
    routine: { name: routine.name, items: routine.items },
    exercises,
  };
  return c.json(plan);
});
