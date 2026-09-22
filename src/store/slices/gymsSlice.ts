import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { asNumber, asString, isRecord } from '../../utils/guards';
import type { Gym, GymsById } from '../../types';

interface GymsState {
  byId: GymsById;
}

const initialState: GymsState = { byId: {} };

export function normalizeGyms(value: unknown): GymsById {
  const result: GymsById = {};
  if (!isRecord(value)) return result;
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    result[id] = {
      id,
      name: asString(entry.name, 'Gym'),
      createdAt: asNumber(entry.createdAt, 0),
    };
  }
  return result;
}

const gymsSlice = createSlice({
  name: 'gyms',
  initialState,
  reducers: {
    gymsUpdated(state, action: PayloadAction<unknown>) {
      state.byId = normalizeGyms(action.payload);
    },
  },
});

export const { gymsUpdated } = gymsSlice.actions;
export const gymsReducer = gymsSlice.reducer;

export function selectGymsSorted(state: { gyms: GymsState }): Gym[] {
  return Object.values(state.gyms.byId).sort((a, b) => a.name.localeCompare(b.name));
}

export function selectGymName(state: { gyms: GymsState }, gymId?: string): string {
  if (!gymId) return 'No gym';
  return state.gyms.byId[gymId]?.name ?? 'No gym';
}
