import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Measurement, MeasurementsById } from '../../types';

interface MeasurementsState {
  items: MeasurementsById;
}

const initialState: MeasurementsState = { items: {} };

const measurementsSlice = createSlice({
  name: 'measurements',
  initialState,
  reducers: {
    measurementsUpdated(state, action: PayloadAction<MeasurementsById>) {
      state.items = action.payload;
    },
  },
});

export const { measurementsUpdated } = measurementsSlice.actions;
export const measurementsReducer = measurementsSlice.reducer;

/** Measurements sorted newest first (by date, then creation time). */
export function selectMeasurementsSorted(
  state: { measurements: MeasurementsState },
): Measurement[] {
  return Object.values(state.measurements.items).sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}
