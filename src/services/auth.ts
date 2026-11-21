import {
  ApiError,
  apiRequest,
  emitSyncInvalidate,
  getAuthToken,
  setAuthToken,
} from '../config/api';
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateUserPatch,
} from '../types/api';
import type { Role, UserProfile } from '../types';
import i18n from '../i18n';

export interface AuthUserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
}

let currentProfile: UserProfile | null = null;
const authListeners = new Set<(user: AuthUserSession | null) => void>();

function toSession(profile: UserProfile | null): AuthUserSession | null {
  if (!profile) return null;
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.name,
  };
}

function setSessionProfile(profile: UserProfile | null, notify = true): void {
  currentProfile = profile;
  const session = toSession(profile);
  if (notify) {
    authListeners.forEach((listener) => {
      try {
        listener(session);
      } catch {
        // Ignore individual listener errors
      }
    });
  }
}

/** Maps an auth error code to a localized, human-readable message. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null | undefined)?.code ?? '';
  const key = `common.authErrors.${code}`;
  return i18n.exists(key) ? i18n.t(key) : i18n.t('common.authErrors.default');
}

export async function signIn(email: string, password: string): Promise<void> {
  const body: LoginRequest = {
    email: email.trim(),
    password,
  };
  const res = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  await setAuthToken(res.token);
  setSessionProfile(res.profile, true);
}

export async function registerAccount(params: {
  name: string;
  email: string;
  password: string;
  role: Role;
  gymId?: string;
  /** Gym's coach code; required (and checked by the API) for coaches. */
  coachCode?: string;
}): Promise<void> {
  const body: RegisterRequest = {
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    password: params.password,
    role: params.role,
    ...(params.gymId ? { gymId: params.gymId } : {}),
    ...(params.coachCode ? { coachCode: params.coachCode } : {}),
  };
  const res = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  await setAuthToken(res.token);
  setSessionProfile(res.profile, true);
  emitSyncInvalidate('users');
}

export async function signOutAccount(): Promise<void> {
  await setAuthToken(null);
  setSessionProfile(null, true);
}

export function listenToAuth(
  callback: (user: AuthUserSession | null) => void,
): () => void {
  authListeners.add(callback);
  let active = true;

  void (async () => {
    const token = await getAuthToken();
    if (!active) return;
    if (!token) {
      setSessionProfile(null, false);
      callback(null);
      return;
    }
    try {
      const profile = await apiRequest<UserProfile>('/api/auth/me');
      if (!active) return;
      setSessionProfile(profile, false);
      callback(toSession(profile));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        await setAuthToken(null);
      }
      if (!active) return;
      setSessionProfile(null, false);
      callback(null);
    }
  })();

  return () => {
    active = false;
    authListeners.delete(callback);
  };
}

/** Fetches the current authenticated user's profile from GET /api/auth/me. */
export async function fetchOrCreateProfile(
  user?: AuthUserSession | null,
): Promise<UserProfile> {
  try {
    const profile = await apiRequest<UserProfile>('/api/auth/me');
    setSessionProfile(profile, false);
    return profile;
  } catch (err) {
    if (currentProfile && (!user || currentProfile.uid === user.uid)) {
      return currentProfile;
    }
    throw err;
  }
}

/** Admin updates another user's role, gym, or coach (null removes it). */
export async function updateUserProfile(
  uid: string,
  patch: { role?: Role; gymId?: string | null; coachId?: string | null },
): Promise<void> {
  const body: UpdateUserPatch = {};
  if (patch.role !== undefined) body.role = patch.role;
  if (patch.gymId !== undefined) body.gymId = patch.gymId;
  if (patch.coachId !== undefined) body.coachId = patch.coachId;

  await apiRequest<unknown>(`/api/users/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  emitSyncInvalidate('users');
}

/** User renames themselves via PATCH /api/users/:uid. */
export async function updateUserDisplayName(
  uid: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  const body: UpdateUserPatch = { name: trimmed };
  await apiRequest<unknown>(`/api/users/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (currentProfile?.uid === uid) {
    setSessionProfile({ ...currentProfile, name: trimmed }, true);
  }
  emitSyncInvalidate('users');
}

/** Saves the avatar (small base64 data URL) on the user's own profile. */
export async function updateUserPhoto(
  uid: string,
  photoData: string,
): Promise<void> {
  const body: UpdateUserPatch = { photoData };
  await apiRequest<unknown>(`/api/users/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (currentProfile?.uid === uid) {
    setSessionProfile({ ...currentProfile, photoData }, true);
  }
  emitSyncInvalidate('users');
}

export async function removeUserPhoto(uid: string): Promise<void> {
  const body: UpdateUserPatch = { photoData: null };
  await apiRequest<unknown>(`/api/users/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (currentProfile?.uid === uid) {
    const { photoData: _removed, ...rest } = currentProfile;
    setSessionProfile(rest, true);
  }
  emitSyncInvalidate('users');
}

/** Changes the user's password via POST /api/auth/change-password. */
export async function changeUserPassword(
  _email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const body: ChangePasswordRequest = {
    currentPassword,
    newPassword,
  };
  try {
    await apiRequest<unknown>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    const code = (error as { code?: string } | null | undefined)?.code ?? '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      throw new Error(i18n.t('common.authErrors.currentPasswordIncorrect'));
    }
    throw error;
  }
}
