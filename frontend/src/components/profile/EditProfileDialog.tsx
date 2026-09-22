"use client";

import { useMemo, useState } from "react";
import { Shuffle, Check, Loader2 } from "lucide-react";
import { useSession } from "@/lib/session";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { emitToast } from "@/lib/toast";
import {
  v3PatchMyProfile,
  avatarUrl,
  AVATAR_STYLES,
  type AvatarStyle,
  type V3MeProfile,
} from "@/lib/v3Game";
import {
  NATIVE_LANG_OPTIONS,
  STATUS_OPTIONS,
  REASON_OPTIONS,
  HOBBY_SUGGESTIONS,
} from "@/lib/v3Onboarding";

// EditProfileDialog — one cohesive form for every editable profile field.
// A single Save computes the diff against the original profile and sends
// only changed fields to PATCH /users/me, then mirrors name/avatar/lang/
// status into the NextAuth session so the navbar updates instantly.

type Draft = {
  name: string;
  phone: string;
  location: string;
  nativeLang: string;
  currentStatus: string;
  englishReason: string;
  goals: string;
  hobbies: string[];
  avatar: string;
};

function toDraft(p: V3MeProfile): Draft {
  return {
    name: p.name ?? "",
    phone: p.phone ?? "",
    location: p.location ?? "",
    nativeLang: p.nativeLang ?? "",
    currentStatus: p.currentStatus ?? "",
    englishReason: p.englishReason ?? "",
    goals: p.goals ?? "",
    hobbies: (p.hobbies ?? "").split(",").map((h) => h.trim()).filter(Boolean),
    avatar: p.avatar ?? "",
  };
}

