import { mutate, subscribeToPath } from '../config/api';
import type { Exercise, ExercisesById } from '../types';

export function subscribeToExercises(callback: (value: ExercisesById) => void): () => void {
  return subscribeToPath('exercises', '/api/exercises', callback);
}

export function createExercise(input: Omit<Exercise, 'id' | 'createdAt' | 'createdBy'>): Promise<void> {
  return mutate('POST', '/api/exercises', input, 'exercises');
}

export function updateExercise(
  id: string,
  patch: Partial<Omit<Exercise, 'id' | 'createdAt' | 'createdBy'>>,
): Promise<void> {
  return mutate('PATCH', `/api/exercises/${encodeURIComponent(id)}`, patch, 'exercises');
}

export function deleteExercise(id: string): Promise<void> {
  return mutate('DELETE', `/api/exercises/${encodeURIComponent(id)}`, undefined, 'exercises');
}
