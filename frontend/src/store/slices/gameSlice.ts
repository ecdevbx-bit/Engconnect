import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GameSession, Sentence, WordTile, GameStatus } from "@/types";
import { scrambleSentence } from "@/lib/gameLogic";

// Consecutive wrong guesses before the AI partner offers a hint.
const HINT_THRESHOLD = 3;

const initialState: GameSession = {
  currentSlotIndex: 0,
  usedSentenceIds: [],
  currentSentence: null,
  scrambledWords: [],
  arrangedWords: [],
  status: "idle",
  sessionComplete: false,
  consecutiveWrong: 0,
  hintLevel: 0,
  hintPromptVisible: false,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    loadSentence(state, action: PayloadAction<Sentence>) {
      const sentence = action.payload;
      state.currentSentence = sentence;
      state.scrambledWords = scrambleSentence(sentence);
      state.arrangedWords = [];
      state.status = "playing";
      state.usedSentenceIds = [...state.usedSentenceIds, sentence.id];
      state.consecutiveWrong = 0;
      state.hintLevel = 0;
      state.hintPromptVisible = false;
    },
    moveToArranged(state, action: PayloadAction<{ tileId: string; toIndex: number }>) {
      const { tileId, toIndex } = action.payload;
      const tileInScrambled = state.scrambledWords.find((t) => t.id === tileId);
      const tileInArranged = state.arrangedWords.find((t) => t.id === tileId);

      if (tileInScrambled) {
        state.scrambledWords = state.scrambledWords.filter((t) => t.id !== tileId);
        const updated = [...state.arrangedWords];
        updated.splice(toIndex, 0, tileInScrambled);
        state.arrangedWords = updated;
      } else if (tileInArranged) {
        const from = state.arrangedWords.findIndex((t) => t.id === tileId);
        const updated = [...state.arrangedWords];
        const [removed] = updated.splice(from, 1);
        updated.splice(toIndex, 0, removed);
        state.arrangedWords = updated;
      }
    },
    moveToScrambled(state, action: PayloadAction<string>) {
      const tileId = action.payload;
      const tile = state.arrangedWords.find((t) => t.id === tileId);
      if (tile) {
        state.arrangedWords = state.arrangedWords.filter((t) => t.id !== tileId);
        state.scrambledWords = [...state.scrambledWords, tile];
      }
    },
    reorderArranged(state, action: PayloadAction<WordTile[]>) {
      state.arrangedWords = action.payload;
    },
    setStatus(state, action: PayloadAction<GameStatus>) {
      state.status = action.payload;
    },
    // Record a wrong guess on the current sentence. Once the player has missed
    // HINT_THRESHOLD times in a row (and hasn't started a hint yet), surface the
    // AI partner's hint offer.
    registerWrongGuess(state) {
      state.consecutiveWrong += 1;
      if (state.consecutiveWrong >= HINT_THRESHOLD && state.hintLevel === 0) {
        state.hintPromptVisible = true;
      }
    },
    // "half" steps the reveal forward (0→1→2, capped at 2 — first/last then
    // second/second-last). "full" jumps straight to the complete sentence.
    requestHint(state, action: PayloadAction<"half" | "full">) {
      if (action.payload === "full") {
        state.hintLevel = 3;
      } else {
        state.hintLevel = Math.min(state.hintLevel + 1, 2);
      }
      state.hintPromptVisible = false;
    },
    dismissHintPrompt(state) {
      state.hintPromptVisible = false;
    },
    advanceSlot(state) {
      if (state.currentSlotIndex < 5) {
        state.currentSlotIndex += 1;
        state.currentSentence = null;
        state.scrambledWords = [];
        state.arrangedWords = [];
        state.status = "idle";
        state.consecutiveWrong = 0;
        state.hintLevel = 0;
        state.hintPromptVisible = false;
      } else {
        state.sessionComplete = true;
        state.status = "completed";
      }
    },
    resetSession() {
      return initialState;
    },
  },
});

export const {
  loadSentence,
  moveToArranged,
  moveToScrambled,
  reorderArranged,
  setStatus,
  registerWrongGuess,
  requestHint,
  dismissHintPrompt,
  advanceSlot,
  resetSession,
} = gameSlice.actions;
export default gameSlice.reducer;
