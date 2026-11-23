import i18n from '../i18n';
import type { ExerciseType, MetricField } from '../types';

/** Localized display label of an exercise type. */
export function exerciseTypeLabel(type: ExerciseType): string {
  return i18n.t(`library.types.${type}`);
}

const PRESET_LABEL_KEYS: Record<string, string> = {
  sets: 'sets',
  reps: 'reps',
  weight: 'weight',
  time: 'time',
  speed: 'speed',
};

/** Localized display label of a metric field. Stored labels stay as saved
 *  (English preset names); only untouched preset labels are translated. */
export function metricLabel(field: Pick<MetricField, 'label'>): string {
  const key = PRESET_LABEL_KEYS[field.label];
  return key ? i18n.t(`library.metricLabels.${key}`) : field.label;
}

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
