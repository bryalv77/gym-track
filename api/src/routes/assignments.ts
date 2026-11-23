import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { AssignRoutineRequest, UnassignRoutineRequest } from '../../../src/types/api';
import type { Assignment } from '../../../src/types';
import { getSql, generateId } from '../db/client';
import { cleanRoutineItems, mapAssignmentRow, mapAssignmentsToByDate } from '../db/mappers';
import { requireAuth, requireRole } from '../middleware/auth';

/** Empty strings from the form mean "no value". */
const emptyToNull = (value: string | null | undefined) => (value ? value : null);

export const assignmentsRouter = new Hono<AppEnv>();

assignmentsRouter.use('*', requireAuth);

assignmentsRouter.get('/', async (c) => {
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM assignments`;
  return c.json(mapAssignmentsToByDate(rows));
});

assignmentsRouter.post('/', requireRole('admin', 'coach'), async (c) => {
  const body = await c.req.json<Omit<Assignment, 'id' | 'createdAt'>>();
  const sql = getSql(c.env);
  const id = generateId();
  const createdAt = Date.now();
  const metricsJson = JSON.stringify(body.metrics ?? {});
  const notes = emptyToNull(body.notes);
  const routineId = emptyToNull(body.routineId);
  const routineName = emptyToNull(body.routineName);

  const rows = await sql`
    INSERT INTO assignments (
      id,
      date_key,
      exercise_id,
      member_id,
      coach_id,
      metrics,
      notes,
      routine_id,
      routine_name,
      created_at
    ) VALUES (
      ${id},
      ${body.dateKey},
      ${body.exerciseId},
      ${body.memberId},
      ${body.coachId},
      ${metricsJson}::jsonb,
      ${notes},
      ${routineId},
      ${routineName},
      ${createdAt}
    )
    RETURNING *
  `;

  return c.json(mapAssignmentRow(rows[0]), 201);
});

assignmentsRouter.post('/routine', requireRole('admin', 'coach'), async (c) => {
  const { routine, memberIds, dateKey, coachId } = await c.req.json<AssignRoutineRequest>();
  if (!Array.isArray(memberIds) || memberIds.length === 0) return c.json({ ok: true });

  const sql = getSql(c.env);
  await sql`
    DELETE FROM assignments
    WHERE date_key = ${dateKey}
      AND routine_id = ${routine.id}
      AND member_id = ANY(${memberIds})
  `;

  const now = Date.now();
  const items = cleanRoutineItems(routine.items);
  for (const memberId of memberIds) {
    for (const [index, item] of items.entries()) {
      await sql`
        INSERT INTO assignments (
          id, date_key, exercise_id, member_id, coach_id,
          metrics, notes, routine_id, routine_name, created_at
        ) VALUES (
          ${generateId()},
          ${dateKey},
          ${item.exerciseId},
          ${memberId},
          ${coachId},
          ${JSON.stringify(item.metrics)}::jsonb,
          ${item.notes ?? null},
          ${routine.id},
          ${routine.name},
          ${now + index}
        )
      `;
    }
  }
  return c.json({ ok: true });
});

assignmentsRouter.post('/routine/unassign', requireRole('admin', 'coach'), async (c) => {
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

assignmentsRouter.patch('/:dateKey/:assignmentId', requireRole('admin', 'coach'), async (c) => {
  const dateKey = c.req.param('dateKey');
  const assignmentId = c.req.param('assignmentId');
  const body = await c.req.json<
    Partial<Omit<Assignment, 'id' | 'dateKey'>> & {
      notes?: string | null;
      routineId?: string | null;
      routineName?: string | null;
    }
  >();

  const sql = getSql(c.env);
  const existingRows = await sql`
    SELECT * FROM assignments
    WHERE id = ${assignmentId} AND date_key = ${dateKey}
    LIMIT 1
  `;

  if (existingRows.length === 0) {
    return c.json({ error: 'Assignment not found' }, 404);
  }

  const current = mapAssignmentRow(existingRows[0]);
  const exerciseId = body.exerciseId ?? current.exerciseId;
  const memberId = body.memberId ?? current.memberId;
  const coachId = body.coachId ?? current.coachId;
  const metricsJson = JSON.stringify(body.metrics ?? current.metrics ?? {});
  const notes = 'notes' in body ? emptyToNull(body.notes) : (current.notes ?? null);
  const routineId = 'routineId' in body ? emptyToNull(body.routineId) : (current.routineId ?? null);
  const routineName =
    'routineName' in body ? emptyToNull(body.routineName) : (current.routineName ?? null);

  const updated = await sql`
    UPDATE assignments
    SET
      exercise_id = ${exerciseId},
      member_id = ${memberId},
      coach_id = ${coachId},
      metrics = ${metricsJson}::jsonb,
      notes = ${notes},
      routine_id = ${routineId},
      routine_name = ${routineName}
    WHERE id = ${assignmentId} AND date_key = ${dateKey}
    RETURNING *
  `;

  return c.json(mapAssignmentRow(updated[0]));
});

assignmentsRouter.delete('/:dateKey/:assignmentId', requireRole('admin', 'coach'), async (c) => {
  const dateKey = c.req.param('dateKey');
  const assignmentId = c.req.param('assignmentId');
  const sql = getSql(c.env);

  await sql`
    DELETE FROM assignments
    WHERE id = ${assignmentId} AND date_key = ${dateKey}
  `;

  return c.json({ ok: true });
});
