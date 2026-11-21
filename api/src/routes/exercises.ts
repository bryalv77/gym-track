import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { Exercise, MetricField } from '../../../src/types';
import type { SeedExercisesRequest } from '../../../src/types/api';
import { getSql, generateId } from '../db/client';
import { mapExerciseRow, mapExercisesToRecord } from '../db/mappers';
import { requireAuth, requireRole } from '../middleware/auth';

const SEED_VERSION = 3;

type Lang = 'en' | 'es' | 'pt' | 'de' | 'fr';
const LANGS: Lang[] = ['en', 'es', 'pt', 'de', 'fr'];

interface DefaultExerciseText {
  name: string;
  description: string;
}

interface DefaultExercise {
  id: string;
  order: number;
  text: Record<Lang, DefaultExerciseText>;
  videoUrl: string;
  match: { has: string[][]; not: string[] };
  sets: number;
  reps: number;
  weightKg: number;
}

const STRENGTH_PRESET_FIELDS: MetricField[] = [
  { key: 'sets', label: 'sets', unit: '', min: 1, max: 20, step: 1, defaultValue: 3 },
  { key: 'reps', label: 'reps', unit: '', min: 1, max: 50, step: 1, defaultValue: 10 },
  { key: 'weightKg', label: 'weight', unit: 'kg', min: 0, max: 400, step: 2.5, defaultValue: 40 },
];

