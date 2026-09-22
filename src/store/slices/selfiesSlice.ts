import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { asNumber, asOptionalString, asString, isRecord } from '../../utils/guards';
import type { DailySelfie, SelfiesById } from '../../types';

interface SelfiesState {
  items: SelfiesById;
}

const initialState: SelfiesState = { items: {} };

/** Converts the raw `selfies/{uid}` RTDB payload into typed records. */
export function normalizeSelfies(value: unknown): SelfiesById {
  const items: SelfiesById = {};
  if (!isRecord(value)) return items;
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    items[id] = {
      id,
      dateKey: asString(entry.dateKey, ''),
      photoData: asString(entry.photoData, ''),
      notes: asOptionalString(entry.notes),
      takenAt: asNumber(entry.takenAt, 0),
      createdAt: asNumber(entry.createdAt, 0),
    };
  }
  return items;
}

const selfiesSlice = createSlice({
  name: 'selfies',
  initialState,
  reducers: {
    selfiesUpdated(state, action: PayloadAction<unknown>) {
      state.items = normalizeSelfies(action.payload);
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
  uid: string,
  dateKey: string,
): DailySelfie | undefined {
  void uid;
  return Object.values(state.selfies.items).find((entry) => entry.dateKey === dateKey);
}
