import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { metricLabel } from '../../utils/exercisePresets';
import { asNumber, asOptionalString, asString, isRecord } from '../../utils/guards';
import type { Exercise, ExercisesById, ExerciseType, MetricField } from '../../types';

interface ExercisesState {
  byId: ExercisesById;
}

const initialState: ExercisesState = { byId: {} };

const VALID_TYPES: ExerciseType[] = ['strength', 'cardio', 'other'];

function normalizeFields(value: unknown): MetricField[] {
  if (!Array.isArray(value)) return [];
  const fields: MetricField[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    fields.push({
      key: asString(item.key, ''),
      label: asString(item.label, ''),
      unit: asString(item.unit, ''),
      min: asNumber(item.min, 0),
      max: asNumber(item.max, 999),
      step: asNumber(item.step, 1) || 1,
      defaultValue: asNumber(item.defaultValue, 1),
    });
  }
  return fields.filter((field) => field.key.length > 0);
}

export function normalizeExercises(value: unknown): ExercisesById {
  const result: ExercisesById = {};
  if (!isRecord(value)) return result;
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    const type = VALID_TYPES.includes(entry.type as ExerciseType)
      ? (entry.type as ExerciseType)
      : 'other';
    result[id] = {
      id,
      name: asString(entry.name, 'Exercise'),
      type,
      description: asOptionalString(entry.description),
      imageUrl: asOptionalString(entry.imageUrl),
      videoUrl: asOptionalString(entry.videoUrl),
      ...(typeof entry.met === 'number' && Number.isFinite(entry.met) ? { met: entry.met } : {}),
      metricFields: normalizeFields(entry.metricFields),
      createdBy: asString(entry.createdBy, ''),
      createdAt: asNumber(entry.createdAt, 0),
    };
  }
  return result;
}

const exercisesSlice = createSlice({
  name: 'exercises',
  initialState,
  reducers: {
    exercisesUpdated(state, action: PayloadAction<unknown>) {
      state.byId = normalizeExercises(action.payload);
    },
  },
});

export const { exercisesUpdated } = exercisesSlice.actions;
export const exercisesReducer = exercisesSlice.reducer;

export function selectExercisesSorted(
  state: { exercises: ExercisesState },
): Exercise[] {
  return Object.values(state.exercises.byId).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function selectExerciseById(
  state: { exercises: ExercisesState },
  id: string,
): Exercise | undefined {
  return state.exercises.byId[id];
}

/** Human summary of assignment metrics, e.g. "3 sets · 9 reps · 80 kg". */
export function formatMetrics(
  fields: MetricField[],
  metrics: Record<string, number>,
): string {
  return fields
    .map((field) => {
      const value = metrics[field.key];
      if (field.unit.length > 0) return `${value ?? '—'} ${field.unit}`;
      return `${value ?? '—'} ${metricLabel(field)}`.trim();
    })
    .join(' · ');
}
