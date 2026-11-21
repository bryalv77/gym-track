import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { RoutineItem } from '../../../src/types';
import type {
  AssignRoutineRequest,
  SaveRoutineRequest,
  UnassignRoutineRequest,
} from '../../../src/types/api';
import { getSql, generateId } from '../db/client';
import { mapRoutineRow, mapRoutinesToRecord } from '../db/mappers';
import { requireAuth, requireRole, requireSelfOrRole } from '../middleware/auth';

function cleanItems(items: RoutineItem[] = []): RoutineItem[] {
  return items.map(({ exerciseId, metrics, notes }) => ({
    exerciseId,
    metrics: metrics ?? {},
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
  }));
}

export const routinesRouter = new Hono<AppEnv>();

routinesRouter.use('*', requireAuth);

routinesRouter.get('/:coachId', requireSelfOrRole('coachId', 'admin'), async (c) => {
  const coachId = c.req.param('coachId');
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM routines WHERE coach_id = ${coachId}`;
  return c.json(mapRoutinesToRecord(rows as Record<string, unknown>[]));
});

routinesRouter.post('/:coachId/assign', requireRole('admin', 'coach'), async (c) => {
  const paramCoachId = c.req.param('coachId');
  const body = await c.req.json<AssignRoutineRequest>();
  const coachId = body.coachId || paramCoachId;
  const { routine, memberIds, dateKey } = body;

  const sql = getSql(c.env);

  if (Array.isArray(memberIds) && memberIds.length > 0) {
    await sql`
      DELETE FROM assignments
      WHERE date_key = ${dateKey}
        AND routine_id = ${routine.id}
        AND member_id = ANY(${memberIds})
    `;

    const now = Date.now();
    const items = cleanItems(routine.items ?? []);
    for (const memberId of memberIds) {
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const id = generateId();
        const createdAt = now + index;
        const metricsJson = JSON.stringify(item.metrics ?? {});
        await sql`
          INSERT INTO assignments (
            id, date_key, exercise_id, member_id, coach_id,
            metrics, notes, routine_id, routine_name, created_at
          ) VALUES (
            ${id},
            ${dateKey},
            ${item.exerciseId},
            ${memberId},
            ${coachId},
            ${metricsJson}::jsonb,
            ${item.notes ?? null},
            ${routine.id},
            ${routine.name},
            ${createdAt}
          )
        `;
      }
    }
  }

  return c.json({ ok: true });
});

routinesRouter.post('/:coachId/unassign', requireRole('admin', 'coach'), async (c) => {
  const body = await c.req.json<UnassignRoutineRequest>();
  const sql = getSql(c.env);
  await sql`
    DELETE FROM assignments
    WHERE date_key = ${body.dateKey}
      AND routine_id = ${body.routineId}
      AND member_id = ${body.memberId}
  `;
  return c.json({ ok: true });
});

routinesRouter.post('/:coachId', requireSelfOrRole('coachId', 'admin'), async (c) => {
  const coachId = c.req.param('coachId');
  const body = await c.req.json<SaveRoutineRequest>();
  const name = body.name.trim();
  const items = cleanItems(body.items ?? []);
  const itemsJson = JSON.stringify(items);
  const sql = getSql(c.env);

  if (body.id) {
    const createdAt = Date.now();
    const rows = await sql`
      INSERT INTO routines (id, coach_id, name, items, created_at)
      VALUES (${body.id}, ${coachId}, ${name}, ${itemsJson}::jsonb, ${createdAt})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        items = EXCLUDED.items
      WHERE routines.coach_id = ${coachId}
      RETURNING *
    `;
    return c.json(mapRoutineRow(rows[0] as Record<string, unknown>));
  }

  const id = generateId();
  const createdAt = Date.now();
  const rows = await sql`
    INSERT INTO routines (id, coach_id, name, items, created_at)
    VALUES (${id}, ${coachId}, ${name}, ${itemsJson}::jsonb, ${createdAt})
    RETURNING *
  `;
  return c.json(mapRoutineRow(rows[0] as Record<string, unknown>));
});

routinesRouter.put('/:coachId/:routineId', requireSelfOrRole('coachId', 'admin'), async (c) => {
  const coachId = c.req.param('coachId');
  const routineId = c.req.param('routineId');
  const body = await c.req.json<SaveRoutineRequest>();
  const name = body.name.trim();
  const items = cleanItems(body.items ?? []);
  const itemsJson = JSON.stringify(items);

  const sql = getSql(c.env);
  const rows = await sql`
    UPDATE routines
    SET name = ${name},
        items = ${itemsJson}::jsonb
    WHERE id = ${routineId} AND coach_id = ${coachId}
    RETURNING *
  `;

  return c.json(rows.length ? mapRoutineRow(rows[0] as Record<string, unknown>) : null);
});

routinesRouter.delete('/:coachId/:routineId', requireSelfOrRole('coachId', 'admin'), async (c) => {
  const coachId = c.req.param('coachId');
  const routineId = c.req.param('routineId');
  const sql = getSql(c.env);
  await sql`DELETE FROM routines WHERE id = ${routineId} AND coach_id = ${coachId}`;
  return c.json({ ok: true });
});
