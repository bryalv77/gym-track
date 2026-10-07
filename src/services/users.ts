import { onValue, ref, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';

/** Live subscription to the gym member directory (coach view). */
export function subscribeToUsers(callback: (value: unknown) => void): Unsubscribe {
  return onValue(
    ref(db, 'users'),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[users] subscription error:', error.message),
  );
}

/** Live subscription to a single user node (e.g. a member's own coach). */
export function subscribeToUser(uid: string, callback: (value: unknown) => void): Unsubscribe {
  return onValue(
    ref(db, `users/${uid}`),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[users] user subscription error:', error.message),
  );
}
