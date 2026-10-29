// AI Partner session options shared by the UI (start card) and the server
// (validation + prompt). Everything the learner can pick for a conversation:
// level, scenario and K.AI's voice. The language is no longer picked — K.AI
// reads it from how the learner talks (AUTO_LANGUAGE, D-059).
// Voices were verified against gemini-3.1-flash-live-preview on 2026-09-22
// (all return audio; unknown names are rejected by Google with close 1007).

export type AIPartnerLanguage = { id: string; label: string; native: string };

// "Auto" (the default, D-059): K.AI starts in simple English and moves into
// whichever of these languages the learner is comfortable in.
export const AUTO_LANGUAGE = "Auto";

// The languages K.AI can blend with English. Old sessions stored one of these
// ids ("English" = English only, any other = that language + English).
export const AI_PARTNER_LANGUAGES: AIPartnerLanguage[] = [
  { id: "English", label: "English only", native: "A" },
  { id: "Hindi", label: "Hindi + English", native: "अ" },
  { id: "Bengali", label: "Bengali + English", native: "অ" },
  { id: "Marathi", label: "Marathi + English", native: "म" },
  { id: "Gujarati", label: "Gujarati + English", native: "અ" },
  { id: "Punjabi", label: "Punjabi + English", native: "ਪ" },
  { id: "Tamil", label: "Tamil + English", native: "அ" },
  { id: "Telugu", label: "Telugu + English", native: "అ" },
  { id: "Kannada", label: "Kannada + English", native: "ಕ" },
  { id: "Malayalam", label: "Malayalam + English", native: "മ" },
  { id: "Odia", label: "Odia + English", native: "ଓ" },
  { id: "Assamese", label: "Assamese + English", native: "অ" },
  { id: "Urdu", label: "Urdu + English", native: "ا" },
  { id: "Nepali", label: "Nepali + English", native: "न" },
];

// Behaviour per level lives in server/gemini/instructions/levels.ts.
export const AI_PARTNER_LEVELS = [
  { id: "Beginner", label: "Beginner", hint: "Soft, slow voice · very simple words · repeat after K.AI" },
  { id: "Intermediate", label: "Intermediate", hint: "Full sentences, tenses, everyday topics" },
  { id: "Expert", label: "Expert", hint: "Natural speed, idioms, tough follow-up questions" },
] as const;

export const AI_PARTNER_SCENARIOS = [
  { id: "General Conversation", label: "☕ Casual chat", hint: "Warm everyday conversation" },
  { id: "Job Interview", label: "💼 Job interview", hint: "HR + role questions, STAR answers" },
  { id: "IELTS Speaking", label: "🎓 IELTS / TOEFL", hint: "Speaking test, parts 1–3" },
  { id: "Travel & Daily Life", label: "✈️ Travel & shopping", hint: "Airport, hotel, café, shops" },
  { id: "Office & Workplace", label: "🏢 Office talk", hint: "Meetings, calls, emails, small talk" },
  { id: "Grammar Workout", label: "🎯 Grammar workout", hint: "Tenses and common mistakes" },
] as const;

// K.AI's voices — one female, one male (D-048; was 18). Gemini Live prebuilt
// voices with Google's own character descriptions. Any other saved/requested
// voice falls back to DEFAULT_AI_PARTNER_VOICE (server: isKnownVoice).
export const AI_PARTNER_VOICES = [
  { id: "Aoede", feel: "Breezy", tone: "female" },
  { id: "Charon", feel: "Informative", tone: "male" },
] as const;

export const DEFAULT_AI_PARTNER_VOICE = "Aoede";

export function isKnownVoice(v: string): boolean {
  return AI_PARTNER_VOICES.some((x) => x.id === v);
}

export function isKnownLanguage(v: string): boolean {
  return v === AUTO_LANGUAGE || AI_PARTNER_LANGUAGES.some((x) => x.id === v);
}

export function isKnownScenario(v: string): boolean {
  return AI_PARTNER_SCENARIOS.some((x) => x.id === v);
}

export function isKnownLevel(v: string): boolean {
  return AI_PARTNER_LEVELS.some((x) => x.id === v);
}
