import { isRole } from '../../../src/types';
import type {
  Assignment,
  AssignmentsByDate,
  CompletionsByDate,
  CompletionsByUser,
  DailySelfie,
  Exercise,
  ExerciseType,
  Gym,
  GymsById,
  Measurement,
  MeasurementsById,
  MetricField,
  Routine,
  RoutineItem,
  RoutinesById,
  SelfiesById,
  UserProfile,
} from '../../../src/types';

function toNum(val: unknown, fallback = 0): number {
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function toOptNum(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : undefined;
}

/** JSON columns arrive parsed from jsonb but as text when written via a string cast. */
function parseJson<T>(val: unknown, fallback: T): T {
  return typeof val === 'string' ? (JSON.parse(val) as T) : ((val as T | null | undefined) ?? fallback);
}

type Row = Record<string, unknown>;

function indexBy<T>(rows: Row[], map: (row: Row) => T, key: (item: T) => string): Record<string, T> {
  const out: Record<string, T> = {};
  for (const row of rows) {
    const item = map(row);
    out[key(item)] = item;
  }
  return out;
}

function toOptStr(val: unknown): string | undefined {
  return typeof val === 'string' && val.length > 0 ? val : undefined;
}

export function mapUserRow(row: Row): UserProfile {
  const role = isRole(row.role) ? row.role : 'member';
  const gymId = toOptStr(row.gym_id);
  const coachId = toOptStr(row.coach_id);
  const photoData = toOptStr(row.photo_data);
  return {
    uid: String(row.uid),
    name: typeof row.name === 'string' && row.name.length > 0 ? row.name : 'Member',
    email: typeof row.email === 'string' ? row.email : '',
    role,
    ...(gymId ? { gymId } : {}),
    ...(coachId ? { coachId } : {}),
    ...(photoData ? { photoData } : {}),
    createdAt: toNum(row.created_at),
  };
}

export function mapUsersToRecord(rows: Row[]): Record<string, UserProfile> {
  return indexBy(rows, mapUserRow, (item) => item.uid);
}

export function mapGymRow(row: Row): Gym {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    createdAt: toNum(row.created_at),
  };
}

export function mapGymsToRecord(rows: Row[]): GymsById {
  return indexBy(rows, mapGymRow, (item) => item.id);
}

export function mapExerciseRow(row: Row): Exercise {
  const rawType = row.type;
  const type: ExerciseType =
    rawType === 'strength' || rawType === 'cardio' || rawType === 'other' ? rawType : 'strength';
  const description = toOptStr(row.description);
  const imageUrl = toOptStr(row.image_url);
  const videoUrl = toOptStr(row.video_url);
  const met = toOptNum(row.met);
  const suggestedOrder = toOptNum(row.suggested_order);
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    type,
    ...(description ? { description } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    ...(met !== undefined ? { met } : {}),
    ...(suggestedOrder !== undefined ? { suggestedOrder } : {}),
    metricFields: parseJson<MetricField[]>(row.metric_fields, []),
    createdBy: String(row.created_by ?? ''),
    createdAt: toNum(row.created_at),
  };
}

export function mapExercisesToRecord(rows: Row[]): Record<string, Exercise> {
  return indexBy(rows, mapExerciseRow, (item) => item.id);
}

export function mapRoutineRow(row: Row): Routine {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    coachId: String(row.coach_id ?? ''),
    items: parseJson<RoutineItem[]>(row.items, []),
    createdAt: toNum(row.created_at),
  };
}

export function mapRoutinesToRecord(rows: Row[]): RoutinesById {
  return indexBy(rows, mapRoutineRow, (item) => item.id);
}

export function mapAssignmentRow(row: Row): Assignment {
  const notes = toOptStr(row.notes);
  const routineId = toOptStr(row.routine_id);
  const routineName = toOptStr(row.routine_name);
  return {
    id: String(row.id),
    dateKey: String(row.date_key),
    exerciseId: String(row.exercise_id),
    memberId: String(row.member_id),
    coachId: String(row.coach_id),
    metrics: parseJson<Record<string, number>>(row.metrics, {}),
    ...(notes ? { notes } : {}),
    ...(routineId ? { routineId } : {}),
    ...(routineName ? { routineName } : {}),
    createdAt: toNum(row.created_at),
  };
}

export function mapAssignmentsToByDate(rows: Row[]): AssignmentsByDate {
  const out: AssignmentsByDate = {};
  for (const row of rows) {
    const a = mapAssignmentRow(row);
    if (!out[a.dateKey]) out[a.dateKey] = {};
    out[a.dateKey][a.id] = a;
  }
  return out;
}

export function mapCompletionsToByDate(rows: Row[]): CompletionsByDate {
  const out: CompletionsByDate = {};
  for (const row of rows) {
    const dateKey = String(row.date_key);
    const taskId = String(row.task_id);
    if (!out[dateKey]) out[dateKey] = {};
    out[dateKey][taskId] = { completedAt: toNum(row.completed_at) };
  }
  return out;
}

export function mapCompletionsToByUser(rows: Row[]): CompletionsByUser {
  const out: CompletionsByUser = {};
  for (const row of rows) {
    const uid = String(row.uid);
    const dateKey = String(row.date_key);
    const taskId = String(row.task_id);
    if (!out[uid]) out[uid] = {};
    if (!out[uid][dateKey]) out[uid][dateKey] = {};
    out[uid][dateKey][taskId] = { completedAt: toNum(row.completed_at) };
  }
  return out;
}

export function mapMeasurementRow(row: Row): Measurement {
  const weightKg = toOptNum(row.weight_kg);
  const chestCm = toOptNum(row.chest_cm);
  const waistCm = toOptNum(row.waist_cm);
  const armCm = toOptNum(row.arm_cm);
  const thighCm = toOptNum(row.thigh_cm);
  const notes = toOptStr(row.notes);
  return {
    id: String(row.id),
    dateKey: String(row.date_key),
    ...(weightKg !== undefined ? { weightKg } : {}),
    ...(chestCm !== undefined ? { chestCm } : {}),
    ...(waistCm !== undefined ? { waistCm } : {}),
    ...(armCm !== undefined ? { armCm } : {}),
    ...(thighCm !== undefined ? { thighCm } : {}),
    ...(notes ? { notes } : {}),
    createdAt: toNum(row.created_at),
  };
}

export function mapMeasurementsToRecord(rows: Row[]): MeasurementsById {
  return indexBy(rows, mapMeasurementRow, (item) => item.id);
}

export function mapSelfieRow(row: Row): DailySelfie {
  const notes = toOptStr(row.notes);
  return {
    id: String(row.id),
    dateKey: String(row.date_key),
    photoData: String(row.photo_data ?? ''),
    ...(notes ? { notes } : {}),
    takenAt: toNum(row.taken_at),
    createdAt: toNum(row.created_at),
  };
}

export function mapSelfiesToRecord(rows: Row[]): SelfiesById {
  return indexBy(rows, mapSelfieRow, (item) => item.id);
}

/** Normalizes routine items before they are stored or copied into assignments. */
export function cleanRoutineItems(items: RoutineItem[] = []): RoutineItem[] {
  return items.map(({ exerciseId, metrics, notes }) => ({
    exerciseId,
    metrics: metrics ?? {},
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
  }));
}
