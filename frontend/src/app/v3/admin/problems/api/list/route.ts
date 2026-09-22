// Tiny API route — same auth gate + backend call as the list server
// action, but reachable via fetch() from the client so a mutation can
// refresh the list without a full page reload (revalidatePath alone
// doesn't update useState).

import { NextRequest, NextResponse } from "next/server";
import { listProblemsAction } from "../../actions";
import { NotAdminError } from "../../adminAuth";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  if (!category) {
    return NextResponse.json({ error: "category required" }, { status: 400 });
  }
  try {
    const problems = await listProblemsAction(category);
    return NextResponse.json(problems);
  } catch (err) {
    if (err instanceof NotAdminError) {
      return NextResponse.json({ error: "not authorised" }, { status: 403 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "error" }, { status: 500 });
  }
}
