import type { SqlClient } from './db/client';
import {
  DEFAULT_EXERCISES,
  matchesDefault,
  starterMetricFields,
  type Lang,
} from '../../src/shared/exerciseDefaults';

/** Bump to re-run the seed (e.g. after changing DEFAULT_EXERCISES). */
const SEED_VERSION = 3;

const hasVideo = (url: unknown): url is string => typeof url === 'string' && url.length > 0;

/**
 * Brings the library in line with DEFAULT_EXERCISES: reuses an equivalent exercise
 * a coach already created (repointing assignments off duplicate starter rows),
 * otherwise creates the starter. Returns false when this version already ran.
 */
export async function seedExercises(
  sql: SqlClient,
  createdBy: string,
  language: Lang,
): Promise<boolean> {
  const metaRows = await sql`SELECT value FROM app_meta WHERE key = 'exerciseSeedVersion' LIMIT 1`;
  if (metaRows.length > 0 && Number(metaRows[0]?.value) >= SEED_VERSION) return false;

  const existing = (await sql`SELECT * FROM exercises ORDER BY created_at ASC`) as Record<
    string,
    unknown
  >[];
  const existingById = new Map(existing.map((row) => [String(row.id), row]));
  const duplicates: string[] = [];

  for (const item of DEFAULT_EXERCISES) {
    const original = existing.find(
      (row) =>
        String(row.id) !== item.id && typeof row.name === 'string' && matchesDefault(item, row.name),
    );
    const own = existingById.get(item.id);
    if (original) {
      await sql`
        UPDATE exercises
        SET suggested_order = ${item.order},
            video_url = ${hasVideo(original.video_url) ? original.video_url : item.videoUrl}
        WHERE id = ${String(original.id)}
      `;
      if (own) {
        await sql`UPDATE assignments SET exercise_id = ${String(original.id)} WHERE exercise_id = ${item.id}`;
        duplicates.push(item.id);
      }
      continue;
    }

    const fieldsJson = JSON.stringify(starterMetricFields(item));
    if (own) {
      await sql`
        UPDATE exercises
        SET suggested_order = ${item.order},
            metric_fields = ${fieldsJson}::jsonb,
            video_url = ${hasVideo(own.video_url) ? own.video_url : item.videoUrl}
        WHERE id = ${item.id}
      `;
      continue;
    }

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
        ${Date.now()}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  if (duplicates.length > 0) {
    await sql`DELETE FROM exercises WHERE id = ANY(${duplicates})`;
  }

  await sql`
    INSERT INTO app_meta (key, value, updated_at)
    VALUES ('exerciseSeedVersion', ${JSON.stringify(SEED_VERSION)}::jsonb, ${Date.now()})
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at
  `;
  return true;
}
