import { onValue, push, ref, remove, set, update, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';
import type { Assignment } from '../types';

/** Live subscription to the whole `assignments` tree (filtered client-side). */
export function subscribeToAssignments(callback: (value: unknown) => void): Unsubscribe {
  return onValue(
    ref(db, 'assignments'),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[assignments] subscription error:', error.message),
  );
}

export async function createAssignment(
  input: Omit<Assignment, 'id' | 'createdAt'>,
): Promise<void> {
  const ref_ = push(ref(db, `assignments/${input.dateKey}`));
  const assignment: Assignment = { ...input, id: ref_.key as string, createdAt: Date.now() };
  await set(ref_, assignment);
}

export async function updateAssignment(
  dateKey: string,
  assignmentId: string,
  patch: Partial<Omit<Assignment, 'id' | 'dateKey'>>,
): Promise<void> {
  await update(ref(db, `assignments/${dateKey}/${assignmentId}`), patch);
}

/** Unassign: removes the exercise from the member's day. */
export async function deleteAssignment(dateKey: string, assignmentId: string): Promise<void> {
  await remove(ref(db, `assignments/${dateKey}/${assignmentId}`));
}
