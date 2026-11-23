import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Gym, GymsById } from '../../types';

interface GymsState {
  byId: GymsById;
}

const initialState: GymsState = { byId: {} };

const gymsSlice = createSlice({
  name: 'gyms',
  initialState,
  reducers: {
    gymsUpdated(state, action: PayloadAction<GymsById>) {
      state.byId = action.payload;
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
