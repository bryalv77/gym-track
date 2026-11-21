import { apiRequest, createPoller, emitSyncInvalidate } from '../config/api';
import type { Assignment, AssignmentsByDate } from '../types';

/** Live subscription to the whole `assignments` tree (filtered client-side). */
export function subscribeToAssignments(callback: (value: unknown) => void): () => void {
  return createPoller(
    'assignments',
    () => apiRequest<AssignmentsByDate>('/api/assignments'),
    callback,
    (error) => console.warn('[assignments] subscription error:', error.message),
  );
}

export async function createAssignment(
  input: Omit<Assignment, 'id' | 'createdAt'>,
): Promise<void> {
  await apiRequest('/api/assignments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  emitSyncInvalidate('assignments');
}

export async function updateAssignment(
  dateKey: string,
  assignmentId: string,
  patch: Partial<Omit<Assignment, 'id' | 'dateKey'>>,
): Promise<void> {
  await apiRequest(
    `/api/assignments/${encodeURIComponent(dateKey)}/${encodeURIComponent(assignmentId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  );
  emitSyncInvalidate('assignments');
}

/** Unassign: removes the exercise from the member's day. */
export async function deleteAssignment(dateKey: string, assignmentId: string): Promise<void> {
  await apiRequest(
    `/api/assignments/${encodeURIComponent(dateKey)}/${encodeURIComponent(assignmentId)}`,
    {
      method: 'DELETE',
    },
  );
  emitSyncInvalidate('assignments');
}
