import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { asNumber, asOptionalString, asString, isRecord } from '../../utils/guards';
import type { Role, UserProfile } from '../../types';

interface MembersState {
  byUid: Record<string, UserProfile>;
}

const initialState: MembersState = { byUid: {} };

/** Converts the raw `users` RTDB payload into typed profiles. */
export function normalizeUsers(value: unknown): Record<string, UserProfile> {
  const users: Record<string, UserProfile> = {};
  if (!isRecord(value)) return users;
  const validRoles: Role[] = ['admin', 'coach', 'member'];
  for (const [uid, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    const role = validRoles.includes(entry.role as Role) ? (entry.role as Role) : 'member';
    users[uid] = {
      uid,
      name: asString(entry.name, 'Member'),
      email: asString(entry.email, ''),
      role,
      ...(asOptionalString(entry.gymId) ? { gymId: entry.gymId as string } : {}),
      ...(asOptionalString(entry.photoData) ? { photoData: entry.photoData as string } : {}),
      createdAt: asNumber(entry.createdAt, 0),
    };
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
  },
});

export const { membersUpdated } = membersSlice.actions;
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

export function selectUserById(
  state: { members: MembersState },
  uid: string,
): UserProfile | undefined {
  return state.members.byUid[uid];
}