export default function EditProfileDialog({
  profile,
  open,
  onOpenChange,
  onSaved,
}: {
  profile: V3MeProfile;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (updated: V3MeProfile) => void;
}) {
  const session = useSession();
  const accessToken = session.data?.user?.accessToken ?? "";

  // Re-seed the draft each time the dialog opens so a Cancel discards edits.
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [saving, setSaving] = useState(false);
  const [seedKey, setSeedKey] = useState(0);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  // Avatar picker (draft-only — persisted on Save with the rest).
  const avatarStyle: AvatarStyle = useMemo(() => {
    const s = draft.avatar.split(":")[0] as AvatarStyle;
    return AVATAR_STYLES.includes(s) ? s : "notionists";
  }, [draft.avatar]);

  const seeds = useMemo(
    () => buildSeeds(profile.email, avatarStyle, seedKey),
    [profile.email, avatarStyle, seedKey],
  );

  function toggleHobby(h: string) {
    setDraft((d) => {
      const has = d.hobbies.some((x) => x.toLowerCase() === h.toLowerCase());
      return {
        ...d,
        hobbies: has
          ? d.hobbies.filter((x) => x.toLowerCase() !== h.toLowerCase())
          : d.hobbies.length >= 10
            ? d.hobbies
            : [...d.hobbies, h],
      };
    });
  }

  async function handleSave() {
    if (!accessToken) {
      emitToast({ type: "error", title: "Not signed in", body: "Refresh and try again." });
      return;
    }
    // Client-side guards mirror the backend so users get instant feedback.
    if (!draft.name.trim()) {
      emitToast({ type: "error", title: "Name required", body: "Please enter your name." });
      return;
    }
    if (!draft.location.trim()) {
      emitToast({ type: "error", title: "Location required", body: "Please enter your location." });
      return;
    }
    if (!draft.goals.trim()) {
      emitToast({ type: "error", title: "Goals required", body: "Tell us what you're working towards." });
      return;
    }

    const hobbiesStr = draft.hobbies.join(", ");
    // Diff against the original so we PATCH only what actually changed.
    const patch: Record<string, string> = {};
    if (draft.name.trim() !== profile.name) patch.name = draft.name.trim();
    if (draft.phone.trim() !== profile.phone) patch.phone = draft.phone.trim();
    if (draft.location.trim() !== profile.location) patch.location = draft.location.trim();
    if (draft.nativeLang !== profile.nativeLang) patch.nativeLang = draft.nativeLang;
    if (draft.currentStatus !== profile.currentStatus) patch.currentStatus = draft.currentStatus;
    if (draft.englishReason !== profile.englishReason) patch.englishReason = draft.englishReason;
    if (draft.goals.trim() !== profile.goals) patch.goals = draft.goals.trim();
    if (hobbiesStr !== profile.hobbies) patch.hobbies = hobbiesStr;
    if (draft.avatar !== profile.avatar) patch.avatar = draft.avatar;

    if (Object.keys(patch).length === 0) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      const updated = await v3PatchMyProfile(accessToken, patch);
      // Overlay session-visible fields so the navbar/leaderboard reflect the
      // change without a reload.
      const sessionPatch: Record<string, string> = {};
      if (patch.name !== undefined) sessionPatch.name = updated.name;
      if (patch.avatar !== undefined) sessionPatch.avatar = updated.avatar;
      if (patch.nativeLang !== undefined) sessionPatch.nativeLang = updated.nativeLang;
      if (patch.currentStatus !== undefined) sessionPatch.currentStatus = updated.currentStatus;
      if (Object.keys(sessionPatch).length > 0) {
        await session.update({ user: sessionPatch });
      }
      onSaved(updated);
      emitToast({ type: "success", title: "Profile updated", body: "Your changes have been saved." });
      onOpenChange(false);
    } catch (err) {
      emitToast({
        type: "error",
        title: "Couldn't save",
        body: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  // Reset the draft to the latest profile whenever the dialog (re)opens.
  function handleOpenChange(next: boolean) {
    if (next) setDraft(toDraft(profile));
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-white/[0.06] px-6 py-4">
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your details, avatar, and learning preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[64vh] space-y-6 overflow-y-auto px-6 py-5">
          {/* ── Avatar ── */}
          <section className="space-y-3">
            <Label>Avatar</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSeedKey(0);
                    // keep current seed if it exists for this style, else first
                    set("avatar", `${s}:${buildSeeds(profile.email, s, 0)[0]}`);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    s === avatarStyle
                      ? "bg-primary text-[#0b0e14]"
                      : "border border-white/[0.06] bg-surface-2/60 text-muted-foreground hover:text-heading",
                  )}
                >
                  {s}
                </button>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="ml-auto"
                onClick={() => setSeedKey((n) => n + 1)}
              >
                <Shuffle className="h-3.5 w-3.5" /> Shuffle
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {seeds.map((seed) => {
                const candidate = `${avatarStyle}:${seed}`;
                const url = avatarUrl(candidate, 96);
                const selected = candidate === draft.avatar;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => set("avatar", candidate)}
                    aria-label={`Pick ${avatarStyle} ${seed}`}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl bg-surface-2 transition-all",
                      selected
                        ? "ring-2 ring-primary"
                        : "ring-1 ring-white/[0.06] hover:ring-white/[0.2]",
                    )}
                  >
                    {url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="h-full w-full" loading="lazy" />
                    )}
                    {selected && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[#0b0e14]">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {draft.avatar && (
              <button
                type="button"
                onClick={() => set("avatar", "")}
                className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-heading hover:underline"
              >
                Use initials instead
              </button>
            )}
          </section>

          {/* ── Identity ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your name"
                maxLength={60}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Location">
              <Input
                value={draft.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="City, Country"
                maxLength={80}
              />
            </Field>
            <Field label="Native language">
              <Select value={draft.nativeLang} onValueChange={(v) => set("nativeLang", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {NATIVE_LANG_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Current status">
              <Select value={draft.currentStatus} onValueChange={(v) => set("currentStatus", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.emoji} {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Why do you want to learn English?">
              <Select value={draft.englishReason} onValueChange={(v) => set("englishReason", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.emoji} {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* ── Goals ── */}
          <Field label="Goals">
            <textarea
              value={draft.goals}
              onChange={(e) => set("goals", e.target.value)}
              placeholder="What do you want to achieve?"
              maxLength={280}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-heading shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            />
            <p className="mt-1 text-right text-[10px] text-muted-foreground">{draft.goals.length}/280</p>
          </Field>

          {/* ── Hobbies ── */}
          <Field label={`Hobbies (${draft.hobbies.length}/10)`}>
            <div className="flex flex-wrap gap-2">
              {HOBBY_SUGGESTIONS.map((h) => {
                const active = draft.hobbies.some((x) => x.toLowerCase() === h.toLowerCase());
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHobby(h)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-primary text-[#0b0e14]"
                        : "border border-white/[0.06] bg-surface-2/60 text-muted-foreground hover:text-heading",
                    )}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <DialogFooter className="border-t border-white/[0.06] px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// buildSeeds mirrors AvatarPicker's seed generator so the same (email,
// style, nonce) yields a stable, personalised grid of DiceBear options.
function buildSeeds(email: string, style: AvatarStyle, nonce: number): string[] {
  const base = (email.split("@")[0] || "user").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24) || "user";
  const out: string[] = [];
  for (let i = 0; i < 8; i++) {
    out.push(`${base}-${style.charAt(0)}${nonce}${i}`);
  }
  return out;
}
