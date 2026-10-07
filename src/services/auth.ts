import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
  type User,
} from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import { db, firebaseAuth } from '../config/firebase';
import type { Role, UserProfile } from '../types';
import i18n from '../i18n';

/** Maps a Firebase AuthError code to a localized, human-readable message. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null | undefined)?.code ?? '';
  const key = `common.authErrors.${code}`;
  return i18n.exists(key) ? i18n.t(key) : i18n.t('common.authErrors.default');
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function registerAccount(params: {
  name: string;
  email: string;
  password: string;
  role: Role;
  gymId?: string;
  /** Gym's coach code; required (and checked by the database rules) for coaches. */
  coachCode?: string;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();
  const { user } = await createUserWithEmailAndPassword(firebaseAuth, email, params.password);
  await updateProfile(user, { displayName: name });
  const profile: UserProfile = {
    uid: user.uid,
    name,
    email,
    role: params.role,
    ...(params.gymId ? { gymId: params.gymId } : {}),
    createdAt: Date.now(),
  };
  if (params.role !== 'coach') {
    await set(ref(db, `users/${user.uid}`), profile);
    return;
  }
  try {
    await set(ref(db, `users/${user.uid}`), { ...profile, coachCode: params.coachCode });
  } catch {
    // Rules rejected the code: don't leave an auth account that would silently become a member.
    await user.delete().catch(() => undefined);
    throw Object.assign(new Error('Invalid coach code'), { code: 'auth/invalid-coach-code' });
  }
  // The code was only needed for the rules check; don't keep it on the profile.
  await set(ref(db, `users/${user.uid}/coachCode`), null);
}

export async function signOutAccount(): Promise<void> {
  await signOut(firebaseAuth);
}

export function listenToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
}

/** Reads users/{uid} and creates a default member profile if none exists. */
export async function fetchOrCreateProfile(user: User): Promise<UserProfile> {
  const snapshot = await get(ref(db, `users/${user.uid}`));
  const value = snapshot.val() as Partial<UserProfile> | null;
  const existingRole = value?.role;
  const isValidRole =
    existingRole === 'admin' || existingRole === 'coach' || existingRole === 'member';
  if (value && typeof value.uid === 'string' && isValidRole) {
    return {
      uid: value.uid,
      name: value.name ?? 'Member',
      email: value.email ?? user.email ?? '',
      role: existingRole,
      ...(typeof value.gymId === 'string' && value.gymId.length > 0 ? { gymId: value.gymId } : {}),
      ...(typeof value.coachId === 'string' && value.coachId.length > 0
        ? { coachId: value.coachId }
        : {}),
      ...(typeof value.photoData === 'string' && value.photoData.length > 0
        ? { photoData: value.photoData }
        : {}),
      createdAt: value.createdAt ?? 0,
    };
  }
  const profile: UserProfile = {
    uid: user.uid,
    name: user.displayName ?? user.email?.split('@')[0] ?? 'Member',
    email: user.email ?? '',
    role: 'member',
    createdAt: Date.now(),
  };
  await set(ref(db, `users/${user.uid}`), profile);
  return profile;
}

/** Admin updates another user's role and/or gym (null gymId removes it). */
export async function updateUserProfile(
  uid: string,
  patch: { role?: Role; gymId?: string | null; coachId?: string | null },
): Promise<void> {
  if (patch.role) {
    await set(ref(db, `users/${uid}/role`), patch.role);
  }
  if (patch.gymId !== undefined) {
    // set(null) removes the node in Realtime Database
    await set(ref(db, `users/${uid}/gymId`), patch.gymId);
  }
  if (patch.coachId !== undefined) {
    await set(ref(db, `users/${uid}/coachId`), patch.coachId);
  }
}

/** User renames themselves: Firebase displayName + their profile node. */
export async function updateUserDisplayName(uid: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!firebaseAuth.currentUser) throw new Error('Not signed in');
  await updateProfile(firebaseAuth.currentUser, { displayName: trimmed });
  await set(ref(db, `users/${uid}/name`), trimmed);
}

/** Saves the avatar (small base64 data URL) on the user's own profile. */
export async function updateUserPhoto(uid: string, photoData: string): Promise<void> {
  await set(ref(db, `users/${uid}/photoData`), photoData);
}

export async function removeUserPhoto(uid: string): Promise<void> {
  await set(ref(db, `users/${uid}/photoData`), null);
}

/** Changes the password, re-authenticating first as Firebase requires. */
export async function changeUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.email) throw new Error('Not signed in');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  try {
    await reauthenticateWithCredential(user, credential);
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      throw new Error(i18n.t('common.authErrors.currentPasswordIncorrect'));
    }
    throw error;
  }
  await updatePassword(user, newPassword);
}
