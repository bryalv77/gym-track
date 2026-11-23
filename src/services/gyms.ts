import { mutate, subscribeToPath } from '../config/api';
import type { GymsById } from '../types';

export function subscribeToGyms(callback: (value: GymsById) => void): () => void {
  return subscribeToPath('gyms', '/api/gyms', callback);
}

export function createGym(name: string): Promise<void> {
  return mutate('POST', '/api/gyms', { name: name.trim() }, 'gyms', 'gymCodes');
}

/** Live coach code of one gym (admin only). */
export function subscribeToGymCode(
  gymId: string,
  callback: (code: string | null) => void,
): () => void {
  return subscribeToPath<{ code: string | null }>(
    'gymCodes',
    `/api/gyms/${encodeURIComponent(gymId)}/code`,
    (res) => callback(res.code),
  );
}

/** Replaces the gym's coach code with a fresh one; the old one stops working. */
export function regenerateGymCode(id: string): Promise<void> {
  return mutate('POST', `/api/gyms/${encodeURIComponent(id)}/code/regenerate`, undefined, 'gymCodes');
}

export function renameGym(id: string, name: string): Promise<void> {
  return mutate('PATCH', `/api/gyms/${encodeURIComponent(id)}`, { name: name.trim() }, 'gyms');
}

export function deleteGym(id: string): Promise<void> {
  return mutate('DELETE', `/api/gyms/${encodeURIComponent(id)}`, undefined, 'gyms', 'gymCodes');
}
