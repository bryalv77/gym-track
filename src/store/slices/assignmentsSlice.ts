import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { asNumber, asOptionalString, asString, isRecord } from '../../utils/guards';
import type { Assignment, AssignmentsByDate } from '../../types';

interface AssignmentsState {
  byDate: AssignmentsByDate;
}

const initialState: AssignmentsState = { byDate: {} };

function normalizeMetrics(value: unknown): Record<string, number> {
  const metrics: Record<string, number> = {};
  if (isRecord(value)) {
    for (const [key, metricValue] of Object.entries(value)) {
      if (typeof metricValue === 'number' && Number.isFinite(metricValue)) {
        metrics[key] = metricValue;
      }
    }
  }
  return metrics;
}

/** Converts the raw `assignments` RTDB payload into typed records. */
export function normalizeAssignments(value: unknown): AssignmentsByDate {
  const result: AssignmentsByDate = {};
  if (!isRecord(value)) return result;
  for (const [dateKey, dayValue] of Object.entries(value)) {
    if (!isRecord(dayValue)) continue;
    const day: Record<string, Assignment> = {};
    for (const [id, entry] of Object.entries(dayValue)) {
      if (!isRecord(entry)) continue;
      day[id] = {
        id,
        dateKey,
        exerciseId: asString(entry.exerciseId, ''),
        memberId: asString(entry.memberId, ''),
        coachId: asString(entry.coachId, ''),
        metrics: normalizeMetrics(entry.metrics),
        notes: asOptionalString(entry.notes),
        routineId: asOptionalString(entry.routineId),
        routineName: asOptionalString(entry.routineName),
        createdAt: asNumber(entry.createdAt, 0),
      };
    }
    result[dateKey] = day;
  }
  return result;
}

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    assignmentsUpdated(state, action: PayloadAction<unknown>) {
      state.byDate = normalizeAssignments(action.payload);
    },
  },
});

export const { assignmentsUpdated } = assignmentsSlice.actions;
export const assignmentsReducer = assignmentsSlice.reducer;

/* ─── Selectors (structurally typed to avoid store import cycles) ────────── */

/** The member's own assignments for a date. */
export function selectMemberAssignments(
  state: { assignments: AssignmentsState },
  dateKey: string,
  memberId: string,
): Assignment[] {
  const day = state.assignments.byDate[dateKey];
  if (!day) return [];
  return Object.values(day)
    .filter((assignment) => assignment.memberId === memberId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** All assignments for a date, optionally filtered to a member (coach view). */
export function selectAssignmentsForDate(
  state: { assignments: AssignmentsState },
  dateKey: string,
  memberId?: string,
): Assignment[] {
  const day = state.assignments.byDate[dateKey];
  if (!day) return [];
  return Object.values(day)
    .filter((assignment) => !memberId || assignment.memberId === memberId)
    .sort((a, b) => (a.memberId < b.memberId ? -1 : a.memberId > b.memberId ? 1 : a.createdAt - b.createdAt));
}
