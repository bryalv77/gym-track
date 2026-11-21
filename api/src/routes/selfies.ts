import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { DailySelfie } from '../../../src/types';
import { getSql, generateId } from '../db/client';
import { mapSelfieRow, mapSelfiesToRecord } from '../db/mappers';
import { requireAuth, requireSelfOrRole } from '../middleware/auth';

export const selfiesRouter = new Hono<AppEnv>();

selfiesRouter.use('*', requireAuth);

selfiesRouter.get('/:uid', async (c) => {
  const uid = c.req.param('uid');
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM selfies WHERE uid = ${uid}`;
  return c.json(mapSelfiesToRecord(rows));
});

selfiesRouter.post('/:uid', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const body = await c.req.json<Omit<DailySelfie, 'id' | 'createdAt'>>();
  const id = generateId();
  const createdAt = Date.now();
  const sql = getSql(c.env);

  const rows = await sql`
    INSERT INTO selfies (
      id,
      uid,
      date_key,
      photo_data,
      notes,
      taken_at,
      created_at
    ) VALUES (
      ${id},
      ${uid},
      ${body.dateKey},
      ${body.photoData},
      ${body.notes ?? null},
      ${body.takenAt},
      ${createdAt}
    )
    RETURNING *
  `;

  return c.json(mapSelfieRow(rows[0]), 201);
});

selfiesRouter.put('/:uid/:id', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const id = c.req.param('id');
  const body = await c.req.json<DailySelfie>();
  const createdAt = body.createdAt || Date.now();
  const sql = getSql(c.env);

  const rows = await sql`
    INSERT INTO selfies (
      id,
      uid,
      date_key,
      photo_data,
      notes,
      taken_at,
      created_at
    ) VALUES (
      ${id},
      ${uid},
      ${body.dateKey},
      ${body.photoData},
      ${body.notes ?? null},
      ${body.takenAt},
      ${createdAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      date_key = EXCLUDED.date_key,
      photo_data = EXCLUDED.photo_data,
      notes = EXCLUDED.notes,
      taken_at = EXCLUDED.taken_at,
      created_at = EXCLUDED.created_at
    WHERE selfies.uid = ${uid}
    RETURNING *
  `;

  if (rows.length === 0) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(mapSelfieRow(rows[0]));
});

selfiesRouter.delete('/:uid/:id', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const id = c.req.param('id');
  const sql = getSql(c.env);

  await sql`DELETE FROM selfies WHERE id = ${id} AND uid = ${uid}`;
  return c.json({ ok: true });
});
