import type {
  Assignment,
  AssignmentsByDate,
  CompletionsByDate,
  CompletionsByUser,
  DailySelfie,
  Exercise,
  ExercisesById,
  Gym,
  GymsById,
  Measurement,
  MeasurementsById,
  Role,
  Routine,
  RoutineItem,
  RoutinesById,
  SelfiesById,
  UserProfile,
} from './index';

export interface AuthResponse {
  token: string;
  profile: UserProfile;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  gymId?: string;
  coachCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserPatch {
  name?: string;
  role?: Role;
  gymId?: string | null;
  coachId?: string | null;
  photoData?: string | null;
}

export interface AssignRoutineRequest {
  routine: Routine;
  memberIds: string[];
  dateKey: string;
  coachId: string;
}

export interface UnassignRoutineRequest {
  dateKey: string;
  routineId: string;
  memberId: string;
}

export interface SaveRoutineRequest {
  id?: string;
  name: string;
  items: RoutineItem[];
}

export interface SeedExercisesRequest {
  createdBy: string;
  language: 'en' | 'es';
}

export interface SyncBatchResponse {
  assignments: AssignmentsByDate;
  exercises: ExercisesById;
  gyms: GymsById;
  users?: Record<string, UserProfile>;
  userProfile?: UserProfile | null;
  coachProfile?: UserProfile | null;
  routines?: RoutinesById;
  allCompletions?: CompletionsByUser;
  userCompletions?: CompletionsByDate;
  measurements?: MeasurementsById;
  selfies?: SelfiesById;
}

export type SyncChannel =
  | 'auth'
  | 'users'
  | 'gyms'
  | 'gymCodes'
  | 'exercises'
  | 'routines'
  | 'assignments'
  | 'completions'
  | 'measurements'
  | 'selfies';

export type UnusedImportsGuard =
  | Assignment
  | DailySelfie
  | Exercise
  | Gym
  | Measurement;
