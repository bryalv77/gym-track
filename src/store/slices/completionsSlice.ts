import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { asNumber, isRecord } from '../../utils/guards';
import type { CompletionsByDate, CompletionsByUser, Completion } from '../../types';

interface CompletionsState {
  byUser: CompletionsByUser;
}

const initialState: CompletionsState = { byUser: {} };

function normalizeUserDays(value: unknown): CompletionsByDate {
  const days: CompletionsByDate = {};
  if (!isRecord(value)) return days;
  for (const [dateKey, dayValue] of Object.entries(value)) {
    if (!isRecord(dayValue)) continue;
    const tasks: Record<string, Completion> = {};
    for (const [taskId, entry] of Object.entries(dayValue)) {
      if (!isRecord(entry)) continue;
      tasks[taskId] = { completedAt: asNumber(entry.completedAt, 0) };
    }
    days[dateKey] = tasks;
  }
  return days;
}

/** Converts the whole `completions` RTDB tree (coach subscription). */
export function normalizeAllCompletions(value: unknown): CompletionsByUser {
  const result: CompletionsByUser = {};
  if (!isRecord(value)) return result;
  for (const [uid, userValue] of Object.entries(value)) {
    result[uid] = normalizeUserDays(userValue);
  }
  return result;
}

const completionsSlice = createSlice({
  name: 'completions',
  initialState,
  reducers: {
    /** Coach: replace the full completions tree. */
    completionsUpdated(state, action: PayloadAction<unknown>) {
      state.byUser = normalizeAllCompletions(action.payload);
    },
    /** Member: replace only their own subtree. */
    completionsUserUpdated(
      state,
      action: PayloadAction<{ uid: string; value: unknown }>,
    ) {
      state.byUser[action.payload.uid] = normalizeUserDays(action.payload.value);
    },
  },
});

export const { completionsUpdated, completionsUserUpdated } = completionsSlice.actions;
export const completionsReducer = completionsSlice.reducer;

/* ─── Selectors ───────────────────────────────────────────────────────────── */

export function selectCompletionsForDate(
  state: { completions: CompletionsState },
  uid: string,
  dateKey: string,
): Record<string, Completion> {
  return state.completions.byUser[uid]?.[dateKey] ?? {};
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
