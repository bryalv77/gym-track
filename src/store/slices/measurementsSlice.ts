import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { asNumber, asOptionalNumber, asOptionalString, asString, isRecord } from '../../utils/guards';
import type { Measurement, MeasurementsById } from '../../types';

interface MeasurementsState {
  items: MeasurementsById;
}

const initialState: MeasurementsState = { items: {} };

/** Converts the raw `measurements/{uid}` RTDB payload into typed records. */
export function normalizeMeasurements(value: unknown): MeasurementsById {
  const items: MeasurementsById = {};
  if (!isRecord(value)) return items;
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    items[id] = {
      id,
      dateKey: asString(entry.dateKey, ''),
      weightKg: asOptionalNumber(entry.weightKg),
      chestCm: asOptionalNumber(entry.chestCm),
      waistCm: asOptionalNumber(entry.waistCm),
      armCm: asOptionalNumber(entry.armCm),
      thighCm: asOptionalNumber(entry.thighCm),
      notes: asOptionalString(entry.notes),
      createdAt: asNumber(entry.createdAt, 0),
    };
  }
  return items;
}

const measurementsSlice = createSlice({
  name: 'measurements',
  initialState,
  reducers: {
    measurementsUpdated(state, action: PayloadAction<unknown>) {
      state.items = normalizeMeasurements(action.payload);
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
