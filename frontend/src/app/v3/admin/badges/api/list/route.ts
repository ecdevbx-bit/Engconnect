import { NextResponse } from "next/server";
import { listBadgesAction } from "../../actions";
import { NotAdminError } from "../../../problems/adminAuth";

export async function GET() {
  try {
    const data = await listBadgesAction();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof NotAdminError) {
      return NextResponse.json({ error: "not authorised" }, { status: 403 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "error" }, { status: 500 });
  }
}
