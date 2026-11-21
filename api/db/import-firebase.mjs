// One-off, re-runnable import of a Firebase export into Neon.
//   node api/db/import-firebase.mjs <dir with rtdb.json + users.json> [--dry]
// rtdb.json:  firebase database:get /      users.json: firebase auth:export --format=json
// Users keep their Firebase password: the scrypt hash is stored as
// `fbscrypt:<salt>:<hash>` and upgraded to PBKDF2 on first login.
import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const [dir, flag] = process.argv.slice(2);
const dry = flag === '--dry';
if (!dir) {
  console.error('Usage: node api/db/import-firebase.mjs <export dir> [--dry]');
  process.exit(1);
}

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = path.resolve(process.cwd(), '.dev.vars');
  const match = fs.existsSync(file) && fs.readFileSync(file, 'utf8').match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
  return match ? match[1].replace(/^['"]|['"]$/g, '') : null;
}

const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const db = read('rtdb.json');
const authUsers = new Map(read('users.json').users.map((u) => [u.localId, u]));
const json = (value) => JSON.stringify(value ?? null);
const entries = (obj) => Object.entries(obj ?? {});
const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

const rows = []; // [label, sql, params]
const add = (label, text, params) => rows.push([label, text, params]);
const skipped = [];

for (const [id, gym] of entries(db.gyms)) {
  add('gyms', `INSERT INTO gyms (id, name, coach_code, created_at) VALUES ($1,$2,$3,$4)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [id, gym.name, db.gymCodes?.[id] ?? randomCode(), gym.createdAt ?? Date.now()]);
}

const userIds = new Set();
for (const [uid, p] of entries(db.users)) {
  const auth = authUsers.get(uid);
  if (!auth?.passwordHash || !auth?.salt) { skipped.push(`user ${p.email}: no Firebase password hash`); continue; }
  userIds.add(uid);
  add('users', `INSERT INTO users (uid, name, email, password_hash, role, gym_id, coach_id, photo_data, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,$8)
    ON CONFLICT (uid) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role,
      gym_id = EXCLUDED.gym_id, photo_data = EXCLUDED.photo_data`,
    [uid, p.name, String(p.email).toLowerCase(), `fbscrypt:${auth.salt}:${auth.passwordHash}`,
      p.role, p.gymId ?? null, p.photoData ?? null, p.createdAt ?? Date.now()]);
}
for (const [uid, p] of entries(db.users)) {
  if (userIds.has(uid) && p.coachId && userIds.has(p.coachId)) {
    add('users(coach)', 'UPDATE users SET coach_id = $2 WHERE uid = $1', [uid, p.coachId]);
  }
}
for (const [uid, a] of authUsers) if (!db.users?.[uid]) skipped.push(`auth user ${a.email}: no profile in the database`);

for (const [id, e] of entries(db.exercises)) {
  add('exercises', `INSERT INTO exercises (id, name, type, description, image_url, video_url, met, suggested_order, metric_fields, created_by, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description,
      image_url = EXCLUDED.image_url, video_url = EXCLUDED.video_url, met = EXCLUDED.met,
      suggested_order = EXCLUDED.suggested_order, metric_fields = EXCLUDED.metric_fields`,
    [id, e.name, e.type, e.description ?? null, e.imageUrl ?? null, e.videoUrl ?? null, e.met ?? null,
      e.suggestedOrder ?? null, json(e.metricFields ?? []), e.createdBy ?? '', e.createdAt ?? Date.now()]);
}

for (const [coachId, byId] of entries(db.routines)) {
  if (!userIds.has(coachId)) { skipped.push(`routines of unknown coach ${coachId}`); continue; }
  for (const [id, r] of entries(byId)) {
    add('routines', `INSERT INTO routines (id, coach_id, name, items, created_at) VALUES ($1,$2,$3,$4::jsonb,$5)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, items = EXCLUDED.items`,
      [id, coachId, r.name, json(r.items ?? []), r.createdAt ?? Date.now()]);
  }
}

for (const [dateKey, byId] of entries(db.assignments)) {
  for (const [id, a] of entries(byId)) {
    add('assignments', `INSERT INTO assignments (id, date_key, exercise_id, member_id, coach_id, metrics, notes, routine_id, routine_name, created_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)
      ON CONFLICT (id) DO UPDATE SET metrics = EXCLUDED.metrics, notes = EXCLUDED.notes`,
      [id, a.dateKey ?? dateKey, a.exerciseId, a.memberId, a.coachId, json(a.metrics ?? {}), a.notes ?? null,
        a.routineId ?? null, a.routineName ?? null, a.createdAt ?? Date.now()]);
  }
}

for (const [uid, byDate] of entries(db.completions)) {
  if (!userIds.has(uid)) { skipped.push(`completions of unknown user ${uid}`); continue; }
  for (const [dateKey, byTask] of entries(byDate)) {
    for (const [taskId, c] of entries(byTask)) {
      add('completions', `INSERT INTO completions (uid, date_key, task_id, completed_at) VALUES ($1,$2,$3,$4)
        ON CONFLICT (uid, date_key, task_id) DO NOTHING`, [uid, dateKey, taskId, c.completedAt]);
    }
  }
}

// Measurement/selfie ids are only unique per user in Firebase; Postgres needs them global.
for (const [uid, byId] of entries(db.measurements)) {
  if (!userIds.has(uid)) { skipped.push(`measurements of unknown user ${uid}`); continue; }
  for (const [key, m] of entries(byId)) {
    add('measurements', `INSERT INTO measurements (id, uid, date_key, weight_kg, chest_cm, waist_cm, arm_cm, thigh_cm, notes, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [`${uid}_${key}`, uid, m.dateKey, m.weightKg ?? null, m.chestCm ?? null, m.waistCm ?? null,
        m.armCm ?? null, m.thighCm ?? null, m.notes ?? null, m.createdAt ?? Date.now()]);
  }
}
for (const [uid, byId] of entries(db.selfies)) {
  if (!userIds.has(uid)) { skipped.push(`selfies of unknown user ${uid}`); continue; }
  for (const [key, s] of entries(byId)) {
    add('selfies', `INSERT INTO selfies (id, uid, date_key, photo_data, notes, taken_at, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [`${uid}_${key}`, uid, s.dateKey, s.photoData, s.notes ?? null, s.takenAt ?? s.createdAt ?? Date.now(), s.createdAt ?? Date.now()]);
  }
}

if (db.meta?.exerciseSeedVersion != null) {
  add('app_meta', `INSERT INTO app_meta (key, value, updated_at) VALUES ('exerciseSeedVersion', $1::jsonb, $2)
    ON CONFLICT (key) DO UPDATE SET value = GREATEST(app_meta.value::text::int, EXCLUDED.value::text::int)::text::jsonb`,
    [json(db.meta.exerciseSeedVersion), Date.now()]);
}

const counts = {};
for (const [label] of rows) counts[label] = (counts[label] ?? 0) + 1;
console.log(dry ? 'DRY RUN, would write:' : 'Writing:', counts);
skipped.forEach((s) => console.log('SKIPPED', s));
if (dry) process.exit(0);

const url = databaseUrl();
if (!url) { console.error('No DATABASE_URL in env or .dev.vars'); process.exit(1); }
const sql = neon(url);
for (const [label, text, params] of rows) {
  try { await sql.query(text, params); } catch (e) { console.error(`FAILED ${label}:`, e.message); process.exit(1); }
}
console.log('Import complete.');
