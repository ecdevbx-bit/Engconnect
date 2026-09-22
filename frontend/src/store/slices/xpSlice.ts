import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { XPState, Difficulty, XP_PER_DIFFICULTY } from "@/types";
import { getLevelFromXP } from "@/lib/xpLogic";
import { DEFAULT_LEVEL_DEFINITIONS } from "@/lib/levels";

const initialState: XPState = {
  totalXP: 0,
  currentLevel: 1,
  combos: {},
  // Seed with the same defaults the backend ships so the popover has
  // something to render between first paint and the /levels fetch.
  levels: DEFAULT_LEVEL_DEFINITIONS,
  levelUpTo: null,
  badgeQueue: [],
};

const xpSlice = createSlice({
  name: "xp",
  initialState,
  reducers: {
    addXP(state, action: PayloadAction<Difficulty>) {
      const earned = XP_PER_DIFFICULTY[action.payload];
      state.totalXP += earned;
      state.currentLevel = getLevelFromXP(state.totalXP);
    },
    setXP(state, action: PayloadAction<number>) {
      state.totalXP = action.payload;
      state.currentLevel = getLevelFromXP(action.payload);
    },
    resetXP(state) {
      state.totalXP = 0;
      state.currentLevel = 1;
      state.combos = {};
    },
    syncFromBackend(
      state,
      action: PayloadAction<{ totalXp: number; currentLevel: number; combos?: Record<string, number> }>,
    ) {
      state.totalXP = action.payload.totalXp;
      state.currentLevel = action.payload.currentLevel;
      if (action.payload.combos) state.combos = action.payload.combos;
    },
    // setCombo writes a single per-category counter. The gameplay
    // handler dispatches this on every submit with the new value (from
    // the response.combo field) so Redux stays in lockstep with the DB.
    setCombo(state, action: PayloadAction<{ category: string; value: number }>) {
      state.combos[action.payload.category] = action.payload.value;
    },
    // setLevels replaces the whole catalog. Called after fetching
    // /api/levels at session load, and after the admin saves.
    setLevels(state, action: PayloadAction<XPState["levels"]>) {
      if (Array.isArray(action.payload) && action.payload.length > 0) {
        state.levels = action.payload;
      }
    },
    // triggerLevelUp / clearLevelUp drive the root LevelUpCelebration. Any
    // gameplay handler dispatches triggerLevelUp(newLevel) when the backend
    // reports leveledUp; the root component shows the card and clears it.
    triggerLevelUp(state, action: PayloadAction<number>) {
      state.levelUpTo = action.payload;
    },
    clearLevelUp(state) {
      state.levelUpTo = null;
    },
    // enqueueBadgeCelebrations appends newly-earned badge IDs (deduped against
    // what's already queued) for the root celebration to play one at a time.
    enqueueBadgeCelebrations(state, action: PayloadAction<string[]>) {
      for (const id of action.payload) {
        if (id && !state.badgeQueue.includes(id)) state.badgeQueue.push(id);
      }
    },
    dismissBadgeCelebration(state) {
      state.badgeQueue.shift();
    },
  },
});

export const {
  addXP,
  setXP,
  resetXP,
  syncFromBackend,
  setCombo,
  setLevels,
  triggerLevelUp,
  clearLevelUp,
  enqueueBadgeCelebrations,
  dismissBadgeCelebration,
} = xpSlice.actions;
export default xpSlice.reducer;
