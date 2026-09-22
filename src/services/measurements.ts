import { onValue, push, ref, remove, set, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';
import type { Measurement } from '../types';

export function subscribeToMeasurements(
  uid: string,
  callback: (value: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, `measurements/${uid}`),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[measurements] subscription error:', error.message),
  );
}

export async function addMeasurement(
  uid: string,
  input: Omit<Measurement, 'id' | 'createdAt'>,
): Promise<void> {
  const entryRef = push(ref(db, `measurements/${uid}`));
  const entry: Measurement = { ...input, id: entryRef.key as string, createdAt: Date.now() };
  await set(entryRef, entry);
}

/** Rewrites an existing measurement entry keeping its original timestamps. */
export async function updateMeasurement(uid: string, entry: Measurement): Promise<void> {
  await set(ref(db, `measurements/${uid}/${entry.id}`), entry);
}

export async function deleteMeasurement(uid: string, id: string): Promise<void> {
  await remove(ref(db, `measurements/${uid}/${id}`));
}
