import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile, SignupEntryPoint } from "@/types";

interface UserState {
  profile: Partial<UserProfile> | null;
  isSignedUp: boolean;
  signupEntryPoint: SignupEntryPoint | null;
  pendingXP: number;
  pendingLevel: number;
}

const initialState: UserState = {
  profile: null,
  isSignedUp: false,
  signupEntryPoint: null,
  pendingXP: 0,
  pendingLevel: 0,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setSignupEntryPoint(state, action: PayloadAction<SignupEntryPoint>) {
      state.signupEntryPoint = action.payload;
    },
    setPendingXP(state, action: PayloadAction<{ xp: number; level: number }>) {
      state.pendingXP = action.payload.xp;
      state.pendingLevel = action.payload.level;
    },
    setProfile(state, action: PayloadAction<Partial<UserProfile>>) {
      state.profile = { ...state.profile, ...action.payload };
    },
    completeSignup(state) {
      state.isSignedUp = true;
      if (state.profile) {
        state.profile.xp = state.pendingXP;
        state.profile.level = state.pendingLevel;
      }
    },
    resetUser() {
      return initialState;
    },
  },
});

export const {
  setSignupEntryPoint,
  setPendingXP,
  setProfile,
  completeSignup,
  resetUser,
} = userSlice.actions;
export default userSlice.reducer;
