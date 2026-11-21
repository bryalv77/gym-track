import { apiRequest, emitSyncInvalidate } from '../config/api';
import { currentLang } from './defaultExerciseData';

/**
 * Makes the suggested starter exercises available via the server seed endpoint.
 */
export async function ensureDefaultExercises(createdBy: string): Promise<void> {
  const res = await apiRequest<{ seeded?: boolean }>('/api/exercises/seed', {
    method: 'POST',
    body: JSON.stringify({ createdBy, language: currentLang() }),
  });
  if (res?.seeded) {
    emitSyncInvalidate('exercises', 'assignments');
  }
}
