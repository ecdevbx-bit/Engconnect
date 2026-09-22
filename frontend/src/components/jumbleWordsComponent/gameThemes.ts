// Swappable game-world themes for Jumble Words.
//
// The drag-and-drop engine is theme-agnostic; a theme is purely a visual skin
// plus win/lose choreography. Adding a world = adding one entry here (and its
// keyframes in globals.css).

export type ThemeId = "plain" | "train" | "bubble" | "rocket" | "bridge";

export interface GameTheme {
  id: ThemeId;
  label: string;
  emoji: string;
  /** Empty-state copy for the sentence (build) zone. */
  placeholder: string;
  /** Tile skin in the pool. */
  tilePool: string;
  /** Tile skin once placed in the sentence. */
  tileSentence: string;
  /** Idle bob — the floating-orb effect. */
  bobTiles: boolean;
  /** Extra surface class on the sentence drop zone. */
  zoneClass: string;
  /** Emoji rendered as the lead of the build (engine, nose cone…), or null. */
  leadDecor: string | null;
  /** Animation class applied to the build on a correct answer. */
  winAnim: string;
  /** Animation class applied to the build on a wrong answer. */
  loseAnim: string;
  /** A walking mascot crosses the build on a win (bridge only). */
  travelerOnWin: string | null;
}

export const GAME_THEMES: Record<ThemeId, GameTheme> = {
  // Plain — the default, themeless board. Neutral flat tiles, no game-world
  // skin or win/lose choreography (a subtle shake on a wrong answer aside).
  plain: {
    id: "plain",
    label: "Plain",
    emoji: "",
    placeholder: "Arrange the words in the right order",
    tilePool: "rounded-lg bg-surface-2 border-white/10 text-heading",
    tileSentence: "rounded-lg bg-surface-3 border-primary/40 text-heading",
    bobTiles: false,
    zoneClass: "",
    leadDecor: null,
    winAnim: "",
    loseAnim: "anim-board-shake",
    travelerOnWin: null,
  },
  train: {
    id: "train",
    label: "Train",
    emoji: "🚂",
    // The build happens inline below the yard; the bottom band IS the train.
    placeholder: "Arrange the words in the right order",
    // Warm wooden tiles — light-toned in light mode, deep wood in dark.
    tilePool:
      "rounded-md bg-gradient-to-b from-[#efe2cd] to-[#e2cfae] border-amber-700/30 text-amber-900 dark:from-[#3b3025] dark:to-[#2a221b] dark:border-amber-600/40 dark:text-amber-100",
    tileSentence:
      "rounded-md bg-gradient-to-b from-[#e7d4b1] to-[#d9c091] border-amber-700/50 text-amber-950 dark:from-[#4c3c28] dark:to-[#33281c] dark:border-amber-400/60 dark:text-amber-50",
    bobTiles: false,
    zoneClass: "",
    leadDecor: null,
    winAnim: "",
    loseAnim: "",
    travelerOnWin: null,
  },
  bubble: {
    id: "bubble",
    label: "Bubbles",
    emoji: "🫧",
    placeholder: "Float the orbs into orbit",
    tilePool:
      "rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.22),rgba(120,90,255,0.16))] border-white/15 text-heading",
    tileSentence:
      "rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.32),rgba(0,227,253,0.20))] border-cyan/40 text-heading",
    bobTiles: true,
    zoneClass: "zone-bubble",
    leadDecor: null,
    winAnim: "anim-bubble-fuse",
    loseAnim: "anim-bubble-pop",
    travelerOnWin: null,
  },
  rocket: {
    id: "rocket",
    label: "Rocket",
    emoji: "🚀",
    placeholder: "Stack the rocket — nose to tail",
    tilePool:
      "rounded-md bg-gradient-to-b from-surface-3 to-surface-2 border-white/15 text-heading",
    tileSentence:
      "rounded-md bg-gradient-to-b from-[#1d2b32] to-[#16212a] border-cyan/40 text-heading",
    bobTiles: false,
    zoneClass: "zone-rocket",
    leadDecor: "🚀",
    winAnim: "anim-rocket-launch",
    loseAnim: "anim-rocket-fizzle",
    travelerOnWin: null,
  },
  bridge: {
    id: "bridge",
    label: "Bridge",
    emoji: "🌉",
    placeholder: "Lay the planks across the chasm",
    tilePool:
      "rounded-sm bg-gradient-to-b from-[#4a3526] to-[#372818] border-amber-900/50 text-amber-50",
    tileSentence:
      "rounded-sm bg-gradient-to-b from-[#5b4330] to-[#3f2e1f] border-amber-700/60 text-amber-50",
    bobTiles: false,
    zoneClass: "zone-bridge",
    leadDecor: null,
    winAnim: "", // the win is the traveler crossing, not the planks moving
    loseAnim: "anim-bridge-collapse",
    travelerOnWin: "🚶",
  },
};

export const THEME_ORDER: ThemeId[] = ["plain", "train", "bubble", "rocket", "bridge"];
// Train is the single locked world now that the switcher is gone.
export const DEFAULT_THEME: ThemeId = "train";
