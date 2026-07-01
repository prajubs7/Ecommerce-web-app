import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Profile } from '../types/database.types';

interface AuthState {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  isInitializing: boolean; // true while we check Supabase for an existing session on app load
}

const initialState: AuthState = {
  userId: null,
  email: null,
  profile: null,
  isInitializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionLoaded(
      state,
      action: PayloadAction<{ userId: string; email: string } | null>
    ) {
      state.userId = action.payload?.userId ?? null;
      state.email = action.payload?.email ?? null;
      state.isInitializing = false;
    },
    profileLoaded(state, action: PayloadAction<Profile | null>) {
      state.profile = action.payload;
    },
    signedOut(state) {
      state.userId = null;
      state.email = null;
      state.profile = null;
    },
  },
});

export const { sessionLoaded, profileLoaded, signedOut } = authSlice.actions;
export default authSlice.reducer;
