import { get, onValue, push, ref, remove, set, update, type Unsubscribe } from 'firebase/database';
import { db } from '../config/firebase';
import type { Assignment, Routine, RoutineItem } from '../types';

/** Live subscription to one coach's own routines. */
export function subscribeToRoutines(
  coachId: string,
  callback: (value: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, `routines/${coachId}`),
    (snapshot) => callback(snapshot.val()),
    (error) => console.warn('[routines] subscription error:', error.message),
  );
}

/** RTDB rejects `undefined`, so empty notes are left out. */
function cleanItems(items: RoutineItem[]): RoutineItem[] {
  return items.map(({ exerciseId, metrics, notes }) => ({
    exerciseId,
    metrics,
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
  }));
}

/** Creates a routine (no `id`) or updates an existing one. */
export async function saveRoutine(
  coachId: string,
  input: { id?: string; name: string; items: RoutineItem[] },
): Promise<void> {
  const name = input.name.trim();
  const items = cleanItems(input.items);
  if (input.id) {
    await update(ref(db, `routines/${coachId}/${input.id}`), { name, items });
    return;
  }
  const routineRef = push(ref(db, `routines/${coachId}`));
  const routine: Routine = {
    id: routineRef.key as string,
    name,
    coachId,
    items,
    createdAt: Date.now(),
  };
  await set(routineRef, routine);
}

/** Deleting a routine keeps what was already assigned from it. */
export async function deleteRoutine(coachId: string, routineId: string): Promise<void> {
  await remove(ref(db, `routines/${coachId}/${routineId}`));
}

type DayAssignments = Record<string, { routineId?: unknown; memberId?: unknown }>;

async function readDay(dateKey: string): Promise<DayAssignments> {
  return ((await get(ref(db, `assignments/${dateKey}`))).val() ?? {}) as DayAssignments;
}

/**
 * Assigns a routine to members for a day as individual assignments (one per
 * exercise) that carry the routine's name. Assigning the same routine to the
 * same member and day again replaces the earlier copy instead of duplicating.
 */
export async function assignRoutine(params: {
  routine: Routine;
  memberIds: string[];
  dateKey: string;
  coachId: string;
}): Promise<void> {
  const { routine, memberIds, dateKey, coachId } = params;
  const day = await readDay(dateKey);
  const updates: Record<string, Assignment | null> = {};
  for (const [id, entry] of Object.entries(day)) {
    if (entry?.routineId === routine.id && memberIds.includes(String(entry.memberId))) {
      updates[`assignments/${dateKey}/${id}`] = null;
    }
  }
  const now = Date.now();
  for (const memberId of memberIds) {
    routine.items.forEach((item, index) => {
      const id = push(ref(db, `assignments/${dateKey}`)).key as string;
      updates[`assignments/${dateKey}/${id}`] = {
        id,
        dateKey,
        exerciseId: item.exerciseId,
        memberId,
        coachId,
        metrics: item.metrics,
        ...(item.notes ? { notes: item.notes } : {}),
        routineId: routine.id,
        routineName: routine.name,
        // Increasing timestamps keep the routine's exercise order.
        createdAt: now + index,
      };
    });
  }
  await update(ref(db), updates);
}

/** Removes every exercise a member received from one routine on one day. */
export async function unassignRoutine(
  dateKey: string,
  routineId: string,
  memberId: string,
): Promise<void> {
  const day = await readDay(dateKey);
  const updates: Record<string, null> = {};
  for (const [id, entry] of Object.entries(day)) {
    if (entry?.routineId === routineId && entry.memberId === memberId) {
      updates[`assignments/${dateKey}/${id}`] = null;
    }
  }
  if (Object.keys(updates).length > 0) await update(ref(db), updates);
}
