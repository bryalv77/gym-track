import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { gymsRouter } from './routes/gyms';
import { exercisesRouter } from './routes/exercises';
import { routinesRouter } from './routes/routines';
import { assignmentsRouter } from './routes/assignments';
import { completionsRouter } from './routes/completions';
import { measurementsRouter } from './routes/measurements';
import { selfiesRouter } from './routes/selfies';
import { syncRouter } from './routes/sync';

const app = new Hono<AppEnv>();

app.use(
  '*',
  cors({
    origin: (origin, c) => c.env?.CORS_ORIGIN || origin || '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.get('/api/health', (c) => c.json({ ok: true, service: 'gym-track-api' }));

app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/gyms', gymsRouter);
app.route('/api/exercises', exercisesRouter);
app.route('/api/routines', routinesRouter);
app.route('/api/assignments', assignmentsRouter);
app.route('/api/completions', completionsRouter);
app.route('/api/measurements', measurementsRouter);
app.route('/api/selfies', selfiesRouter);
app.route('/api/sync', syncRouter);

export default app;
