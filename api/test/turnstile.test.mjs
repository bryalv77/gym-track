// Run with: pnpm test
import assert from 'node:assert/strict';
import test from 'node:test';
import { Hono } from 'hono';
import { requireHuman } from '../src/middleware/turnstile.ts';

const app = new Hono().post('/', requireHuman, async (c) => c.json(await c.req.json()));
const env = { TURNSTILE_SECRET_KEY: 'secret' };
const post = (body, bindings = env) => app.request('/', { method: 'POST', body }, bindings);

test('requireHuman lets only verified tokens through', async (t) => {
  let verify = async () => Response.json({ success: true });
  const fetchMock = t.mock.method(globalThis, 'fetch', () => verify());
  t.mock.method(console, 'error', () => {});
  const good = JSON.stringify({ turnstileToken: 'tok' });

  assert.equal((await post(good, {})).status, 500);
  for (const body of ['not json', 'null', '{}', '{"turnstileToken":1}', '{"turnstileToken":""}']) {
    assert.equal((await post(body)).status, 403, body);
  }
  assert.equal(fetchMock.mock.callCount(), 0);

  const ok = await post(good);
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { turnstileToken: 'tok' });

  verify = async () => Response.json({ success: false });
  assert.equal((await post(good)).status, 403);
  verify = async () => { throw new Error('down'); };
  assert.equal((await post(good)).status, 403);
});
