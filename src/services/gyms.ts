import { onValue, push, ref, remove, set, update, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';
import { generateCoachCode } from '../utils/coachCode';
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
  // Kept outside `gyms/` (publicly readable) so only admins can read it.
  await set(ref(db, `gymCodes/${gym.id}`), generateCoachCode());
}

/** Live coach code of one gym (admin only). */
export function subscribeToGymCode(
  gymId: string,
  callback: (code: string | null) => void,
): Unsubscribe {
  return onValue(
    ref(db, `gymCodes/${gymId}`),
    (snapshot) => callback(typeof snapshot.val() === 'string' ? snapshot.val() : null),
    (error) => console.warn('[gyms] code subscription error:', error.message),
  );
}

/** Replaces the gym's coach code with a fresh one; the old one stops working. */
export async function regenerateGymCode(id: string): Promise<void> {
  await set(ref(db, `gymCodes/${id}`), generateCoachCode());
}

export async function renameGym(id: string, name: string): Promise<void> {
  await update(ref(db, `gyms/${id}`), { name: name.trim() });
}

export async function deleteGym(id: string): Promise<void> {
  await remove(ref(db, `gyms/${id}`));
  await remove(ref(db, `gymCodes/${id}`));
}
