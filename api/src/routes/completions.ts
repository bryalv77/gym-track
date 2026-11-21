import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getSql } from '../db/client';
import { mapCompletionsToByDate, mapCompletionsToByUser } from '../db/mappers';
import { requireAuth, requireSelfOrRole } from '../middleware/auth';

export const completionsRouter = new Hono<AppEnv>();

completionsRouter.use('*', requireAuth);

completionsRouter.get('/', async (c) => {
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM completions`;
  return c.json(mapCompletionsToByUser(rows));
});

completionsRouter.get('/:uid', async (c) => {
  const uid = c.req.param('uid');
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM completions WHERE uid = ${uid}`;
  return c.json(mapCompletionsToByDate(rows));
});

completionsRouter.put('/:uid/:dateKey/:taskId', requireSelfOrRole('uid', 'admin'), async (c) => {
  const uid = c.req.param('uid');
  const dateKey = c.req.param('dateKey');
  const taskId = c.req.param('taskId');
  const body = await c.req.json<{ done: boolean }>();
  const sql = getSql(c.env);

  if (body.done) {
    const completedAt = Date.now();
    await sql`
      INSERT INTO completions (uid, date_key, task_id, completed_at)
      VALUES (${uid}, ${dateKey}, ${taskId}, ${completedAt})
      ON CONFLICT (uid, date_key, task_id)
      DO UPDATE SET completed_at = EXCLUDED.completed_at
    `;
    return c.json({ completedAt });
  } else {
    await sql`
      DELETE FROM completions
      WHERE uid = ${uid} AND date_key = ${dateKey} AND task_id = ${taskId}
    `;
    return c.json({ completedAt: null });
  }
});
