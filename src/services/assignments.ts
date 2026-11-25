import { mutate, subscribeToPath } from '../config/api';
import type { AssignRoutineRequest, UnassignRoutineRequest } from '../types/api';
import type { Assignment, AssignmentsByDate } from '../types';
import { GUEST_UID, assignGuestRoutine, unassignGuestRoutine } from './guest';

/** Live subscription to the whole `assignments` tree (filtered client-side). */
export function subscribeToAssignments(callback: (value: AssignmentsByDate) => void): () => void {
  return subscribeToPath('assignments', '/api/assignments', callback);
}

const assignmentPath = (dateKey: string, id: string) =>
  `/api/assignments/${encodeURIComponent(dateKey)}/${encodeURIComponent(id)}`;

export function createAssignment(input: Omit<Assignment, 'id' | 'createdAt'>): Promise<void> {
  return mutate('POST', '/api/assignments', input, 'assignments');
}

export function updateAssignment(
  dateKey: string,
  assignmentId: string,
  patch: Partial<Omit<Assignment, 'id' | 'dateKey'>>,
): Promise<void> {
  return mutate('PATCH', assignmentPath(dateKey, assignmentId), patch, 'assignments');
}

/** Unassign: removes the exercise from the member's day. */
export function deleteAssignment(dateKey: string, assignmentId: string): Promise<void> {
  return mutate('DELETE', assignmentPath(dateKey, assignmentId), undefined, 'assignments');
}

/**
 * Assigns a routine to members for a day as individual assignments (one per
 * exercise) that carry the routine's name. Assigning the same routine to the
 * same member and day again replaces the earlier copy instead of duplicating.
 */
export function assignRoutine(request: AssignRoutineRequest): Promise<void> {
  if (request.coachId === GUEST_UID) return assignGuestRoutine(request.routine, request.dateKey);
  return mutate('POST', '/api/assignments/routine', request, 'assignments');
}

/** Removes every exercise a member received from one routine on one day. */
export function unassignRoutine(request: UnassignRoutineRequest): Promise<void> {
  if (request.memberId === GUEST_UID) return unassignGuestRoutine(request.routineId, request.dateKey);
  return mutate('POST', '/api/assignments/routine/unassign', request, 'assignments');
}
