import { apiRequest, createPoller, emitSyncInvalidate } from '../config/api';
import type { Routine, RoutineItem, RoutinesById } from '../types';

/** Live subscription to one coach's own routines. */
export function subscribeToRoutines(
  coachId: string,
  callback: (value: unknown) => void,
): () => void {
  return createPoller(
    'routines',
    () => apiRequest<RoutinesById>(`/api/routines/${encodeURIComponent(coachId)}`),
    callback,
    (error) => console.warn('[routines] subscription error:', error.message),
  );
}

/** Clean items so empty notes are left out. */
function cleanItems(items: RoutineItem[]): RoutineItem[] {
  return items.map(({ exerciseId, metrics, notes }) => ({
    exerciseId,
    metrics,
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
  }));
}

/** Creates a routine (no `id`) or updates an existing one. */
export async function saveRoutine(
  coachId: string,
  input: { id?: string; name: string; items: RoutineItem[] },
): Promise<void> {
  const name = input.name.trim();
  const items = cleanItems(input.items);
  if (input.id) {
    await apiRequest(
      `/api/routines/${encodeURIComponent(coachId)}/${encodeURIComponent(input.id)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ id: input.id, name, items }),
      },
    );
  } else {
    await apiRequest(`/api/routines/${encodeURIComponent(coachId)}`, {
      method: 'POST',
      body: JSON.stringify({ name, items }),
    });
  }
  emitSyncInvalidate('routines');
}

/** Deleting a routine keeps what was already assigned from it. */
export async function deleteRoutine(coachId: string, routineId: string): Promise<void> {
  await apiRequest(
    `/api/routines/${encodeURIComponent(coachId)}/${encodeURIComponent(routineId)}`,
    {
      method: 'DELETE',
    },
  );
  emitSyncInvalidate('routines');
}

/**
 * Assigns a routine to members for a day as individual assignments (one per
 * exercise) that carry the routine's name. Assigning the same routine to the
 * same member and day again replaces the earlier copy instead of duplicating.
 */
export async function assignRoutine(params: {
  routine: Routine;
  memberIds: string[];
  dateKey: string;
  coachId: string;
}): Promise<void> {
  await apiRequest(`/api/routines/${encodeURIComponent(params.coachId)}/assign`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  emitSyncInvalidate('assignments');
}

/** Removes every exercise a member received from one routine on one day. */
export async function unassignRoutine(
  dateKey: string,
  routineId: string,
  memberId: string,
): Promise<void> {
  await apiRequest('/api/routines/any/unassign', {
    method: 'POST',
    body: JSON.stringify({ dateKey, routineId, memberId }),
  });
  emitSyncInvalidate('assignments');
}
