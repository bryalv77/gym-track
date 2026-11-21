import { apiRequest, createPoller } from '../config/api';
import type { UserProfile } from '../types';

/** Live subscription to the gym member directory (coach view). */
export function subscribeToUsers(callback: (value: unknown) => void): () => void {
  return createPoller(
    'users',
    () => apiRequest<Record<string, UserProfile>>('/api/users'),
    callback,
    (error) => console.warn('[users] subscription error:', error.message),
  );
}

/** Live subscription to a single user node (e.g. a member's own coach). */
export function subscribeToUser(uid: string, callback: (value: unknown) => void): () => void {
  return createPoller(
    'users',
    () => apiRequest<UserProfile | null>(`/api/users/${encodeURIComponent(uid)}`),
    callback,
    (error) => console.warn('[users] user subscription error:', error.message),
  );
}
