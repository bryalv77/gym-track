import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { isFirebaseConfigured } from '../config/firebase';
import { subscribeToAssignments } from '../services/assignments';
import { subscribeToExercises } from '../services/exercises';
import { subscribeToGyms } from '../services/gyms';
import { subscribeToAllCompletions, subscribeToCompletions } from '../services/completions';
import { subscribeToMeasurements } from '../services/measurements';
import { subscribeToUsers } from '../services/users';
import { assignmentsUpdated } from '../store/slices/assignmentsSlice';
import { exercisesUpdated } from '../store/slices/exercisesSlice';
import { gymsUpdated } from '../store/slices/gymsSlice';
import {
  completionsUpdated,
  completionsUserUpdated,
} from '../store/slices/completionsSlice';
import { measurementsUpdated } from '../store/slices/measurementsSlice';
import { membersUpdated } from '../store/slices/membersSlice';

/**
 * Invisible component that keeps the Redux store in sync with the Realtime
 * Database. Assignments, exercises and gyms sync for everyone; coaches and
 * admins also get the user directory, coaches get every member's completions,
 * members get their own completions and measurements.
 */
export function DataSync() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);

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
          subscribeToAllCompletions((value) => dispatch(completionsUpdated(value))),
        );
      }
    } else {
      unsubscribers.push(
        subscribeToCompletions(profile.uid, (value) =>
          dispatch(completionsUserUpdated({ uid: profile.uid, value })),
        ),
        subscribeToMeasurements(profile.uid, (value) =>
          dispatch(measurementsUpdated(value)),
        ),
      );
    }
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [profile?.uid, profile?.role, dispatch]);

  return null;
}
