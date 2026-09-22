import "server-only";

import { after } from "next/server";
import { createHash } from "node:crypto";

import { SUPPORT_CATEGORIES, supportCategoryLabel } from "@/lib/supportCategories";

import { escapeHtml, sendEmail } from "../email";
import { env } from "../env";
import { requireInternal, verifyToken, type AuthedUser } from "../guards";
import { ApiFailure, fail, int, ok, readJson, str } from "../http";
import type { Router } from "../router";
import { db, must } from "../supabase";

// Customer support ("Something wrong?" panel — DECISIONS D-029).
//   POST  /support              anyone (signed in or not); stored + emailed via Resend
//   GET   /admin/support        admin inbox
//   PATCH /admin/support/:id    { status: "open" | "resolved" }

const PER_HOUR = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function ipHash(req: Request): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  return ip ? createHash("sha256").update(ip).digest("hex").slice(0, 24) : "";
}

export function registerSupportRoutes(r: Router) {
  r.on("POST", "/support", async ({ req }) => {
    // Signed-in learners are identified automatically; guests must give an email.
    let user: AuthedUser | null = null;
    if (req.headers.get("authorization")) {
      try {
        user = await verifyToken(req);
      } catch {
        user = null;
      }
    }
    const body = await readJson(req);
    const category = str(body.category, "category", { required: true, max: 40 });
    if (!SUPPORT_CATEGORIES.some((c) => c.id === category)) throw fail.badRequest("Pick what went wrong.", { category: "invalid" });
    const message = str(body.message, "message", { required: true, max: 4000 });
    if (message.length < 5) throw fail.badRequest("Please describe the problem in a few words.", { message: "too_short" });
    const page = str(body.page, "page", { max: 300 });

    let email = str(body.email, "email", { max: 254 }).toLowerCase();
    let name = str(body.name, "name", { max: 80 });
    if (user) {
      const { data: p } = await db().from("profiles").select("email, name").eq("id", user.id).maybeSingle();
      email = (p?.email as string) || user.email || email;
      name = (p?.name as string) || name;
    }
    if (!email || !EMAIL_RE.test(email)) throw fail.badRequest("Please add your email so we can reply.", { email: "invalid" });

    // Rate limit per account or per IP.
    const since = new Date(Date.now() - 3600_000).toISOString();
    const hash = ipHash(req);
    let q = db().from("support_tickets").select("id", { count: "exact", head: true }).gte("created_at", since);
    q = user ? q.eq("user_id", user.id) : q.eq("ip_hash", hash);
    const { count } = await q;
    if ((count ?? 0) >= PER_HOUR) {
      throw new ApiFailure(429, "SUPPORT_RATE_LIMITED", "You've sent several reports already — we'll get back to you soon.");
    }

    const ticket = must(
      await db()
        .from("support_tickets")
        .insert({
          user_id: user?.id ?? null,
          email,
          name,
          category,
          message,
          page,
          user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
          ip_hash: hash,
        })
        .select("id, created_at")
        .single(),
      "save ticket",
    ) as { id: number; created_at: string };

    // Email the team after responding (never makes the learner wait).
    after(async () => {
      const to = env.resend()?.to ?? [];
      const label = supportCategoryLabel(category);
      const res = await sendEmail({
        to,
        replyTo: email,
        subject: `[Support #${ticket.id}] ${label} — ${name || email}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
          <h2 style="margin:0 0 8px">New support ticket #${ticket.id}</h2>
          <p><b>Type:</b> ${escapeHtml(label)}<br/>
          <b>From:</b> ${escapeHtml(name || "—")} &lt;${escapeHtml(email)}&gt;${user ? " (signed in)" : " (guest)"}<br/>
          <b>Page:</b> ${escapeHtml(page || "—")}<br/>
          <b>When:</b> ${new Date(ticket.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
          <pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:8px">${escapeHtml(message)}</pre>
          <p style="color:#666;font-size:12px">Reply to this email to answer the learner. Inbox: /v3/admin/support</p>
        </div>`,
      });
      await db()
        .from("support_tickets")
        .update({ emailed: res.ok, email_error: res.ok ? null : res.error ?? "unknown" })
        .eq("id", ticket.id);
      if (!res.ok) console.error(`[support] email for ticket ${ticket.id} failed: ${res.error}`);
    });

    return ok({ ticketId: ticket.id }, "Thanks! We've got your report and will get back to you soon.");
  });

  r.on("GET", "/admin/support", async ({ req, query }) => {
    await requireInternal(req);
    const status = query.get("status");
    const limit = int(query.get("limit"), "limit", { min: 1, max: 500, fallback: 200 });
    let q = db().from("support_tickets").select("*").order("created_at", { ascending: false }).limit(limit);
    if (status === "open" || status === "resolved") q = q.eq("status", status);
    const rows = must(await q, "list tickets") as Record<string, unknown>[];
    const { count: open } = await db().from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open");
    return ok({
      openCount: open ?? 0,
      tickets: rows.map((t) => ({
        id: t.id,
        email: t.email,
        name: t.name,
        category: t.category,
        categoryLabel: supportCategoryLabel(String(t.category)),
        message: t.message,
        page: t.page,
        userAgent: t.user_agent,
        status: t.status,
        emailed: t.emailed,
        emailError: t.email_error,
        signedIn: !!t.user_id,
        createdAt: t.created_at,
        resolvedAt: t.resolved_at,
      })),
    });
  });

  r.on("PATCH", "/admin/support/:id", async ({ req, params }) => {
    await requireInternal(req);
    const body = await readJson(req);
    const status = body.status === "resolved" ? "resolved" : "open";
    must(
      await db()
        .from("support_tickets")
        .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
        .eq("id", Number(params.id))
        .select("id"),
      "update ticket",
    );
    return ok(null, status === "resolved" ? "Marked resolved" : "Reopened");
  });
}
