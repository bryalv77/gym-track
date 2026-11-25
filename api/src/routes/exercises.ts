import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { Exercise } from '../../../src/types';
import type { SeedExercisesRequest } from '../../../src/types/api';
import { getSql, generateId } from '../db/client';
import { mapExerciseRow, mapExercisesToRecord } from '../db/mappers';
import { requireAuth, requireRole } from '../middleware/auth';
import { seedExercises } from '../seedExercises';
import { LANGS } from '../../../src/shared/exerciseDefaults';

export const exercisesRouter = new Hono<AppEnv>();

exercisesRouter.use('*', requireAuth);

exercisesRouter.get('/', async (c) => {
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM exercises`;
  return c.json(mapExercisesToRecord(rows));
});

// Members may trigger it too (self-coached ones need the starter library); it only runs once per version.
exercisesRouter.post('/seed', async (c) => {
  const body = await c.req.json<SeedExercisesRequest>().catch(() => null);
  const language = LANGS.find((lang) => lang === body?.language) ?? 'en';
  const seeded = await seedExercises(getSql(c.env), c.get('user').uid, language);
  return c.json({ seeded });
});

exercisesRouter.post('/', requireRole('admin', 'coach'), async (c) => {
  const body = await c.req.json<Omit<Exercise, 'id' | 'createdAt' | 'createdBy'>>();
  const sql = getSql(c.env);
  const rows = await sql`
    INSERT INTO exercises (
      id, name, type, description, image_url, video_url, met,
      suggested_order, metric_fields, created_by, created_at
    ) VALUES (
      ${generateId()},
      ${body.name},
      ${body.type},
      ${body.description ?? null},
      ${body.imageUrl ?? null},
      ${body.videoUrl ?? null},
      ${body.met ?? null},
      ${body.suggestedOrder ?? null},
      ${JSON.stringify(body.metricFields ?? [])}::jsonb,
      ${c.get('user').uid},
      ${Date.now()}
    )
    RETURNING *
  `;
  return c.json(mapExerciseRow(rows[0]), 201);
});

exercisesRouter.patch('/:id', requireRole('admin', 'coach'), async (c) => {
  const id = c.req.param('id');
  const patch = await c.req.json<Partial<Omit<Exercise, 'id' | 'createdAt' | 'createdBy'>>>();

  const sql = getSql(c.env);
  const existingRows = await sql`SELECT * FROM exercises WHERE id = ${id} LIMIT 1`;
  if (existingRows.length === 0) {
    return c.json({ error: 'Exercise not found' }, 404);
  }

  const next = { ...mapExerciseRow(existingRows[0]), ...patch };
  const updated = await sql`
    UPDATE exercises
    SET name = ${next.name},
        type = ${next.type},
        description = ${next.description ?? null},
        image_url = ${next.imageUrl ?? null},
        video_url = ${next.videoUrl ?? null},
        met = ${next.met ?? null},
        suggested_order = ${next.suggestedOrder ?? null},
        metric_fields = ${JSON.stringify(next.metricFields)}::jsonb
    WHERE id = ${id}
    RETURNING *
  `;

  return c.json(mapExerciseRow(updated[0]));
});

exercisesRouter.delete('/:id', requireRole('admin', 'coach'), async (c) => {
  const id = c.req.param('id');
  const sql = getSql(c.env);
  await sql`DELETE FROM exercises WHERE id = ${id}`;
  return c.json({ ok: true });
});
