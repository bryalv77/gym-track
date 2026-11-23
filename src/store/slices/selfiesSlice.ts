import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DailySelfie, SelfiesById } from '../../types';

interface SelfiesState {
  items: SelfiesById;
}

const initialState: SelfiesState = { items: {} };

const selfiesSlice = createSlice({
  name: 'selfies',
  initialState,
  reducers: {
    selfiesUpdated(state, action: PayloadAction<SelfiesById>) {
      state.items = action.payload;
    },
  },
});

export const { selfiesUpdated } = selfiesSlice.actions;
export const selfiesReducer = selfiesSlice.reducer;

/** Selfies sorted newest first (by date, then creation time). */
export function selectSelfiesSorted(
  state: { selfies: SelfiesState },
): DailySelfie[] {
  return Object.values(state.selfies.items).sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

/** The selfie for a given day (there should be at most one). */
export function selectSelfieForDate(
  state: { selfies: SelfiesState },
  dateKey: string,
): DailySelfie | undefined {
  return Object.values(state.selfies.items).find((entry) => entry.dateKey === dateKey);
}
