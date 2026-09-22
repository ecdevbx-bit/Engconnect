"use server";

import { backendFetch, requireAdmin } from "../problems/adminAuth";

// Support inbox actions (/v3/admin/support). In-process API calls (D-018).

export type SupportTicket = {
  id: number;
  email: string;
  name: string;
  category: string;
  categoryLabel: string;
  message: string;
  page: string;
  userAgent: string;
  status: "open" | "resolved";
  emailed: boolean;
  emailError: string | null;
  signedIn: boolean;
  createdAt: string;
  resolvedAt: string | null;
};

export type SupportInbox = { openCount: number; tickets: SupportTicket[] };

type Envelope<T> = { success: boolean; message: string; data?: T };

export async function listTicketsAction(status?: "open" | "resolved"): Promise<SupportInbox> {
  await requireAdmin();
  const res = await backendFetch(`/api/admin/support${status ? `?status=${status}` : ""}`);
  const body = (await res.json()) as Envelope<SupportInbox>;
  if (!res.ok || !body.success || !body.data) throw new Error(body.message ?? "Load failed");
  return body.data;
}

export async function setTicketStatusAction(id: number, status: "open" | "resolved"): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const res = await backendFetch(`/api/admin/support/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const body = (await res.json()) as Envelope<unknown>;
  return { ok: res.ok && body.success, message: body.message };
}
