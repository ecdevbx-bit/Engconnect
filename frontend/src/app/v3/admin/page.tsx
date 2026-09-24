import Link from "next/link";
import { redirect } from "next/navigation";

import { FLAG_LEARN, flagEnabled } from "@/server/viewer";

import LearnToggleCard from "./LearnToggleCard";
import { NotAdminError, requireAdmin } from "./problems/adminAuth";

// /v3/admin — landing page linking every admin tool.
export const dynamic = "force-dynamic";

const TOOLS = [
  { href: "/v3/admin/pro-trials", title: "Pro applications", body: "Learners who applied for Pro — approve or don't approve; program end date and cap." },
  { href: "/v3/admin/support", title: "Support inbox", body: "\"Something wrong?\" reports from learners (also emailed to you). Mark resolved." },
  { href: "/v3/admin/wiki", title: "Wiki & memory", body: "The product + architecture wiki, current status, every decision and the knowledge graph." },
  { href: "/v3/admin/keys", title: "Gemini keys", body: "Live status of every API key: in rotation, cooling down, quota used, invalid. Add, test, disable." },
  { href: "/v3/admin/problems", title: "Content", body: "Jumble sentences and pronunciation phrases — add, reorder, activate, bulk upload." },
  { href: "/v3/admin/ai-partner", title: "AI Partner", body: "Talk-time XP rules, session length, Pro daily / free weekly time caps." },
  { href: "/v3/admin/pronunciation", title: "Pronunciation timings", body: "Countdown and recording length per difficulty." },
  { href: "/v3/admin/jumble", title: "Jumble settings", body: "Bonus XP for completing a progressive set." },
  { href: "/v3/admin/levels", title: "Levels", body: "XP thresholds, titles and icons of the level ladder." },
  { href: "/v3/admin/badges", title: "Badges", body: "XP, streak, combo and progressive-set badge thresholds." },
  { href: "/v3/admin/feature-flags", title: "Feature flags", body: "Turn Pronunciation, Word Bank, AI Partner, the Learn library, etc. on or off." },
  { href: "/v3/admin/pro-invite", title: "Pro invite link", body: "The public /pro link: on/off, dates, redemption cap, sign-ups." },
];

export default async function AdminHome() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }
  const learnOn = await flagEnabled(FLAG_LEARN, false);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Admin</h1>
      <p className="mb-8 text-sm text-muted-foreground">Everything you can configure without a deploy.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <LearnToggleCard initialOn={learnOn} />
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-5 transition hover:border-primary/40 hover:bg-surface-2/70"
          >
            <p className="font-bold text-heading">{t.title} →</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
