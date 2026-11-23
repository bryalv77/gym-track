import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../../types';

interface MembersState {
  byUid: Record<string, UserProfile>;
}

const initialState: MembersState = { byUid: {} };

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    membersUpdated(state, action: PayloadAction<Record<string, UserProfile>>) {
      state.byUid = action.payload;
    },
    /** Upserts (or removes, when the node is gone) a single user. */
    userUpdated(state, action: PayloadAction<{ uid: string; value: UserProfile | null }>) {
      if (action.payload.value) state.byUid[action.payload.uid] = action.payload.value;
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
