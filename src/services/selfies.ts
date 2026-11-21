import { apiRequest, createPoller, emitSyncInvalidate } from '../config/api';
import type { DailySelfie, SelfiesById } from '../types';

export function subscribeToSelfies(
  uid: string,
  callback: (value: unknown) => void,
): () => void {
  return createPoller(
    'selfies',
    () => apiRequest<SelfiesById>(`/api/selfies/${encodeURIComponent(uid)}`),
    callback,
    (error) => console.warn('[selfies] subscription error:', error.message),
  );
}

export async function addSelfie(
  uid: string,
  input: Omit<DailySelfie, 'id' | 'createdAt'>,
): Promise<void> {
  await apiRequest(`/api/selfies/${encodeURIComponent(uid)}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  emitSyncInvalidate('selfies');
}

/** Rewrites an existing selfie entry keeping its original timestamps. */
export async function updateSelfie(uid: string, entry: DailySelfie): Promise<void> {
  await apiRequest(
    `/api/selfies/${encodeURIComponent(uid)}/${encodeURIComponent(entry.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(entry),
    },
  );
  emitSyncInvalidate('selfies');
}

export async function deleteSelfie(uid: string, id: string): Promise<void> {
  await apiRequest(
    `/api/selfies/${encodeURIComponent(uid)}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );
  emitSyncInvalidate('selfies');
}
