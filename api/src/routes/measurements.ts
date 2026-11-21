import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { Measurement } from '../../../src/types';
import { getSql, generateId } from '../db/client';
import { mapMeasurementRow, mapMeasurementsToRecord } from '../db/mappers';
import { requireAuth, requireSelfOrRole } from '../middleware/auth';

export const measurementsRouter = new Hono<AppEnv>();

measurementsRouter.use('*', requireAuth);

measurementsRouter.get('/:uid', async (c) => {
  const uid = c.req.param('uid');
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM measurements WHERE uid = ${uid}`;
  return c.json(mapMeasurementsToRecord(rows));
});

measurementsRouter.post('/:uid', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const body = await c.req.json<Omit<Measurement, 'id' | 'createdAt'>>();
  const id = generateId();
  const createdAt = Date.now();
  const sql = getSql(c.env);

  const rows = await sql`
    INSERT INTO measurements (
      id,
      uid,
      date_key,
      weight_kg,
      chest_cm,
      waist_cm,
      arm_cm,
      thigh_cm,
      notes,
      created_at
    ) VALUES (
      ${id},
      ${uid},
      ${body.dateKey},
      ${body.weightKg ?? null},
      ${body.chestCm ?? null},
      ${body.waistCm ?? null},
      ${body.armCm ?? null},
      ${body.thighCm ?? null},
      ${body.notes ?? null},
      ${createdAt}
    )
    RETURNING *
  `;

  return c.json(mapMeasurementRow(rows[0]), 201);
});

measurementsRouter.put('/:uid/:id', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const id = c.req.param('id');
  const body = await c.req.json<Measurement>();
  const createdAt = body.createdAt || Date.now();
  const sql = getSql(c.env);

  const rows = await sql`
    INSERT INTO measurements (
      id,
      uid,
      date_key,
      weight_kg,
      chest_cm,
      waist_cm,
      arm_cm,
      thigh_cm,
      notes,
      created_at
    ) VALUES (
      ${id},
      ${uid},
      ${body.dateKey},
      ${body.weightKg ?? null},
      ${body.chestCm ?? null},
      ${body.waistCm ?? null},
      ${body.armCm ?? null},
      ${body.thighCm ?? null},
      ${body.notes ?? null},
      ${createdAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      date_key = EXCLUDED.date_key,
      weight_kg = EXCLUDED.weight_kg,
      chest_cm = EXCLUDED.chest_cm,
      waist_cm = EXCLUDED.waist_cm,
      arm_cm = EXCLUDED.arm_cm,
      thigh_cm = EXCLUDED.thigh_cm,
      notes = EXCLUDED.notes,
      created_at = EXCLUDED.created_at
    WHERE measurements.uid = ${uid}
    RETURNING *
  `;

  if (rows.length === 0) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(mapMeasurementRow(rows[0]));
});

measurementsRouter.delete('/:uid/:id', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const id = c.req.param('id');
  const sql = getSql(c.env);

  await sql`DELETE FROM measurements WHERE id = ${id} AND uid = ${uid}`;
  return c.json({ ok: true });
});
