import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Assignment, AssignmentsByDate } from '../../types';

interface AssignmentsState {
  byDate: AssignmentsByDate;
}

const initialState: AssignmentsState = { byDate: {} };

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    assignmentsUpdated(state, action: PayloadAction<AssignmentsByDate>) {
      state.byDate = action.payload;
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
