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
