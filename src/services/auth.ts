import {
  ApiError,
  apiRequest,
  emitSyncInvalidate,
  mutate,
  onUnauthorized,
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

onUnauthorized(() => void signOutAccount());

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

/** Loads the signed-in user's profile; falls back to the cached one when offline. */
export async function fetchProfile(): Promise<UserProfile> {
  try {
    const profile = await apiRequest<UserProfile>('/api/auth/me');
    setSessionProfile(profile, false);
    return profile;
  } catch (err) {
    if (currentProfile) return currentProfile;
    throw err;
  }
}

/** Patches a profile (own name/photo, or role/gym/coach as admin; null clears a field). */
export async function updateUserProfile(uid: string, patch: UpdateUserPatch): Promise<UserProfile> {
  const updated = await mutate<UserProfile>(
    'PATCH',
    `/api/users/${encodeURIComponent(uid)}`,
    patch,
    'users',
  );
  if (currentProfile?.uid === uid) setSessionProfile(updated, true);
  return updated;
}

/** Changes the user's password via POST /api/auth/change-password. */
export async function changeUserPassword(
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
