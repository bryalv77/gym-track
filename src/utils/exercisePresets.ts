import type { ExerciseType, MetricField } from '../types';

/** Default metric fields per exercise type. Coaches can tweak them per exercise. */
export const EXERCISE_PRESETS: Record<ExerciseType, MetricField[]> = {
  strength: [
    { key: 'sets', label: 'sets', unit: '', min: 1, max: 20, step: 1, defaultValue: 3 },
    { key: 'reps', label: 'reps', unit: '', min: 1, max: 50, step: 1, defaultValue: 10 },
    { key: 'weightKg', label: 'weight', unit: 'kg', min: 0, max: 400, step: 2.5, defaultValue: 40 },
  ],
  cardio: [
    { key: 'minutes', label: 'time', unit: 'min', min: 1, max: 180, step: 1, defaultValue: 20 },
    { key: 'speed', label: 'speed', unit: 'km/h', min: 0, max: 30, step: 0.5, defaultValue: 8 },
  ],
  other: [
    { key: 'minutes', label: 'time', unit: 'min', min: 1, max: 180, step: 1, defaultValue: 10 },
  ],
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  other: 'Other',
};

/** Stable unique metric key derived from its label. */
export function slugifyKey(label: string, existing: string[]): string {
  const base =
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'metric';
  let key = base;
  let counter = 2;
  while (existing.includes(key)) {
    key = `${base}_${counter}`;
    counter += 1;
  }
  return key;
}
