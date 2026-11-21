import { apiRequest, createPoller, emitSyncInvalidate } from '../config/api';
import type { CompletionsByDate, CompletionsByUser } from '../types';

/** Live subscription to one member's completions (member view). */
export function subscribeToCompletions(
  uid: string,
  callback: (value: unknown) => void,
): () => void {
  return createPoller(
    'completions',
    () => apiRequest<CompletionsByDate>(`/api/completions/${encodeURIComponent(uid)}`),
    callback,
    (error) => console.warn('[completions] subscription error:', error.message),
  );
}

/** Live subscription to every member's completions (coach view). */
export function subscribeToAllCompletions(callback: (value: unknown) => void): () => void {
  return createPoller(
    'completions',
    () => apiRequest<CompletionsByUser>('/api/completions'),
    callback,
    (error) => console.warn('[completions] subscription error:', error.message),
  );
}

/** Marks (or unmarks) a single task as completed. Saves the timestamp. */
export async function setCompletion(
  uid: string,
  dateKey: string,
  taskId: string,
  done: boolean,
): Promise<void> {
  await apiRequest(
    `/api/completions/${encodeURIComponent(uid)}/${encodeURIComponent(dateKey)}/${encodeURIComponent(taskId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ done }),
    },
  );
  emitSyncInvalidate('completions');
}
