// Helpers for the v3 onboarding wizard. The wizard collects the
// answers locally (and stashes a draft in localStorage) and POSTs the
// whole payload at the end — the backend writes them and flips
// `onboardingCompleted` in a single atomic UpdateItem.

import { v3Fetch, type EcaiUser } from "@/lib/apiClient";

export type OnboardingNativeLang =
  | "English" | "Hindi" | "Bengali" | "Gujarati"
  | "Marathi" | "Tamil" | "Telugu";

export type OnboardingStatus =
  | "student" | "working" | "looking_for_work"
  | "homemaker" | "retired" | "other";

export type OnboardingReason =
  | "career" | "studies" | "travel"
  | "confidence" | "family" | "other";

export interface OnboardingPayload {
  nativeLang: OnboardingNativeLang;
  location: string;
  currentStatus: OnboardingStatus;
  englishReason: OnboardingReason;
  goals: string;
  hobbies: string[];
}

export function v3SubmitOnboarding(
  accessToken: string,
  payload: OnboardingPayload,
): Promise<EcaiUser> {
  return v3Fetch<EcaiUser>("/users/me/onboarding", accessToken, {
    method: "POST",
    body: payload,
  });
}

// Reference data — labels, emojis, enum values — all consumed by the
// wizard component. Kept here so the wizard stays a thin renderer and
// any future copy tweak lives in one place.
export const NATIVE_LANG_OPTIONS: Array<{ id: OnboardingNativeLang; label: string; native: string }> = [
  { id: "English",  label: "English",  native: "A" },
  { id: "Hindi",    label: "Hindi",    native: "अ" },
  { id: "Bengali",  label: "Bengali",  native: "অ" },
  { id: "Gujarati", label: "Gujarati", native: "અ" },
  { id: "Marathi",  label: "Marathi",  native: "अ" },
  { id: "Tamil",    label: "Tamil",    native: "அ" },
  { id: "Telugu",   label: "Telugu",   native: "అ" },
];

export const STATUS_OPTIONS: Array<{ id: OnboardingStatus; label: string; emoji: string }> = [
  { id: "student",          label: "Student",          emoji: "🎓" },
  { id: "working",          label: "Working",          emoji: "💼" },
  { id: "looking_for_work", label: "Looking for work", emoji: "🔍" },
  { id: "homemaker",        label: "Homemaker",        emoji: "🏡" },
  { id: "retired",          label: "Retired",          emoji: "🌿" },
  { id: "other",            label: "Other",            emoji: "✨" },
];

export const REASON_OPTIONS: Array<{ id: OnboardingReason; label: string; emoji: string; sub: string }> = [
  { id: "career",     label: "Career",     emoji: "🚀", sub: "Job interviews, promotions, daily work" },
  { id: "studies",    label: "Studies",    emoji: "📚", sub: "Exams, school, research" },
  { id: "travel",     label: "Travel",     emoji: "✈️", sub: "Get around, make friends abroad" },
  { id: "confidence", label: "Confidence", emoji: "💪", sub: "Just feel comfortable speaking" },
  { id: "family",     label: "Family",     emoji: "👨‍👩‍👧", sub: "Talk to kids, family, in-laws" },
  { id: "other",      label: "Something else", emoji: "✨", sub: "Tell K.AI in your own words" },
];

export const HOBBY_SUGGESTIONS = [
  "Reading", "Cooking", "Movies", "Music", "Cricket",
  "Football", "Travel", "Photography", "Gaming", "Coding",
  "Painting", "Dancing", "Yoga", "Gardening", "Writing",
];
