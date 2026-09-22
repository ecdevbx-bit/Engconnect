"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/session";
import {
  User,
  Mail,
  MapPin,
  Phone,
  Globe2,
  Briefcase,
  MessageCircle,
  Target,
  Sparkles,
  Zap,
  Crown,
  Pencil,
  type LucideIcon,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import MyBadges from "./MyBadges";
import EditProfileDialog from "./profile/EditProfileDialog";
import { v3FetchMyProfile, avatarUrl, type V3MeProfile } from "@/lib/v3Game";
import { STATUS_OPTIONS, REASON_OPTIONS, NATIVE_LANG_OPTIONS } from "@/lib/v3Onboarding";
import { useAppSelector } from "@/store/hooks";
import { PlantArt, PlantArtDefs, plantStageForIndex } from "@/components/v3/plantArt";

export default function Profile() {
  const session = useSession();
  const accessToken = session.data?.user?.accessToken ?? "";
  const [profile, setProfile] = useState<V3MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  // Active-plan flag. Computed in the fetch below (Date.now() can't run during
  // render); premiumUntil (ISO) in the future = Pro.
  const [isPro, setIsPro] = useState(false);

  // XP / level always come from Redux — the single source of truth shared
  // with the navbar and gameplay (seeded on sign-in, refreshed each submit).
  const { totalXP, currentLevel, levels } = useAppSelector((s) => s.xp);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    // `loading` starts true; we only flip it off in the finally below.
    // (Setting it synchronously here would trip the set-state-in-effect rule.)
    v3FetchMyProfile(accessToken)
      .then((p) => {
        if (!cancelled) {
          setProfile(p);
          const until = p.premiumUntil;
          setIsPro(!!until && new Date(until).getTime() > Date.now());
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Onboarding answers rendered read-out as labelled tiles. Status / reason
  // are enum codes — map back to human labels; hobbies arrive comma-joined.
  const aboutItems = useMemo(() => {
    if (!profile) return [];
    const statusLabel =
      STATUS_OPTIONS.find((o) => o.id === profile.currentStatus)?.label || "Not set";
    const reasonLabel =
      REASON_OPTIONS.find((o) => o.id === profile.englishReason)?.label || "Not set";
    const langLabel =
      NATIVE_LANG_OPTIONS.find((o) => o.id === profile.nativeLang)?.label ||
      profile.nativeLang ||
      "Not set";
    const hobbies = (profile.hobbies || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return [
      { label: "Native language", value: langLabel, icon: Globe2 },
      { label: "Current status", value: statusLabel, icon: Briefcase },
      { label: "Why do you want to learn English?", value: reasonLabel, icon: MessageCircle },
      { label: "Goals", value: profile.goals || "Not set", icon: Target },
      { label: "Hobbies", value: hobbies.length ? hobbies.join(", ") : "Not set", icon: Sparkles },
    ];
  }, [profile]);

  // Progress between the current level threshold and the next.
  const currentLevelDef = levels.find((l) => l.level === currentLevel);
  const nextLevelDef = levels.find((l) => l.level === currentLevel + 1);
  const atMaxLevel = !nextLevelDef;
  const currentThreshold = currentLevelDef?.threshold ?? 0;
  const nextThreshold = nextLevelDef?.threshold ?? currentThreshold;
  // Plant growth stage for the current level — same mapping as the navbar chip.
  const currentLevelIndex = levels.findIndex((l) => l.level === currentLevel);
  const currentStage = plantStageForIndex(currentLevelIndex < 0 ? 0 : currentLevelIndex, levels.length);
  const range = Math.max(1, nextThreshold - currentThreshold);
  const earnedInLevel = Math.max(0, totalXP - currentThreshold);
  const progressPercentage = atMaxLevel ? 100 : Math.min(100, Math.round((earnedInLevel / range) * 100));
  const xpToNext = Math.max(0, nextThreshold - totalXP);

  const displayName = profile?.name || "—";
  const avatarSrc = avatarUrl(profile?.avatar, 192);

  // Pro-until date for the plan chip (pure formatting; isPro is state above).
  const premiumUntil = profile?.premiumUntil;
  const proUntilLabel = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Account"
        eyebrowClassName="hidden md:block"
        title="My Profile"
        description="Your account details, learning progress, and preferences."
        descriptionClassName="hidden md:block"
        icon={<User className="h-5 w-5" />}
        iconClassName="hidden md:flex"
        action={
          <div className="flex items-center gap-2">
            {/* Theme switch — surfaced on the profile page for mobile, where the
                top-nav toggle is hidden. */}
            <span className="md:hidden">
              <ThemeToggle />
            </span>
            <Button onClick={() => setEditing(true)} disabled={!profile}>
              <Pencil className="h-4 w-4" />
              Edit profile
            </Button>
          </div>
        }
      />

      {loading && !profile ? (
        <div className="c-box rounded-2xl p-12 text-center text-sm text-muted-foreground">
          Loading your profile…
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Identity + progress ── */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Identity card */}
            <div className="c-box rounded-2xl px-6 py-3 sm:px-8 sm:py-6">
              <div className="flex flex-row items-center gap-4 text-left sm:gap-6">
                {/* Avatar + an edit affordance pinned to its corner, so it's
                    obvious the profile is editable (mirrors the header button). */}
                <div className="relative shrink-0">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="h-24 w-24 rounded-2xl border border-primary/30 bg-primary/10 object-cover sm:h-28 sm:w-28"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/30 bg-primary/20 text-4xl font-bold text-heading sm:h-28 sm:w-28">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    disabled={!profile}
                    aria-label="Edit profile"
                    title="Edit profile"
                    className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-1 bg-primary text-[#0b0e14] shadow-md transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-2xl font-bold text-heading">{displayName}</h2>

                  <div className="mt-1 space-y-2">
                    <InfoLine icon={Mail} value={profile?.email || "—"} />
                    <InfoLine icon={MapPin} value={profile?.location || "Not set"} />
                    <InfoLine icon={Phone} value={profile?.phone || "Not set"} />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress card */}
            <div className="c-box rounded-2xl p-6">
              {/* Shared plant-art gradient defs for the level plant below. */}
              <PlantArtDefs />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Progress
              </h3>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-semibold text-primary">
                  <PlantArt stage={currentStage} className="h-4 w-4" /> Level {currentLevel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-pink/15 px-3 py-1.5 text-sm font-semibold text-pink">
                  <Zap className="h-4 w-4" /> {totalXP.toLocaleString()} XP
                </span>
                {isPro ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <Crown className="h-4 w-4" /> Pro until {proUntilLabel}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-3 px-3 py-1.5 text-sm font-semibold text-muted-foreground">
                    Free plan
                  </span>
                )}
              </div>
              <div className="mt-5">
                <Progress value={progressPercentage} className="h-3 bg-surface-3" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {atMaxLevel ? (
                    <>You&apos;ve hit the top of the ladder — keep playing for streaks and badges.</>
                  ) : (
                    <>
                      <span className="font-semibold text-heading">{xpToNext.toLocaleString()} XP</span>{" "}
                      to Level {currentLevel + 1}
                      {" · "}
                      {totalXP.toLocaleString()} / {nextThreshold.toLocaleString()}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── About you + Badges ──
              Desktop: About you as a single vertical list on the left, the badge
              deck (collapsed, opens on click) on the right.
              Mobile: the badge deck (already expanded) sits ABOVE About you. */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="order-2 c-box rounded-2xl p-6 sm:p-8 lg:order-1 lg:flex-1">
              <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                About you
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {aboutItems.map((item) => (
                  <InfoTile key={item.label} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            </div>

            {/* empty:hidden — when the user has no badges MyBadges renders nothing,
                so About you reclaims the full width instead of leaving a gap. */}
            <div className="order-1 empty:hidden lg:order-2 lg:w-[400px] lg:shrink-0">
              <MyBadges />
            </div>
          </div>
        </div>
      )}

      {profile && (
        <EditProfileDialog
          profile={profile}
          open={editing}
          onOpenChange={setEditing}
          onSaved={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}

function InfoLine({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-body">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-2/40 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-heading">{value}</p>
      </div>
    </div>
  );
}
