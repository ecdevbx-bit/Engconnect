import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  uid: null,
  email: null,
  displayName: null,
  emailVerified: false,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(
      state,
      action: PayloadAction<{ uid: string | null; email: string | null; displayName: string | null; emailVerified: boolean}>
    ) {
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.displayName = action.payload.displayName;
      state.emailVerified = action.payload.emailVerified;
      state.isAuthenticated = true;
    },
    clearAuth(state) {
      state.uid = null;
      state.email = null;
      state.displayName = null;
      state.emailVerified = false;
      state.isAuthenticated = false;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
