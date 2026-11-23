import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { DailySelfie } from '../../../src/types';
import { getSql, generateId, type SqlClient } from '../db/client';
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

type SelfieInput = Omit<DailySelfie, 'id' | 'createdAt'> & { createdAt?: number };

async function upsertSelfie(sql: SqlClient, uid: string, id: string, body: SelfieInput) {
  const rows = await sql`
    INSERT INTO selfies (id, uid, date_key, photo_data, notes, taken_at, created_at)
    VALUES (
      ${id},
      ${uid},
      ${body.dateKey},
      ${body.photoData},
      ${body.notes ?? null},
      ${body.takenAt},
      ${body.createdAt || Date.now()}
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
  return rows[0] ? mapSelfieRow(rows[0]) : null;
}

selfiesRouter.post('/:uid', requireSelfOrRole('uid', 'admin'), async (c) => {
  const body = await c.req.json<SelfieInput>();
  const created = await upsertSelfie(getSql(c.env), c.req.param('uid')!, generateId(), {
    ...body,
    createdAt: undefined,
  });
  return c.json(created, 201);
});

selfiesRouter.put('/:uid/:id', requireSelfOrRole('uid', 'admin'), async (c) => {
  const body = await c.req.json<DailySelfie>();
  const updated = await upsertSelfie(getSql(c.env), c.req.param('uid')!, c.req.param('id')!, body);
  return updated ? c.json(updated) : c.json({ error: 'Not found' }, 404);
});

selfiesRouter.delete('/:uid/:id', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const id = c.req.param('id');
  const sql = getSql(c.env);

  await sql`DELETE FROM selfies WHERE id = ${id} AND uid = ${uid}`;
  return c.json({ ok: true });
});
