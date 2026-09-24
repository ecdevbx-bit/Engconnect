import "server-only";

import { auth } from "@/auth";

import { db } from "./supabase";

// Who is looking at a public, server-rendered page (e.g. /learn). Logged-out
// visitors are a normal case here, never an error.
export type Viewer = { signedIn: boolean; isPro: boolean; isAdmin: boolean; name: string };

const GUEST: Viewer = { signedIn: false, isPro: false, isAdmin: false, name: "" };

export async function getViewer(): Promise<Viewer> {
  try {
    const s = await auth();
    if (!s || s.error) return GUEST;
    return { signedIn: true, isPro: s.user.isPro || s.user.isAdmin, isAdmin: s.user.isAdmin, name: s.user.name };
  } catch {
    return GUEST;
  }
}

// Admin on/off switches (feature_flags table, /v3/admin/feature-flags).
export const FLAG_LEARN = "englishconnection-learn";

export async function flagEnabled(key: string, fallback: boolean): Promise<boolean> {
  try {
    const { data, error } = await db().from("feature_flags").select("enabled").eq("key", key).maybeSingle();
    if (error || !data) return fallback;
    return !!data.enabled;
  } catch {
    return fallback;
  }
}

// The Learn library is open to everyone when the admin switch is ON; while it
// is OFF only admins can open it (to preview before launch).
export async function learnAccess(): Promise<{ open: boolean; isPublic: boolean; viewer: Viewer }> {
  const [isPublic, viewer] = await Promise.all([flagEnabled(FLAG_LEARN, false), getViewer()]);
  return { open: isPublic || viewer.isAdmin, isPublic, viewer };
}