const DEFAULT_EXERCISES: DefaultExercise[] = [
  {
    id: 'default_incline_barbell_bench_press',
    order: 1,
    text: {
      es: {
        name: 'Press inclinado con barra',
        description:
          'Banco a 30–45°. Baja la barra a la parte alta del pecho y empuja sin separar la espalda del banco.',
      },
      en: {
        name: 'Incline Barbell Bench Press',
        description:
          'Bench at 30–45°. Lower the bar to the upper chest and press up keeping your back on the bench.',
      },
      pt: {
        name: 'Supino inclinado com barra',
        description:
          'Banco a 30–45°. Baixe a barra até a parte superior do peito e empurre sem descolar as costas do banco.',
      },
      de: {
        name: 'Schrägbankdrücken mit der Langhantel',
        description:
          'Bank auf 30–45°. Senke die Stange zur oberen Brust und drücke hoch, ohne den Rücken von der Bank zu lösen.',
      },
      fr: {
        name: 'Développé incliné à la barre',
        description:
          'Banc à 30–45°. Descends la barre en haut de la poitrine et pousse sans décoller le dos du banc.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=5kyLUGVq_pk',
    match: {
      has: [
        ['inclinad', 'incline', 'schrag'],
        ['press', 'banca', 'bench', 'supino', 'developpe', 'druecken'],
      ],
      not: ['mancuerna', 'dumbbell', 'halter', 'kurzhantel', 'haltere'],
    },
    sets: 5,
    reps: 15,
    weightKg: 15,
  },
  {
    id: 'default_single_arm_dumbbell_row',
    order: 2,
    text: {
      es: {
        name: 'Remo con mancuerna a una mano',
        description:
          'Apoya una mano y rodilla en el banco. Lleva la mancuerna hacia la cadera con la espalda recta.',
      },
      en: {
        name: 'Single-Arm Dumbbell Row',
        description:
          'One hand and knee on the bench. Pull the dumbbell toward your hip with a flat back.',
      },
      pt: {
        name: 'Remada unilateral com halter',
        description:
          'Apoie uma mão e um joelho no banco. Puxe o halter em direção ao quadril com as costas retas.',
      },
      de: {
        name: 'Einarmiges Kurzhantelrudern',
        description:
          'Eine Hand und ein Knie auf der Bank. Ziehe die Hantel mit geradem Rücken zur Hüfte.',
      },
      fr: {
        name: 'Rowing haltère à un bras',
        description:
          'Une main et un genou sur le banc. Tire l’haltère vers la hanche en gardant le dos plat.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=fURsHPHgssI',
    match: {
      has: [
        ['remo', 'row', 'remada', 'rudern'],
        ['mancuerna', 'dumbbell', 'halter', 'kurzhantel', 'haltere'],
      ],
      not: ['barra', 'barbell', 'langhantel'],
    },
    sets: 5,
    reps: 15,
    weightKg: 7,
  },
  {
    id: 'default_dumbbell_biceps_curl',
    order: 3,
    text: {
      es: {
        name: 'Curl de bíceps con mancuernas',
        description:
          'Codos pegados al torso. Sube controlado y baja despacio sin balancear el cuerpo.',
      },
      en: {
        name: 'Dumbbell Biceps Curl',
        description:
          'Elbows tucked at your sides. Curl up under control and lower slowly without swinging.',
      },
      pt: {
        name: 'Rosca bíceps com halteres',
        description:
          'Cotovelos junto ao tronco. Suba com controle e desça devagar sem balançar o corpo.',
      },
      de: {
        name: 'Bizepscurls mit Kurzhanteln',
        description:
          'Ellbogen am Körper. Kontrolliert hochführen und langsam absenken, ohne zu schwingen.',
      },
      fr: {
        name: 'Curl biceps aux haltères',
        description:
          'Coudes collés au corps. Monte de façon contrôlée et redescends lentement sans te balancer.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=Jfp4b5Olc7A',
    match: {
      has: [
        ['curl', 'rosca'],
        ['mancuerna', 'dumbbell', 'halter', 'kurzhantel', 'haltere'],
      ],
      not: ['martillo', 'hammer', 'martelo', 'concentr', 'predicador', 'preacher', 'inclin'],
    },
    sets: 5,
    reps: 15,
    weightKg: 7,
  },
  {
    id: 'default_barbell_deadlift',
    order: 4,
    text: {
      es: {
        name: 'Peso muerto con barra',
        description:
          'Barra pegada a las piernas, espalda neutra. Empuja el suelo con las piernas y extiende la cadera.',
      },
      en: {
        name: 'Barbell Deadlift',
        description:
          'Bar close to your legs, neutral spine. Drive through the floor and extend your hips.',
      },
      pt: {
        name: 'Levantamento terra com barra',
        description:
          'Barra junto às pernas, coluna neutra. Empurre o chão com as pernas e estenda o quadril.',
      },
      de: {
        name: 'Kreuzheben mit der Langhantel',
        description:
          'Stange nah an den Beinen, neutrale Wirbelsäule. Drücke dich vom Boden ab und strecke die Hüfte.',
      },
      fr: {
        name: 'Soulevé de terre à la barre',
        description:
          'Barre près des jambes, dos neutre. Pousse dans le sol et étends les hanches.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=4i6RTcFhrKc',
    match: {
      has: [['peso muerto', 'deadlift', 'levantamiento terra', 'kreuzheben', 'souleve']],
      not: [
        'rumano',
        'romanian',
        'rdl',
        'sumo',
        'mancuerna',
        'dumbbell',
        'rigid',
        'stiff',
        'trap',
        'hex',
        'una pierna',
        'single',
      ],
    },
    sets: 5,
    reps: 15,
    weightKg: 15,
  },
  {
    id: 'default_barbell_back_squat',
    order: 5,
    text: {
      es: {
        name: 'Sentadilla trasera con barra',
        description:
          'Barra sobre los trapecios, pecho arriba. Baja hasta al menos paralelo y sube empujando con los talones.',
      },
      en: {
        name: 'Barbell Back Squat',
        description:
          'Bar on your upper back, chest up. Squat to at least parallel and drive up through your heels.',
      },
      pt: {
        name: 'Agachamento livre com barra',
        description:
          'Barra sobre os trapézios, peito aberto. Desça até pelo menos paralelo e suba empurrando com os calcanhares.',
      },
      de: {
        name: 'Kniebeuge mit der Langhantel',
        description:
          'Stange auf dem oberen Rücken, Brust raus. Beuge mindestens bis parallel und drücke dich über die Fersen hoch.',
      },
      fr: {
        name: 'Squat arrière à la barre',
        description:
          'Barre sur le haut du dos, poitrine haute. Descends au moins à la parallèle et remonte en poussant sur les talons.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=8PMjqgR8Wa8',
    match: {
      has: [['sentadilla', 'squat', 'agachamento', 'kniebeuge']],
      not: [
        'frontal',
        'front',
        'goblet',
        'bulgar',
        'split',
        'hack',
        'sumo',
        'mancuerna',
        'dumbbell',
        'salto',
        'jump',
        'overhead',
        'pistol',
        'zercher',
        'smith',
        'multipower',
        'cajon',
        'box',
        'una pierna',
      ],
    },
    sets: 5,
    reps: 15,
    weightKg: 15,
  },
  {
    id: 'default_dumbbell_pullover',
    order: 6,
    text: {
      es: {
        name: 'Pullover con mancuerna',
        description:
          'Tumbado en el banco, baja la mancuerna detrás de la cabeza con los brazos casi rectos y vuelve al pecho.',
      },
      en: {
        name: 'Dumbbell Pullover',
        description:
          'Lying on a bench, lower the dumbbell behind your head with nearly straight arms and return over the chest.',
      },
      pt: {
        name: 'Pullover com halter',
        description:
          'Deitado no banco, baixe o halter atrás da cabeça com os braços quase estendidos e volte sobre o peito.',
      },
      de: {
        name: 'Kurzhantel-Pullover',
        description:
          'Auf der Bank liegend, senke die Hantel mit fast gestreckten Armen hinter den Kopf und führe sie zurück über die Brust.',
      },
      fr: {
        name: 'Pull-over à l’haltère',
        description:
          'Allongé sur un banc, descends l’haltère derrière la tête, bras presque tendus, puis ramène-le au-dessus de la poitrine.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=tcHaHIQStsk',
    match: {
      has: [['pullover', 'pull over']],
      not: ['polea', 'cable', 'barra', 'barbell', 'maquina', 'machine'],
    },
    sets: 5,
    reps: 15,
    weightKg: 7,
  },
];

function plain(value: string): string {
  return ` ${value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

function matchesDefault(item: DefaultExercise, name: string): boolean {
  const text = plain(name);
  return (
    item.match.has.every((group) => group.some((word) => text.includes(plain(word).trim()))) &&
    !item.match.not.some((word) => text.includes(plain(word).trim()))
  );
}

function metricFieldsFor(defaults: DefaultExercise): MetricField[] {
  const values: Record<string, number> = {
    sets: defaults.sets,
    reps: defaults.reps,
    weightKg: defaults.weightKg,
  };
  return STRENGTH_PRESET_FIELDS.map((field) => ({
    ...field,
    defaultValue: values[field.key] ?? field.defaultValue,
  }));
}

export const exercisesRouter = new Hono<AppEnv>();

exercisesRouter.use('*', requireAuth);

exercisesRouter.get('/', async (c) => {
  const sql = getSql(c.env);
  const rows = await sql`SELECT * FROM exercises`;
  return c.json(mapExercisesToRecord(rows as Record<string, unknown>[]));
});

exercisesRouter.post('/seed', requireRole('admin', 'coach'), async (c) => {
  const body = await c.req.json<SeedExercisesRequest>().catch(() => ({
    createdBy: c.get('user').uid,
    language: 'en' as const,
  }));
  const createdBy = body.createdBy || c.get('user').uid;
  const rawLang = typeof body.language === 'string' ? (body.language.slice(0, 2) as Lang) : 'en';
  const language: Lang = LANGS.includes(rawLang) ? rawLang : 'en';

  const sql = getSql(c.env);
  const metaRows =
    await sql`SELECT value FROM app_meta WHERE key = 'exerciseSeedVersion' LIMIT 1`;
  if (metaRows.length > 0 && Number(metaRows[0]?.value) >= SEED_VERSION) {
    return c.json({ seeded: false });
  }

  const existingRows = (await sql`SELECT * FROM exercises ORDER BY created_at ASC`) as Record<
    string,
    unknown
  >[];
  const existingById: Record<string, Record<string, unknown>> = {};
  const entries: Array<[string, { name: string; videoUrl?: string }]> = [];

  for (const row of existingRows) {
    const id = String(row.id);
    existingById[id] = row;
    if (typeof row.name === 'string') {
      entries.push([
        id,
        {
          name: row.name,
          videoUrl:
            typeof row.video_url === 'string' && row.video_url.length > 0
              ? row.video_url
              : undefined,
        },
      ]);
    }
  }

  const repoint: Record<string, string> = {};
  const duplicates: string[] = [];

  for (const item of DEFAULT_EXERCISES) {
    const original = entries.find(
      ([id, entry]) => id !== item.id && matchesDefault(item, entry.name),
    );
    if (original) {
      const [id, entry] = original;
      const nextVideoUrl = entry.videoUrl ? entry.videoUrl : item.videoUrl;
      await sql`
        UPDATE exercises
        SET suggested_order = ${item.order},
            video_url = ${nextVideoUrl}
        WHERE id = ${id}
      `;
      if (item.id in existingById) {
        repoint[item.id] = id;
        duplicates.push(item.id);
      }
      continue;
    }

    if (item.id in existingById) {
      const existingRow = existingById[item.id];
      const existingVideo =
        typeof existingRow.video_url === 'string' && existingRow.video_url.length > 0
          ? existingRow.video_url
          : item.videoUrl;
      const fieldsJson = JSON.stringify(metricFieldsFor(item));
      await sql`
        UPDATE exercises
        SET suggested_order = ${item.order},
            metric_fields = ${fieldsJson}::jsonb,
            video_url = ${existingVideo}
        WHERE id = ${item.id}
      `;
      continue;
    }

    const fieldsJson = JSON.stringify(metricFieldsFor(item));
    const createdAt = Date.now();
    await sql`
      INSERT INTO exercises (
        id, name, type, description, image_url, video_url, met,
        suggested_order, metric_fields, created_by, created_at
      ) VALUES (
        ${item.id},
        ${item.text[language].name},
        'strength',
        ${item.text[language].description},
        ${null},
        ${item.videoUrl},
        ${null},
        ${item.order},
        ${fieldsJson}::jsonb,
        ${createdBy},
        ${createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        description = EXCLUDED.description,
        video_url = EXCLUDED.video_url,
        suggested_order = EXCLUDED.suggested_order,
        metric_fields = EXCLUDED.metric_fields
    `;
  }

  if (duplicates.length > 0) {
    for (const [fromId, toId] of Object.entries(repoint)) {
      await sql`UPDATE assignments SET exercise_id = ${toId} WHERE exercise_id = ${fromId}`;
    }
    await sql`DELETE FROM exercises WHERE id = ANY(${duplicates})`;
  }

  const now = Date.now();
  await sql`
    INSERT INTO app_meta (key, value, updated_at)
    VALUES ('exerciseSeedVersion', '3'::jsonb, ${now})
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at
  `;

  return c.json({ seeded: true });
});

exercisesRouter.post('/', requireRole('admin', 'coach'), async (c) => {
  const body = await c.req.json<Omit<Exercise, 'id' | 'createdAt'> & { id?: string }>();
  const id = body.id || generateId();
  const createdAt = Date.now();
  const createdBy = body.createdBy || c.get('user').uid;
  const metricFieldsJson = JSON.stringify(body.metricFields ?? []);

  const sql = getSql(c.env);
  const rows = await sql`
    INSERT INTO exercises (
      id, name, type, description, image_url, video_url, met,
      suggested_order, metric_fields, created_by, created_at
    ) VALUES (
      ${id},
      ${body.name},
      ${body.type},
      ${body.description ?? null},
      ${body.imageUrl ?? null},
      ${body.videoUrl ?? null},
      ${body.met ?? null},
      ${body.suggestedOrder ?? null},
      ${metricFieldsJson}::jsonb,
      ${createdBy},
      ${createdAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      video_url = EXCLUDED.video_url,
      met = EXCLUDED.met,
      suggested_order = EXCLUDED.suggested_order,
      metric_fields = EXCLUDED.metric_fields,
      created_by = EXCLUDED.created_by
    RETURNING *
  `;

  return c.json(mapExerciseRow(rows[0] as Record<string, unknown>), 201);
});

exercisesRouter.patch('/:id', requireRole('admin', 'coach'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<
    Partial<{
      name: string;
      type: Exercise['type'];
      description: string | null;
      imageUrl: string | null;
      videoUrl: string | null;
      met: number | null;
      suggestedOrder: number | null;
      metricFields: MetricField[];
    }>
  >();

  const sql = getSql(c.env);
  const existingRows = await sql`SELECT * FROM exercises WHERE id = ${id} LIMIT 1`;
  if (existingRows.length === 0) {
    return c.json({ error: 'Exercise not found' }, 404);
  }

  const existing = existingRows[0] as Record<string, unknown>;
  const name = 'name' in body && body.name !== undefined ? body.name : String(existing.name ?? '');
  const type =
    'type' in body && body.type !== undefined ? body.type : String(existing.type ?? 'strength');
  const description =
    'description' in body ? (body.description ?? null) : (existing.description ?? null);
  const imageUrl = 'imageUrl' in body ? (body.imageUrl ?? null) : (existing.image_url ?? null);
  const videoUrl = 'videoUrl' in body ? (body.videoUrl ?? null) : (existing.video_url ?? null);
  const met = 'met' in body ? (body.met ?? null) : (existing.met ?? null);
  const suggestedOrder =
    'suggestedOrder' in body ? (body.suggestedOrder ?? null) : (existing.suggested_order ?? null);
  const metricFields =
    'metricFields' in body && body.metricFields !== undefined
      ? body.metricFields
      : Array.isArray(existing.metric_fields)
        ? existing.metric_fields
        : typeof existing.metric_fields === 'string'
          ? JSON.parse(existing.metric_fields)
          : [];

  const updated = await sql`
    UPDATE exercises
    SET name = ${name},
        type = ${type},
        description = ${description},
        image_url = ${imageUrl},
        video_url = ${videoUrl},
        met = ${met},
        suggested_order = ${suggestedOrder},
        metric_fields = ${JSON.stringify(metricFields)}::jsonb
    WHERE id = ${id}
    RETURNING *
  `;

  return c.json(mapExerciseRow(updated[0] as Record<string, unknown>));
});

exercisesRouter.delete('/:id', requireRole('admin', 'coach'), async (c) => {
  const id = c.req.param('id');
  const sql = getSql(c.env);
  await sql`DELETE FROM exercises WHERE id = ${id}`;
  return c.json({ ok: true });
});
