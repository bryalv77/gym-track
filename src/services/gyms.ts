import { apiRequest, createPoller, emitSyncInvalidate } from '../config/api';
import type { GymsById } from '../types';

export function subscribeToGyms(callback: (value: unknown) => void): () => void {
  return createPoller(
    'gyms',
    () => apiRequest<GymsById>('/api/gyms'),
    callback,
    (error) => console.warn('[gyms] subscription error:', error.message),
  );
}

export async function createGym(name: string): Promise<void> {
  await apiRequest('/api/gyms', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() }),
  });
  emitSyncInvalidate('gyms', 'gymCodes');
}

/** Live coach code of one gym (admin only). */
export function subscribeToGymCode(
  gymId: string,
  callback: (code: string | null) => void,
): () => void {
  return createPoller(
    'gymCodes',
    async () => {
      const res = await apiRequest<{ code: string | null }>(
        `/api/gyms/${encodeURIComponent(gymId)}/code`,
      );
      return res.code ?? null;
    },
    callback,
    (error) => console.warn('[gyms] code subscription error:', error.message),
  );
}

/** Replaces the gym's coach code with a fresh one; the old one stops working. */
export async function regenerateGymCode(id: string): Promise<void> {
  await apiRequest(`/api/gyms/${encodeURIComponent(id)}/code/regenerate`, {
    method: 'POST',
  });
  emitSyncInvalidate('gymCodes');
}

export async function renameGym(id: string, name: string): Promise<void> {
  await apiRequest(`/api/gyms/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: name.trim() }),
  });
  emitSyncInvalidate('gyms');
}

export async function deleteGym(id: string): Promise<void> {
  await apiRequest(`/api/gyms/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  emitSyncInvalidate('gyms', 'gymCodes');
}
