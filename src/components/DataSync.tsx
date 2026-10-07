import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { isFirebaseConfigured } from '../config/firebase';
import { subscribeToAssignments } from '../services/assignments';
import { subscribeToExercises } from '../services/exercises';
import { subscribeToGyms } from '../services/gyms';
import { subscribeToAllCompletions, subscribeToCompletions } from '../services/completions';
import { subscribeToMeasurements } from '../services/measurements';
import { subscribeToSelfies } from '../services/selfies';
import { ensureDefaultExercises } from '../utils/defaultExercises';
import { subscribeToRoutines } from '../services/routines';
import { subscribeToUser, subscribeToUsers } from '../services/users';
import { assignmentsUpdated } from '../store/slices/assignmentsSlice';
import { exercisesUpdated } from '../store/slices/exercisesSlice';
import { gymsUpdated } from '../store/slices/gymsSlice';
import {
  completionsUpdated,
  completionsUserUpdated,
} from '../store/slices/completionsSlice';
import { measurementsUpdated } from '../store/slices/measurementsSlice';
import { selfiesUpdated } from '../store/slices/selfiesSlice';
import { routinesUpdated } from '../store/slices/routinesSlice';
import { membersUpdated, userUpdated } from '../store/slices/membersSlice';

/**
 * Invisible component that keeps the Redux store in sync with the Realtime
 * Database. Assignments, exercises and gyms sync for everyone; coaches and
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

  useEffect(() => {
    if (!isFirebaseConfigured || !profile) return;
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
    }
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [profile?.uid, profile?.role, dispatch]);

  // Coaches and admins seed the suggested starter exercises (once, if missing).
  const canSeedExercises = profile?.role === 'coach' || profile?.role === 'admin';
  const profileUid = profile?.uid;
  useEffect(() => {
    if (!isFirebaseConfigured || !canSeedExercises || !profileUid) return;
    ensureDefaultExercises(profileUid).catch((error) =>
      console.warn('[exercises] default seeding failed:', error),
    );
  }, [canSeedExercises, profileUid]);

  // Members only read their own coach's node, not the whole directory.
  useEffect(() => {
    if (!isFirebaseConfigured || !ownCoachId) return;
    return subscribeToUser(ownCoachId, (value) =>
      dispatch(userUpdated({ uid: ownCoachId, value })),
    );
  }, [ownCoachId, dispatch]);

  return null;
}
