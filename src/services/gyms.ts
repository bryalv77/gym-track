import { onValue, push, ref, remove, set, update, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';
import type { Gym } from '../types';

export function subscribeToGyms(callback: (value: unknown) => void): Unsubscribe {
  return onValue(
    ref(db, 'gyms'),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[gyms] subscription error:', error.message),
  );
}

export async function createGym(name: string): Promise<void> {
  const gymRef = push(ref(db, 'gyms'));
  const gym: Gym = {
    id: gymRef.key as string,
    name: name.trim(),
    createdAt: Date.now(),
  };
  await set(gymRef, gym);
}

export async function renameGym(id: string, name: string): Promise<void> {
  await update(ref(db, `gyms/${id}`), { name: name.trim() });
}

export async function deleteGym(id: string): Promise<void> {
  await remove(ref(db, `gyms/${id}`));
}
