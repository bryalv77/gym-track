import { get, ref, set, update } from 'firebase/database';
import { db } from '../config/firebase';
import { EXERCISE_PRESETS } from './exercisePresets';
import {
  currentLang,
  DEFAULT_EXERCISES,
  matchesDefault,
  type DefaultExercise,
} from './defaultExerciseData';
import type { Exercise } from '../types';

/** Bump when `DEFAULT_EXERCISES` gains entries so they are seeded again. */
const SEED_VERSION = 3;

function metricFieldsFor(defaults: DefaultExercise): Exercise['metricFields'] {
  const values: Record<string, number> = {
    sets: defaults.sets,
    reps: defaults.reps,
    weightKg: defaults.weightKg,
  };
  return EXERCISE_PRESETS.strength.map((field) => ({
    ...field,
    defaultValue: values[field.key] ?? field.defaultValue,
  }));
}

/**
 * Makes the suggested starter exercises available without duplicating the
 * library: an equivalent exercise that already exists (any language, matched
 * by name) is reused and just promoted to "suggested" (keeping its own name,
 * prescription and media, and gaining the demo video only if it has none).
 * Missing ones are created with a demo video. Starter exercises created by an
 * earlier seed that turn out to duplicate an existing one are merged into it:
 * their assignments are repointed, then the duplicate is removed.
 * Runs once per `SEED_VERSION`, so exercises deleted later stay deleted.
 */
export async function ensureDefaultExercises(createdBy: string): Promise<void> {
  const seedRef = ref(db, 'meta/exerciseSeedVersion');
  // The flag is an optimisation: if it can't be read (e.g. rules not yet
  // published) still seed, since the work below is idempotent.
  const seeded = await get(seedRef).then(
    (snapshot) => snapshot.val(),
    () => null,
  );
  if (typeof seeded === 'number' && seeded >= SEED_VERSION) return;

  const existing = ((await get(ref(db, 'exercises'))).val() ?? {}) as Record<
    string,
    { name?: unknown; videoUrl?: unknown; createdAt?: unknown }
  >;
  const entries = Object.entries(existing)
    .filter((entry): entry is [string, { name: string; videoUrl?: unknown; createdAt?: unknown }] =>
      typeof entry[1]?.name === 'string',
    )
    .sort((a, b) => Number(a[1].createdAt ?? 0) - Number(b[1].createdAt ?? 0));

  const language = currentLang();
  const repoint: Record<string, string> = {};
  const duplicates: string[] = [];

  for (const item of DEFAULT_EXERCISES) {
    // Prefer an exercise the coaches already had over the one seeded earlier.
    const original = entries.find(
      ([id, entry]) => id !== item.id && matchesDefault(item, entry.name),
    );
    if (original) {
      const [id, entry] = original;
      await update(ref(db, `exercises/${id}`), {
        suggestedOrder: item.order,
        ...(entry.videoUrl ? {} : { videoUrl: item.videoUrl }),
      });
      if (item.id in existing) {
        repoint[item.id] = id;
        duplicates.push(item.id);
      }
      continue;
    }
    if (item.id in existing) {
      // Seeded earlier and not duplicating anything: refresh prescription + video.
      await update(ref(db, `exercises/${item.id}`), {
        suggestedOrder: item.order,
        metricFields: metricFieldsFor(item),
        ...(existing[item.id].videoUrl ? {} : { videoUrl: item.videoUrl }),
      });
      continue;
    }
    const exercise: Exercise = {
      id: item.id,
      name: item.text[language].name,
      type: 'strength',
      description: item.text[language].description,
      videoUrl: item.videoUrl,
      metricFields: metricFieldsFor(item),
      suggestedOrder: item.order,
      createdBy,
      createdAt: Date.now(),
    };
    await set(ref(db, `exercises/${item.id}`), exercise);
  }

  if (duplicates.length > 0) {
    const assignments = ((await get(ref(db, 'assignments'))).val() ?? {}) as Record<
      string,
      Record<string, { exerciseId?: unknown }>
    >;
    const updates: Record<string, string | null> = {};
    for (const [dateKey, day] of Object.entries(assignments)) {
      for (const [assignmentId, assignment] of Object.entries(day ?? {})) {
        const target = typeof assignment?.exerciseId === 'string' ? repoint[assignment.exerciseId] : undefined;
        if (target) updates[`assignments/${dateKey}/${assignmentId}/exerciseId`] = target;
      }
    }
    for (const id of duplicates) updates[`exercises/${id}`] = null;
    await update(ref(db), updates);
  }

  await set(seedRef, SEED_VERSION).catch((error) =>
    console.warn('[exercises] could not save seed flag:', error),
  );
}
