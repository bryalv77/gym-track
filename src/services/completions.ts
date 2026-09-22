import { onValue, ref, remove, set, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';

/** Live subscription to one member's completions (member view). */
export function subscribeToCompletions(
  uid: string,
  callback: (value: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, `completions/${uid}`),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[completions] subscription error:', error.message),
  );
}

/** Live subscription to every member's completions (coach view). */
export function subscribeToAllCompletions(callback: (value: unknown) => void): Unsubscribe {
  return onValue(
    ref(db, 'completions'),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[completions] subscription error:', error.message),
  );
}

/** Marks (or unmarks) a single task as completed. Saves the timestamp. */
export async function setCompletion(
  uid: string,
  dateKey: string,
  taskId: string,
  done: boolean,
): Promise<void> {
  const taskRef = ref(db, `completions/${uid}/${dateKey}/${taskId}`);
  if (done) {
    await set(taskRef, { completedAt: Date.now() });
  } else {
    await remove(taskRef);
  }
}
