import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { metricLabel } from '../../utils/exercisePresets';
import type { Exercise, ExercisesById, MetricField } from '../../types';

interface ExercisesState {
  byId: ExercisesById;
}

const initialState: ExercisesState = { byId: {} };

const exercisesSlice = createSlice({
  name: 'exercises',
  initialState,
  reducers: {
    exercisesUpdated(state, action: PayloadAction<ExercisesById>) {
      state.byId = action.payload;
    },
  },
});

export const { exercisesUpdated } = exercisesSlice.actions;
export const exercisesReducer = exercisesSlice.reducer;

export function selectExercisesSorted(
  state: { exercises: ExercisesState },
): Exercise[] {
  // Suggested starter exercises first (in their curated order), then A–Z.
  return Object.values(state.exercises.byId).sort((a, b) => {
    const aOrder = a.suggestedOrder ?? Number.POSITIVE_INFINITY;
    const bOrder = b.suggestedOrder ?? Number.POSITIVE_INFINITY;
    if (aOrder !== bOrder) return aOrder < bOrder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
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
