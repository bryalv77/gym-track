import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { asNumber, asOptionalString, asString, isRecord } from '../../utils/guards';
import type { Routine, RoutineItem, RoutinesById } from '../../types';

interface RoutinesState {
  byId: RoutinesById;
}

const initialState: RoutinesState = { byId: {} };

function normalizeItems(value: unknown): RoutineItem[] {
  // RTDB returns arrays as arrays, or as objects when some indexes are missing.
  const list = Array.isArray(value)
    ? value
    : isRecord(value)
      ? Object.entries(value)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, item]) => item)
      : [];
  const items: RoutineItem[] = [];
  for (const entry of list) {
    if (!isRecord(entry)) continue;
    const metrics: Record<string, number> = {};
    if (isRecord(entry.metrics)) {
      for (const [key, metric] of Object.entries(entry.metrics)) {
        if (typeof metric === 'number' && Number.isFinite(metric)) metrics[key] = metric;
      }
    }
    const exerciseId = asString(entry.exerciseId, '');
    if (!exerciseId) continue;
    items.push({ exerciseId, metrics, notes: asOptionalString(entry.notes) });
  }
  return items;
}

export function normalizeRoutines(value: unknown): RoutinesById {
  const result: RoutinesById = {};
  if (!isRecord(value)) return result;
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    result[id] = {
      id,
      name: asString(entry.name, 'Routine'),
      coachId: asString(entry.coachId, ''),
      items: normalizeItems(entry.items),
      createdAt: asNumber(entry.createdAt, 0),
    };
  }
  return result;
}

const routinesSlice = createSlice({
  name: 'routines',
  initialState,
  reducers: {
    routinesUpdated(state, action: PayloadAction<unknown>) {
      state.byId = normalizeRoutines(action.payload);
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
