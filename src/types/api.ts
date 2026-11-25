import type { Role, Routine, RoutineItem, UserProfile } from './index';
import type { Lang } from '../shared/exerciseDefaults';

export const MIN_PASSWORD_LENGTH = 6;

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
  turnstileToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken: string;
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
  language: Lang;
}

/** A plan code a coach shared (coach view). */
export interface ShareCode {
  code: string;
  routineId: string;
  routineName: string;
  createdAt: number;
  expiresAt?: number;
}

/** What a public plan code unlocks: one routine with the exercises it uses. */
export interface GuestPlan {
  coachName: string;
  routine: { name: string; items: RoutineItem[] };
  exercises: Record<string, import('./index').Exercise>;
}
