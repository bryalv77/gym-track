import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { Measurement } from '../../../src/types';
import { getSql, generateId, type SqlClient } from '../db/client';
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

type MeasurementInput = Omit<Measurement, 'id' | 'createdAt'> & { createdAt?: number };

async function upsertMeasurement(sql: SqlClient, uid: string, id: string, body: MeasurementInput) {
  const rows = await sql`
    INSERT INTO measurements (
      id, uid, date_key, weight_kg, chest_cm, waist_cm, arm_cm, thigh_cm, notes, created_at
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
      ${body.createdAt || Date.now()}
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
  return rows[0] ? mapMeasurementRow(rows[0]) : null;
}

measurementsRouter.post('/:uid', requireSelfOrRole('uid', 'admin'), async (c) => {
  const body = await c.req.json<MeasurementInput>();
  const created = await upsertMeasurement(getSql(c.env), c.req.param('uid')!, generateId(), {
    ...body,
    createdAt: undefined,
  });
  return c.json(created, 201);
});

measurementsRouter.put('/:uid/:id', requireSelfOrRole('uid', 'admin'), async (c) => {
  const body = await c.req.json<Measurement>();
  const updated = await upsertMeasurement(
    getSql(c.env),
    c.req.param('uid')!,
    c.req.param('id')!,
    body,
  );
  return updated ? c.json(updated) : c.json({ error: 'Not found' }, 404);
});

measurementsRouter.delete('/:uid/:id', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const id = c.req.param('id');
  const sql = getSql(c.env);

  await sql`DELETE FROM measurements WHERE id = ${id} AND uid = ${uid}`;
  return c.json({ ok: true });
});
