import { subscribeToPath } from '../config/api';
import type { UserProfile } from '../types';

/** Live subscription to the gym member directory (coach view). */
export function subscribeToUsers(callback: (value: Record<string, UserProfile>) => void): () => void {
  return subscribeToPath('users', '/api/users', callback);
}

/** Live subscription to a single user (e.g. a member's own coach); null when gone. */
export function subscribeToUser(
  uid: string,
  callback: (value: UserProfile | null) => void,
): () => void {
  return subscribeToPath('users', `/api/users/${encodeURIComponent(uid)}`, callback);
}
