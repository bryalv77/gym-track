import { mutate, subscribeToPath } from '../config/api';
import type { DailySelfie, SelfiesById } from '../types';

export function subscribeToSelfies(
  uid: string,
  callback: (value: SelfiesById) => void,
): () => void {
  return subscribeToPath('selfies', `/api/selfies/${encodeURIComponent(uid)}`, callback);
}

export function addSelfie(uid: string, input: Omit<DailySelfie, 'id' | 'createdAt'>): Promise<void> {
  return mutate('POST', `/api/selfies/${encodeURIComponent(uid)}`, input, 'selfies');
}

/** Rewrites an existing selfie entry keeping its original timestamps. */
export function updateSelfie(uid: string, entry: DailySelfie): Promise<void> {
  const path = [uid, entry.id].map(encodeURIComponent).join('/');
  return mutate('PUT', `/api/selfies/${path}`, entry, 'selfies');
}

export function deleteSelfie(uid: string, id: string): Promise<void> {
  const path = [uid, id].map(encodeURIComponent).join('/');
  return mutate('DELETE', `/api/selfies/${path}`, undefined, 'selfies');
}
