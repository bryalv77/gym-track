import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { apiRequest } from '../config/api';
import i18n from '../i18n';
import type { GuestPlan } from '../types/api';
import type {
  AssignmentsByDate,
  CompletionsByDate,
  ExercisesById,
  RoutineItem,
  UserProfile,
} from '../types';
import { addDays, toDateKey } from '../utils/date';

/**
 * Guest mode: someone without an account redeems a plan code from their coach.
 * The plan (one routine plus the exercises it uses, images included) is stored
 * on the device, so everything after the first download works offline.
 */

export const GUEST_UID = 'guest';
const STORAGE_KEY = 'fitlance.guest';
const ROUTINE_ID = 'guest-routine';
/** The routine repeats daily; materialise this many days either side of today. */
const WINDOW_DAYS = 60;
export const CODE_LENGTH = 8;

export interface GuestData {
  code: string;
  coachName: string;
  routineName: string;
  items: RoutineItem[];
  exercises: ExercisesById;
  fetchedAt: number;
  /** The coach revoked the code; the cached plan keeps working. */
  revoked?: boolean;
  completions: CompletionsByDate;
}

let data: GuestData | null = null;
let loaded = false;
const listeners = new Set<(value: GuestData | null) => void>();

const emit = () => listeners.forEach((listener) => listener(data));

async function persist(): Promise<void> {
  try {
    if (data) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session still works in memory.
  }
}

/** Uppercases and strips separators so "fit-ab12 cd34" and "AB12CD34" match. */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatCode(code: string): string {
  return code.length === CODE_LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function guestProfile(): UserProfile {
  return {
    uid: GUEST_UID,
    name: i18n.t('guest.name'),
    email: '',
    role: 'member',
    guest: true,
    createdAt: data?.fetchedAt ?? Date.now(),
  };
}

export async function loadGuest(): Promise<GuestData | null> {
  if (loaded) return data;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    data = raw ? (JSON.parse(raw) as GuestData) : null;
  } catch {
    data = null;
  }
  loaded = true;
  return data;
}

export function getGuest(): GuestData | null {
  return data;
}

/** Calls back with the current data now and on every change. */
export function subscribeToGuest(callback: (value: GuestData | null) => void): () => void {
  listeners.add(callback);
  callback(data);
  return () => {
    listeners.delete(callback);
  };
}

/** The daily routine expressed as ordinary assignments, so the member screens work unchanged. */
export function buildGuestAssignments(guest: GuestData, today = new Date()): AssignmentsByDate {
  const byDate: AssignmentsByDate = {};
  for (let offset = -WINDOW_DAYS; offset <= WINDOW_DAYS; offset++) {
    const dateKey = toDateKey(addDays(today, offset));
    const day: AssignmentsByDate[string] = {};
    guest.items.forEach((item, index) => {
      const id = `${dateKey}:${index}:${item.exerciseId}`;
      day[id] = {
        id,
        dateKey,
        exerciseId: item.exerciseId,
        memberId: GUEST_UID,
        coachId: 'guest-coach',
        metrics: item.metrics,
        ...(item.notes ? { notes: item.notes } : {}),
        routineId: ROUTINE_ID,
        routineName: guest.routineName,
        createdAt: index,
      };
    });
    byDate[dateKey] = day;
  }
  return byDate;
}

/* ─── Offline images ──────────────────────────────────────────────────────── */

function hashUrl(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) h = ((h << 5) + h + url.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const imageDir = () => new Directory(Paths.document, 'guest-images');

/** Downloads a remote image once and returns its local URI (the original URL if that fails). */
async function cacheImage(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const ext = /\.(png|jpe?g|gif|webp)(?=$|\?)/i.exec(url)?.[1]?.toLowerCase() ?? 'img';
    const file = new File(imageDir(), `${hashUrl(url)}.${ext}`);
    if (file.exists) return file.uri;
    imageDir().create({ intermediates: true, idempotent: true });
    const saved = await File.downloadFileAsync(url, file);
    return saved.uri;
  } catch {
    return url;
  }
}

async function withCachedImages(exercises: ExercisesById): Promise<ExercisesById> {
  const entries = await Promise.all(
    Object.values(exercises).map(async (exercise) => [
      exercise.id,
      exercise.imageUrl ? { ...exercise, imageUrl: await cacheImage(exercise.imageUrl) } : exercise,
    ] as const),
  );
  return Object.fromEntries(entries);
}

/* ─── Redeem / refresh / clear ────────────────────────────────────────────── */

async function fetchPlan(code: string): Promise<GuestPlan> {
  return apiRequest<GuestPlan>(`/api/guest/${encodeURIComponent(code)}`);
}

/** Downloads the plan for a code (needs a connection) and stores it. Throws ApiError / network errors. */
export async function redeemCode(raw: string): Promise<GuestData> {
  const code = normalizeCode(raw);
  const plan = await fetchPlan(code);
  data = {
    code,
    coachName: plan.coachName,
    routineName: plan.routine.name,
    items: plan.routine.items,
    exercises: await withCachedImages(plan.exercises),
    fetchedAt: Date.now(),
    completions: data?.code === code ? data.completions : {},
  };
  loaded = true;
  await persist();
  emit();
  return data;
}

/** True when the failure was the lack of a connection rather than a bad code. */
export function isOfflineError(error: unknown): boolean {
  return !(error as { status?: number } | null)?.status;
}

/** Silently pulls the latest version of the plan. Offline or failing, the cached copy stays. */
export async function refreshGuest(): Promise<'updated' | 'revoked' | 'offline'> {
  const current = data;
  if (!current) return 'offline';
  try {
    const plan = await fetchPlan(current.code);
    data = {
      ...current,
      coachName: plan.coachName,
      routineName: plan.routine.name,
      items: plan.routine.items,
      exercises: await withCachedImages(plan.exercises),
      fetchedAt: Date.now(),
      revoked: false,
    };
    await persist();
    emit();
    return 'updated';
  } catch (error) {
    if ((error as { status?: number } | null)?.status === 404) {
      data = { ...current, revoked: true };
      await persist();
      emit();
      return 'revoked';
    }
    return 'offline';
  }
}

export async function setGuestCompletion(
  dateKey: string,
  taskId: string,
  done: boolean,
): Promise<void> {
  if (!data) return;
  const day = { ...(data.completions[dateKey] ?? {}) };
  if (done) day[taskId] = { completedAt: Date.now() };
  else delete day[taskId];
  const completions = { ...data.completions };
  if (Object.keys(day).length > 0) completions[dateKey] = day;
  else delete completions[dateKey];
  data = { ...data, completions };
  await persist();
  emit();
}

/** Forgets the plan, local progress and cached images. */
export async function clearGuest(): Promise<void> {
  data = null;
  loaded = true;
  await persist();
  try {
    if (imageDir().exists) imageDir().delete();
  } catch {
    // Best effort.
  }
  emit();
}
