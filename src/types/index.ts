/** Shared domain types for the GymTrack app. */

export type Role = 'admin' | 'coach' | 'member';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  /** Gym this user belongs to (coaches and members). Admins see all gyms. */
  gymId?: string;
  /** Profile photo as a small base64 data URL (avatar-sized). */
  photoData?: string;
  createdAt: number;
}

export interface Gym {
  id: string;
  name: string;
  createdAt: number;
}

export type ExerciseType = 'strength' | 'cardio' | 'other';

/** A measurable input of an exercise (sets, reps, weight, minutes, speed…). */
export interface MetricField {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

/** Library exercise with demo media and type-driven metric fields. */
export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  description?: string;
  /** Image or GIF shown inline */
  imageUrl?: string;
  /** Video link (YouTube, mp4…) opened externally */
  videoUrl?: string;
  /** Intensity used for calorie estimation (MET). Defaults by type. */
  met?: number;
  metricFields: MetricField[];
  createdBy: string;
  createdAt: number;
}

/** One exercise from the library assigned to one member on one day. */
export interface Assignment {
  id: string;
  /** Local calendar day, format YYYY-MM-DD */
  dateKey: string;
  exerciseId: string;
  /** Member uid */
  memberId: string;
  /** Coach uid who assigned it */
  coachId: string;
  /** Values keyed by the exercise's metric field keys */
  metrics: Record<string, number>;
  notes?: string;
  createdAt: number;
}

/** Written when a member marks an assignment as done. */
export interface Completion {
  completedAt: number;
}

/** Body measurement entry logged by a member. */
export interface Measurement {
  id: string;
  /** Local calendar day, format YYYY-MM-DD */
  dateKey: string;
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
  createdAt: number;
}

export type AssignmentsByDate = Record<string, Record<string, Assignment>>;

export type ExercisesById = Record<string, Exercise>;

export type GymsById = Record<string, Gym>;

export type CompletionsByDate = Record<string, Record<string, Completion>>;

export type CompletionsByUser = Record<string, CompletionsByDate>;

export type MeasurementsById = Record<string, Measurement>;
