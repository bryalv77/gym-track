import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CompletionsByDate, CompletionsByUser, Completion } from '../../types';

interface CompletionsState {
  byUser: CompletionsByUser;
}

const initialState: CompletionsState = { byUser: {} };

const completionsSlice = createSlice({
  name: 'completions',
  initialState,
  reducers: {
    completionsUpdated(state, action: PayloadAction<CompletionsByUser>) {
      state.byUser = action.payload;
    },
    completionsUserUpdated(
      state,
      action: PayloadAction<{ uid: string; value: CompletionsByDate }>,
    ) {
      state.byUser[action.payload.uid] = action.payload.value;
    },
  },
});

export const { completionsUpdated, completionsUserUpdated } = completionsSlice.actions;
export const completionsReducer = completionsSlice.reducer;

/* ─── Selectors ───────────────────────────────────────────────────────────── */

// Stable reference so selectors don't return a fresh object each call.
export const NO_COMPLETIONS: Record<string, Completion> = {};

export function selectCompletionsForDate(
  state: { completions: CompletionsState },
  uid: string,
  dateKey: string,
): Record<string, Completion> {
  return state.completions.byUser[uid]?.[dateKey] ?? NO_COMPLETIONS;
}

export function selectCompletionDays(
  state: { completions: CompletionsState },
  uid: string,
): CompletionsByDate {
  return state.completions.byUser[uid] ?? {};
}

/** Completed-exercise count for one user across a list of date keys. */
export function selectCompletionCountForDates(
  state: { completions: CompletionsState },
  uid: string,
  dateKeys: string[],
): number {
  const days = state.completions.byUser[uid];
  if (!days) return 0;
  return dateKeys.reduce(
    (total, dateKey) => total + Object.keys(days[dateKey] ?? {}).length,
    0,
  );
}

/** How many users completed a given task on a given day (coach view). */
export function selectTaskCompletionCount(
  state: { completions: CompletionsState },
  dateKey: string,
  taskId: string,
): number {
  return Object.values(state.completions.byUser).reduce(
    (total, day) => total + (day[dateKey]?.[taskId] != null ? 1 : 0),
    0,
  );
}
