import { onValue, push, ref, remove, set, update, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';
import type { Exercise } from '../types';

export function subscribeToExercises(callback: (value: unknown) => void): Unsubscribe {
  return onValue(
    ref(db, 'exercises'),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[exercises] subscription error:', error.message),
  );
}

export async function createExercise(
  input: Omit<Exercise, 'id' | 'createdAt'>,
): Promise<void> {
  const ref_ = push(ref(db, 'exercises'));
  const exercise: Exercise = { ...input, id: ref_.key as string, createdAt: Date.now() };
  await set(ref_, exercise);
}

export async function updateExercise(
  id: string,
  patch: Partial<Omit<Exercise, 'id' | 'createdAt'>>,
): Promise<void> {
  await update(ref(db, `exercises/${id}`), patch);
}

export async function deleteExercise(id: string): Promise<void> {
  await remove(ref(db, `exercises/${id}`));
}
