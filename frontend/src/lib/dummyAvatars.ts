// Dummy avatars for the marketing/landing surfaces (DiceBear). These are plain,
// deterministic image URLs — the browser fetches each one once and caches it, so
// the same avatar can be reused anywhere (leaderboard, profile, AI Partner demo)
// without extra requests or any runtime fetching.
export const DUMMY_AVATARS = [
  "https://api.dicebear.com/9.x/dylan/svg?seed=aarav-ec", // 0 · Aarav
  "https://api.dicebear.com/9.x/dylan/svg?seed=diya-ec", //  1 · Diya
  "https://api.dicebear.com/9.x/dylan/svg?seed=mehul-ec", // 2 · Mehul
  "https://api.dicebear.com/9.x/dylan/svg?seed=rohan-ec", // 3 · Rohan / "You"
  "https://api.dicebear.com/9.x/dylan/svg?seed=sneha-ec", // 4 · Sneha
];
