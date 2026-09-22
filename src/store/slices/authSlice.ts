import {
  createAsyncThunk,
  createSlice,
  isPending,
  isRejected,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  authErrorMessage,
  registerAccount,
  signIn,
  signOutAccount,
} from '../../services/auth';
import type { Role, UserProfile } from '../../types';

interface AuthState {
  /** True once the Firebase auth listener has run at least once. */
  initialized: boolean;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  initialized: false,
  profile: null,
  loading: false,
  error: null,
};

export const signInThunk = createAsyncThunk(
  'auth/signIn',
  async (params: { email: string; password: string }) => {
    await signIn(params.email, params.password);
  },
);

export const signUpThunk = createAsyncThunk(
  'auth/signUp',
  async (params: {
    name: string;
    email: string;
    password: string;
    role: Role;
    gymId?: string;
  }) => {
    await registerAccount(params);
  },
);

export const signOutThunk = createAsyncThunk('auth/signOut', async () => {
  await signOutAccount();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Fired from the onAuthStateChanged listener once the profile is loaded. */
    authStateChanged(state, action: PayloadAction<{ profile: UserProfile | null }>) {
      state.profile = action.payload.profile;
      state.initialized = true;
      state.loading = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => isPending(action) && action.type.startsWith('auth/'),
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => isRejected(action) && action.type.startsWith('auth/'),
        (state, action) => {
          state.loading = false;
          const rejection = action as { error?: unknown; payload?: unknown };
          state.error = authErrorMessage(rejection.error ?? rejection.payload);
        },
      );
  },
});

export const { authStateChanged, clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
