import { mutate, subscribeToPath } from '../config/api';
import type { CompletionsByDate, CompletionsByUser } from '../types';

/** Live subscription to one member's completions (member view). */
export function subscribeToCompletions(
  uid: string,
  callback: (value: CompletionsByDate) => void,
): () => void {
  return subscribeToPath('completions', `/api/completions/${encodeURIComponent(uid)}`, callback);
}

/** Live subscription to every member's completions (coach view). */
export function subscribeToAllCompletions(callback: (value: CompletionsByUser) => void): () => void {
  return subscribeToPath('completions', '/api/completions', callback);
}

/** Marks (or unmarks) a single task as completed. Saves the timestamp. */
export function setCompletion(
  uid: string,
  dateKey: string,
  taskId: string,
  done: boolean,
): Promise<void> {
  const path = [uid, dateKey, taskId].map(encodeURIComponent).join('/');
  return mutate('PUT', `/api/completions/${path}`, { done }, 'completions');
}
