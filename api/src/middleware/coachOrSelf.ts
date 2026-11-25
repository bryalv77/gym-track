import type { Context, Next } from 'hono';
import type { AppEnv } from '../types';
import type { AssignRoutineRequest, UnassignRoutineRequest } from '../../../src/types/api';

/** Coaches and admins plan for anyone; a member (no coach) plans only for themselves. */
export async function coachOrSelf(c: Context<AppEnv>, next: Next) {
  const user = c.get('user');
  if (user.role === 'admin' || user.role === 'coach') return next();
  const body = (await c.req.json().catch(() => null)) as
    | Partial<AssignRoutineRequest & UnassignRoutineRequest>
    | null;
  const ownsIt = Array.isArray(body?.memberIds)
    ? body.memberIds.length === 1 && body.memberIds[0] === user.uid && body.coachId === user.uid
    : body?.memberId === user.uid;
  if (!ownsIt) return c.json({ error: 'Forbidden', code: 'auth/forbidden' }, 403);
  await next();
}
