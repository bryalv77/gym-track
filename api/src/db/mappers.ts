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
  Role,
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

function toOptStr(val: unknown): string | undefined {
  return typeof val === 'string' && val.length > 0 ? val : undefined;
}

export function mapUserRow(row: Record<string, unknown>): UserProfile {
  const role =
    row.role === 'admin' || row.role === 'coach' || row.role === 'member'
      ? (row.role as Role)
      : 'member';
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

export function mapUsersToRecord(rows: Record<string, unknown>[]): Record<string, UserProfile> {
  const out: Record<string, UserProfile> = {};
  for (const row of rows) {
    const u = mapUserRow(row);
    out[u.uid] = u;
  }
  return out;
}

export function mapGymRow(row: Record<string, unknown>): Gym {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    createdAt: toNum(row.created_at),
  };
}

export function mapGymsToRecord(rows: Record<string, unknown>[]): GymsById {
  const out: GymsById = {};
  for (const row of rows) {
    const g = mapGymRow(row);
    out[g.id] = g;
  }
  return out;
}

export function mapExerciseRow(row: Record<string, unknown>): Exercise {
  const rawType = row.type;
  const type: ExerciseType =
    rawType === 'strength' || rawType === 'cardio' || rawType === 'other' ? rawType : 'strength';
  const description = toOptStr(row.description);
  const imageUrl = toOptStr(row.image_url);
  const videoUrl = toOptStr(row.video_url);
  const met = toOptNum(row.met);
  const suggestedOrder = toOptNum(row.suggested_order);
  const metricFields = Array.isArray(row.metric_fields)
    ? (row.metric_fields as MetricField[])
    : typeof row.metric_fields === 'string'
      ? (JSON.parse(row.metric_fields) as MetricField[])
      : [];

  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    type,
    ...(description ? { description } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    ...(met !== undefined ? { met } : {}),
    ...(suggestedOrder !== undefined ? { suggestedOrder } : {}),
    metricFields,
    createdBy: String(row.created_by ?? ''),
    createdAt: toNum(row.created_at),
  };
}

export function mapExercisesToRecord(rows: Record<string, unknown>[]): Record<string, Exercise> {
  const out: Record<string, Exercise> = {};
  for (const row of rows) {
    const ex = mapExerciseRow(row);
    out[ex.id] = ex;
  }
  return out;
}

export function mapRoutineRow(row: Record<string, unknown>): Routine {
  const items = Array.isArray(row.items)
    ? (row.items as RoutineItem[])
    : typeof row.items === 'string'
      ? (JSON.parse(row.items) as RoutineItem[])
      : [];
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    coachId: String(row.coach_id ?? ''),
    items,
    createdAt: toNum(row.created_at),
  };
}

export function mapRoutinesToRecord(rows: Record<string, unknown>[]): RoutinesById {
  const out: RoutinesById = {};
  for (const row of rows) {
    const r = mapRoutineRow(row);
    out[r.id] = r;
  }
  return out;
}

export function mapAssignmentRow(row: Record<string, unknown>): Assignment {
  const metrics =
    row.metrics && typeof row.metrics === 'object' && !Array.isArray(row.metrics)
      ? (row.metrics as Record<string, number>)
      : typeof row.metrics === 'string'
        ? (JSON.parse(row.metrics) as Record<string, number>)
        : {};
  const notes = toOptStr(row.notes);
  const routineId = toOptStr(row.routine_id);
  const routineName = toOptStr(row.routine_name);
  return {
    id: String(row.id),
    dateKey: String(row.date_key),
    exerciseId: String(row.exercise_id),
    memberId: String(row.member_id),
    coachId: String(row.coach_id),
    metrics,
    ...(notes ? { notes } : {}),
    ...(routineId ? { routineId } : {}),
    ...(routineName ? { routineName } : {}),
    createdAt: toNum(row.created_at),
  };
}

export function mapAssignmentsToByDate(rows: Record<string, unknown>[]): AssignmentsByDate {
  const out: AssignmentsByDate = {};
  for (const row of rows) {
    const a = mapAssignmentRow(row);
    if (!out[a.dateKey]) out[a.dateKey] = {};
    out[a.dateKey][a.id] = a;
  }
  return out;
}

export function mapCompletionsToByDate(rows: Record<string, unknown>[]): CompletionsByDate {
  const out: CompletionsByDate = {};
  for (const row of rows) {
    const dateKey = String(row.date_key);
    const taskId = String(row.task_id);
    if (!out[dateKey]) out[dateKey] = {};
    out[dateKey][taskId] = { completedAt: toNum(row.completed_at) };
  }
  return out;
}

export function mapCompletionsToByUser(rows: Record<string, unknown>[]): CompletionsByUser {
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

export function mapMeasurementRow(row: Record<string, unknown>): Measurement {
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

export function mapMeasurementsToRecord(rows: Record<string, unknown>[]): MeasurementsById {
  const out: MeasurementsById = {};
  for (const row of rows) {
    const m = mapMeasurementRow(row);
    out[m.id] = m;
  }
  return out;
}

export function mapSelfieRow(row: Record<string, unknown>): DailySelfie {
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

export function mapSelfiesToRecord(rows: Record<string, unknown>[]): SelfiesById {
  const out: SelfiesById = {};
  for (const row of rows) {
    const s = mapSelfieRow(row);
    out[s.id] = s;
  }
  return out;
}
