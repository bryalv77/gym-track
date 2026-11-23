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
  language: Lang;
}
