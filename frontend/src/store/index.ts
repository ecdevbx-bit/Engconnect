import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "./slices/gameSlice";
import xpReducer from "./slices/xpSlice";
import userReducer from "./slices/userSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    game: gameReducer,
    xp: xpReducer,
    user: userReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
