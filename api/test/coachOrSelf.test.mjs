// Run with: pnpm test
import assert from 'node:assert/strict';
import test from 'node:test';
import { Hono } from 'hono';
import { coachOrSelf } from '../src/middleware/coachOrSelf.ts';

const as = (role) =>
  new Hono()
    .use('*', async (c, next) => { c.set('user', { uid: 'me', email: '', role }); await next(); })
    .post('/', coachOrSelf, async (c) => c.json(await c.req.json()));
const post = (role, body) => as(role).request('/', { method: 'POST', body: JSON.stringify(body) });

test('members may only plan routines for themselves', async () => {
  const mine = { memberIds: ['me'], coachId: 'me', dateKey: 'd', routine: {} };
  assert.equal((await post('member', mine)).status, 200);
  assert.equal((await post('member', { memberId: 'me', dateKey: 'd', routineId: 'r' })).status, 200);
  for (const body of [
    { ...mine, memberIds: ['other'] },
    { ...mine, memberIds: ['me', 'other'] },
    { ...mine, coachId: 'other' },
    { memberId: 'other' },
    {},
  ]) {
    assert.equal((await post('member', body)).status, 403, JSON.stringify(body));
  }
  assert.equal((await post('coach', { memberIds: ['other'], coachId: 'c' })).status, 200);
});
