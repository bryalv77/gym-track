import { apiRequest, createPoller, emitSyncInvalidate } from '../config/api';
import type { Exercise, ExercisesById } from '../types';

export function subscribeToExercises(callback: (value: unknown) => void): () => void {
  return createPoller(
    'exercises',
    () => apiRequest<ExercisesById>('/api/exercises'),
    callback,
    (error) => console.warn('[exercises] subscription error:', error.message),
  );
}

export async function createExercise(
  input: Omit<Exercise, 'id' | 'createdAt'>,
): Promise<void> {
  await apiRequest('/api/exercises', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  emitSyncInvalidate('exercises');
}

export async function updateExercise(
  id: string,
  patch: Partial<Omit<Exercise, 'id' | 'createdAt'>>,
): Promise<void> {
  await apiRequest(`/api/exercises/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  emitSyncInvalidate('exercises');
}

export async function deleteExercise(id: string): Promise<void> {
  await apiRequest(`/api/exercises/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  emitSyncInvalidate('exercises');
}
