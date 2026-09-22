import { onValue, push, ref, remove, set, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';
import type { DailySelfie } from '../types';

export function subscribeToSelfies(
  uid: string,
  callback: (value: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, `selfies/${uid}`),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[selfies] subscription error:', error.message),
  );
}

export async function addSelfie(
  uid: string,
  input: Omit<DailySelfie, 'id' | 'createdAt'>,
): Promise<void> {
  const entryRef = push(ref(db, `selfies/${uid}`));
  const entry: DailySelfie = { ...input, id: entryRef.key as string, createdAt: Date.now() };
  await set(entryRef, entry);
}

/** Rewrites an existing selfie entry keeping its original timestamps. */
export async function updateSelfie(uid: string, entry: DailySelfie): Promise<void> {
  await set(ref(db, `selfies/${uid}/${entry.id}`), entry);
}

export async function deleteSelfie(uid: string, id: string): Promise<void> {
  await remove(ref(db, `selfies/${uid}/${id}`));
}
