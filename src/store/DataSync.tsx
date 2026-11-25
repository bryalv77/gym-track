import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { subscribeToAssignments } from '../services/assignments';
import { ensureDefaultExercises, subscribeToExercises } from '../services/exercises';
import { subscribeToGyms } from '../services/gyms';
import { subscribeToAllCompletions, subscribeToCompletions } from '../services/completions';
import { subscribeToMeasurements } from '../services/measurements';
import { subscribeToSelfies } from '../services/selfies';
import { subscribeToRoutines } from '../services/routines';
import { subscribeToUser, subscribeToUsers } from '../services/users';
import { assignmentsUpdated } from './slices/assignmentsSlice';
import { exercisesUpdated } from './slices/exercisesSlice';
import { gymsUpdated } from './slices/gymsSlice';
import {
  completionsUpdated,
  completionsUserUpdated,
} from './slices/completionsSlice';
import { measurementsUpdated } from './slices/measurementsSlice';
import { selfiesUpdated } from './slices/selfiesSlice';
import { routinesUpdated } from './slices/routinesSlice';
import { membersUpdated, userUpdated } from './slices/membersSlice';
import { AppState } from 'react-native';
import {
  GUEST_UID,
  buildGuestAssignments,
  isSelfCoached,
  refreshGuest,
  subscribeToGuest,
} from '../services/guest';

/**
 * Invisible component that keeps the Redux store in sync with the Hono
 * API. Assignments, exercises and gyms sync for everyone; coaches and
 * admins also get the user directory, coaches get every member's completions,
 * members get their own completions and measurements.
 */
export function DataSync() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);
  // Live value (the auth profile is only fetched at sign-in), so an admin
  // assigning a coach shows up immediately for the member.
  const ownCoachId = useAppSelector((state) =>
    profile?.role === 'member' ? state.members.byUid[profile.uid]?.coachId : undefined,
  );

  // Guest (plan code, offline): the store is fed from the on-device copy, never the API.
  const isGuest = profile?.guest === true;
  const selfCoached = isSelfCoached(profile);
  useEffect(() => {
    if (!isGuest) return;
    const unsubscribe = subscribeToGuest((guest) => {
      if (!guest) return;
      dispatch(exercisesUpdated(guest.exercises));
      dispatch(assignmentsUpdated(buildGuestAssignments(guest)));
      dispatch(completionsUserUpdated({ uid: GUEST_UID, value: guest.completions }));
      dispatch(routinesUpdated(guest.routines ?? {}));
    });
    // Pull coach edits whenever a connection happens to be there; failures are silent.
    void refreshGuest();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshGuest();
    });
    return () => {
      unsubscribe();
      appState.remove();
      dispatch(exercisesUpdated({}));
      dispatch(assignmentsUpdated({}));
      dispatch(completionsUserUpdated({ uid: GUEST_UID, value: {} }));
      dispatch(routinesUpdated({}));
    };
  }, [isGuest, dispatch]);

  useEffect(() => {
    if (!profile || profile.guest) return;
    const unsubscribers: Array<() => void> = [
      subscribeToAssignments((value) => dispatch(assignmentsUpdated(value))),
      subscribeToExercises((value) => dispatch(exercisesUpdated(value))),
      subscribeToGyms((value) => dispatch(gymsUpdated(value))),
    ];
    if (profile.role === 'coach' || profile.role === 'admin') {
      unsubscribers.push(
        subscribeToUsers((value) => dispatch(membersUpdated(value))),
      );
      if (profile.role === 'coach') {
        unsubscribers.push(
          subscribeToRoutines(profile.uid, (value) => dispatch(routinesUpdated(value))),
          subscribeToAllCompletions((value) => dispatch(completionsUpdated(value))),
        );
      }
    } else {
      unsubscribers.push(
        subscribeToUser(profile.uid, (value) =>
          dispatch(userUpdated({ uid: profile.uid, value })),
        ),
        subscribeToCompletions(profile.uid, (value) =>
          dispatch(completionsUserUpdated({ uid: profile.uid, value })),
        ),
        subscribeToMeasurements(profile.uid, (value) =>
          dispatch(measurementsUpdated(value)),
        ),
        subscribeToSelfies(profile.uid, (value) =>
          dispatch(selfiesUpdated(value)),
        ),
      );
      // No coach: they write their own routines.
      if (selfCoached) {
        unsubscribers.push(
          subscribeToRoutines(profile.uid, (value) => dispatch(routinesUpdated(value))),
        );
      }
    }
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [profile?.uid, profile?.role, profile?.guest, selfCoached, dispatch]);

  // Coaches and admins seed the suggested starter exercises (once, if missing).
  const canSeedExercises =
    profile?.role === 'coach' || profile?.role === 'admin' || (selfCoached && !isGuest);
  useEffect(() => {
    if (!canSeedExercises) return;
    ensureDefaultExercises().catch((error) =>
      console.warn('[exercises] default seeding failed:', error),
    );
  }, [canSeedExercises]);

  // Members only read their own coach's record, not the whole directory.
  useEffect(() => {
    if (!ownCoachId) return;
    return subscribeToUser(ownCoachId, (value) =>
      dispatch(userUpdated({ uid: ownCoachId, value })),
    );
  }, [ownCoachId, dispatch]);

  return null;
}
