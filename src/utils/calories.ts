import type { Exercise } from '../types';

/**
 * Calorie estimation using the MET method (Metabolic Equivalent of Task):
 *   kcal = MET × body weight (kg) × duration (hours)
 *
 * - MET comes from the exercise (coaches tune it in the library); sensible
 *   defaults per type are used when it is not set.
 * - Duration comes from the prescription: cardio "minutes" directly;
 *   strength estimated as sets × (reps × 3 s + 90 s rest).
 * - Cardio intensity metrics refine the MET when present:
 *   speed (km/h) for treadmill, level for bike, strokes/min for rowing.
 */

const DEFAULT_MET: Record<Exercise['type'], number> = {
  strength: 5,
  cardio: 7,
  other: 4,
};

/** Estimated active duration in minutes (including rest for strength). */
export function estimateDurationMinutes(
  exercise: Exercise | undefined,
  metrics: Record<string, number>,
): number {
  const keys = Object.keys(metrics);
  if (keys.includes('minutes')) return metrics.minutes;
  if (keys.includes('seconds')) return metrics.seconds / 60;
  const sets = metrics.sets ?? 3;
  const reps = metrics.reps ?? 10;
  return sets * (reps * 0.05 + 1.5);
}

/** Effective MET for the prescription, refined by cardio intensity metrics. */
export function estimateMet(
  exercise: Exercise | undefined,
  metrics: Record<string, number>,
): number {
  if (!exercise) return DEFAULT_MET.strength;
  let met = exercise.met ?? DEFAULT_MET[exercise.type];
  if (exercise.type === 'cardio' || exercise.type === 'other') {
    if (typeof metrics.speed === 'number' && metrics.speed > 0) {
      // Walking below ~6 km/h is much cheaper per km/h than running.
      met = metrics.speed < 6 ? metrics.speed * 0.85 : Math.max(met, metrics.speed * 1.05);
    } else if (typeof metrics.level === 'number' && metrics.level > 0) {
      met = Math.max(met, 3.5 + metrics.level * 0.45);
    } else if (typeof metrics.spm === 'number' && metrics.spm > 0) {
      met = Math.max(met, 3.5 + metrics.spm * 0.2);
    }
  }
  return met;
}

/** Estimated calories for one assignment, rounded. */
export function estimateCalories(
  exercise: Exercise | undefined,
  metrics: Record<string, number>,
  bodyWeightKg: number,
): number {
  const met = estimateMet(exercise, metrics);
  const minutes = estimateDurationMinutes(exercise, metrics);
  return Math.round(met * bodyWeightKg * (minutes / 60));
}

export const DEFAULT_BODY_WEIGHT_KG = 70;
