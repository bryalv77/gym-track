import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './slices/authSlice';
import { assignmentsReducer } from './slices/assignmentsSlice';
import { exercisesReducer } from './slices/exercisesSlice';
import { gymsReducer } from './slices/gymsSlice';
import { completionsReducer } from './slices/completionsSlice';
import { measurementsReducer } from './slices/measurementsSlice';
import { selfiesReducer } from './slices/selfiesSlice';
import { membersReducer } from './slices/membersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assignments: assignmentsReducer,
    exercises: exercisesReducer,
    gyms: gymsReducer,
    completions: completionsReducer,
    measurements: measurementsReducer,
    selfies: selfiesReducer,
    members: membersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
