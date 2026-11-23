import { mutate, subscribeToPath } from '../config/api';
import type { SaveRoutineRequest } from '../types/api';
import type { RoutinesById } from '../types';

/** Live subscription to one coach's own routines. */
export function subscribeToRoutines(
  coachId: string,
  callback: (value: RoutinesById) => void,
): () => void {
  return subscribeToPath('routines', `/api/routines/${encodeURIComponent(coachId)}`, callback);
}

/** Creates a routine (no `id`) or updates an existing one. */
export function saveRoutine(coachId: string, input: SaveRoutineRequest): Promise<void> {
  const base = `/api/routines/${encodeURIComponent(coachId)}`;
  return input.id
    ? mutate('PUT', `${base}/${encodeURIComponent(input.id)}`, input, 'routines')
    : mutate('POST', base, input, 'routines');
}

/** Deleting a routine keeps what was already assigned from it. */
export function deleteRoutine(coachId: string, routineId: string): Promise<void> {
  const path = [coachId, routineId].map(encodeURIComponent).join('/');
  return mutate('DELETE', `/api/routines/${path}`, undefined, 'routines');
}
