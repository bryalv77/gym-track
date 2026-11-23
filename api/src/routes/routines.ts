import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { SaveRoutineRequest } from '../../../src/types/api';
import { getSql, generateId } from '../db/client';
import { cleanRoutineItems, mapRoutineRow, mapRoutinesToRecord } from '../db/mappers';
import { requireAuth, requireSelfOrRole } from '../middleware/auth';

export const routinesRouter = new Hono<AppEnv>();

routinesRouter.use('*', requireAuth);

routinesRouter.get('/:coachId', requireSelfOrRole('coachId', 'admin'), async (c) => {
  const coachId = c.req.param('coachId');
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM routines WHERE coach_id = ${coachId}`;
  return c.json(mapRoutinesToRecord(rows));
});

routinesRouter.post('/:coachId', requireSelfOrRole('coachId', 'admin'), async (c) => {
  const body = await c.req.json<SaveRoutineRequest>();
  const sql = getSql(c.env);
  const rows = await sql`
    INSERT INTO routines (id, coach_id, name, items, created_at)
    VALUES (
      ${generateId()},
      ${c.req.param('coachId')},
      ${body.name.trim()},
      ${JSON.stringify(cleanRoutineItems(body.items))}::jsonb,
      ${Date.now()}
    )
    RETURNING *
  `;
  return c.json(mapRoutineRow(rows[0]));
});

routinesRouter.put('/:coachId/:routineId', requireSelfOrRole('coachId', 'admin'), async (c) => {
  const coachId = c.req.param('coachId');
  const routineId = c.req.param('routineId');
  const body = await c.req.json<SaveRoutineRequest>();
  const name = body.name.trim();
  const items = cleanRoutineItems(body.items);
  const itemsJson = JSON.stringify(items);

  const sql = getSql(c.env);
  const rows = await sql`
    UPDATE routines
    SET name = ${name},
        items = ${itemsJson}::jsonb
    WHERE id = ${routineId} AND coach_id = ${coachId}
    RETURNING *
  `;

  return c.json(rows.length ? mapRoutineRow(rows[0]) : null);
});

routinesRouter.delete('/:coachId/:routineId', requireSelfOrRole('coachId', 'admin'), async (c) => {
  const coachId = c.req.param('coachId');
  const routineId = c.req.param('routineId');
  const sql = getSql(c.env);
  await sql`DELETE FROM routines WHERE id = ${routineId} AND coach_id = ${coachId}`;
  return c.json({ ok: true });
});
