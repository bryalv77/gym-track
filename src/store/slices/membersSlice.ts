import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { asNumber, asOptionalString, asString, isRecord } from '../../utils/guards';
import type { Role, UserProfile } from '../../types';

interface MembersState {
  byUid: Record<string, UserProfile>;
}

const initialState: MembersState = { byUid: {} };

const VALID_ROLES: Role[] = ['admin', 'coach', 'member'];

/** Converts one raw `users/{uid}` RTDB node into a typed profile. */
export function normalizeUser(uid: string, entry: unknown): UserProfile | null {
  if (!isRecord(entry)) return null;
  const role = VALID_ROLES.includes(entry.role as Role) ? (entry.role as Role) : 'member';
  return {
    uid,
    name: asString(entry.name, 'Member'),
    email: asString(entry.email, ''),
    role,
    ...(asOptionalString(entry.gymId) ? { gymId: entry.gymId as string } : {}),
    ...(asOptionalString(entry.coachId) ? { coachId: entry.coachId as string } : {}),
    ...(asOptionalString(entry.photoData) ? { photoData: entry.photoData as string } : {}),
    createdAt: asNumber(entry.createdAt, 0),
  };
}

/** Converts the raw `users` RTDB payload into typed profiles. */
export function normalizeUsers(value: unknown): Record<string, UserProfile> {
  const users: Record<string, UserProfile> = {};
  if (!isRecord(value)) return users;
  for (const [uid, entry] of Object.entries(value)) {
    const user = normalizeUser(uid, entry);
    if (user) users[uid] = user;
  }
  return users;
}

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    membersUpdated(state, action: PayloadAction<unknown>) {
      state.byUid = normalizeUsers(action.payload);
    },
    /** Upserts (or removes, when the node is gone) a single user. */
    userUpdated(state, action: PayloadAction<{ uid: string; value: unknown }>) {
      const user = normalizeUser(action.payload.uid, action.payload.value);
      if (user) state.byUid[action.payload.uid] = user;
      else delete state.byUid[action.payload.uid];
    },
  },
});

export const { membersUpdated, userUpdated } = membersSlice.actions;
export const membersReducer = membersSlice.reducer;

/** All profiles sorted by name. */
export function selectUsersSorted(state: { members: MembersState }): UserProfile[] {
  return Object.values(state.members.byUid).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/** Members of one gym (coaches excluded), sorted by name. */
export function selectGymMembers(
  state: { members: MembersState },
  gymId?: string,
): UserProfile[] {
  return Object.values(state.members.byUid)
    .filter(
      (profile) =>
        profile.role === 'member' && (!gymId || profile.gymId === gymId),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Coaches of one gym, sorted by name. */
export function selectGymCoaches(
  state: { members: MembersState },
  gymId?: string,
): UserProfile[] {
  return Object.values(state.members.byUid)
    .filter((profile) => profile.role === 'coach' && (!gymId || profile.gymId === gymId))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function selectUserById(
  state: { members: MembersState },
  uid: string,
): UserProfile | undefined {
  return state.members.byUid[uid];
}
