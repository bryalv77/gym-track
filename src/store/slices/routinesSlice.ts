import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Routine, RoutinesById } from '../../types';

interface RoutinesState {
  byId: RoutinesById;
}

const initialState: RoutinesState = { byId: {} };

const routinesSlice = createSlice({
  name: 'routines',
  initialState,
  reducers: {
    routinesUpdated(state, action: PayloadAction<RoutinesById>) {
      state.byId = action.payload;
    },
  },
});

export const { routinesUpdated } = routinesSlice.actions;
export const routinesReducer = routinesSlice.reducer;

export function selectRoutinesSorted(state: { routines: RoutinesState }): Routine[] {
  return Object.values(state.routines.byId).sort((a, b) => a.name.localeCompare(b.name));
}

export function selectRoutineById(
  state: { routines: RoutinesState },
  id: string,
): Routine | undefined {
  return state.routines.byId[id];
}
