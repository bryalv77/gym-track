import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getSql, generateId } from '../db/client';
import { mapGymRow, mapGymsToRecord } from '../db/mappers';
import { requireAuth, requireRole } from '../middleware/auth';
import { generateCoachCode } from '../../../src/utils/coachCode';

export const gymsRouter = new Hono<AppEnv>();

gymsRouter.get('/', async (c) => {
  const sql = getSql(c.env);
  const rows = await sql`SELECT id, name, created_at FROM gyms`;
  return c.json(mapGymsToRecord(rows));
});

gymsRouter.post('/', requireAuth, requireRole('admin'), async (c) => {
  const body = await c.req.json<{ name: string }>();
  const id = generateId();
  const code = generateCoachCode();
  const createdAt = Date.now();
  const name = body.name.trim();

  const sql = getSql(c.env);
  const rows = await sql`
    INSERT INTO gyms (id, name, coach_code, created_at)
    VALUES (${id}, ${name}, ${code}, ${createdAt})
    RETURNING *
  `;
  return c.json(mapGymRow(rows[0]), 201);
});

gymsRouter.patch('/:id', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ name: string }>();
  const sql = getSql(c.env);
  const rows = await sql`
    UPDATE gyms
    SET name = ${body.name.trim()}
    WHERE id = ${id}
    RETURNING *
  `;
  return c.json(rows.length ? mapGymRow(rows[0]) : null);
});

gymsRouter.delete('/:id', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const sql = getSql(c.env);
  await sql`DELETE FROM gyms WHERE id = ${id}`;
  return c.json({ ok: true });
});

gymsRouter.get('/:id/code', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const sql = getSql(c.env);
  const rows = await sql`SELECT coach_code FROM gyms WHERE id = ${id} LIMIT 1`;
  return c.json({ code: rows.length ? String(rows[0].coach_code) : null });
});

gymsRouter.post('/:id/code/regenerate', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const code = generateCoachCode();
  const sql = getSql(c.env);
  await sql`UPDATE gyms SET coach_code = ${code} WHERE id = ${id}`;
  return c.json({ code });
});
