import { redirect } from "next/navigation";
import { NotAdminError, requireAdmin } from "./adminAuth";
import { listProblemsAction, type Problem } from "./actions";
import ProblemsAdminClient from "./ProblemsAdminClient";

// Admin page — server component. Two responsibilities:
//
//   1. Hard auth gate: must be a NextAuth session AND email must be in
//      ADMIN_EMAILS. Non-admins get bounced to /login.
//   2. Server-side fetch of the initial problem list (per category) so
//      the client component renders with real data on first paint.

const CATEGORIES = ["jumble", "pronunciation"] as const;

export default async function AdminProblemsPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  // Load all categories in parallel so the page renders in one round.
  const entries = await Promise.all(
    CATEGORIES.map(async (cat) => {
      try {
        const problems = await listProblemsAction(cat);
        return [cat, problems] as const;
      } catch {
        return [cat, [] as Problem[]] as const;
      }
    }),
  );
  const initialByCategory = Object.fromEntries(entries) as Record<string, Problem[]>;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Problems</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Add, reorder, and deactivate problems for v3. Order is minted by the
        backend — newest go to the end of each difficulty.
      </p>
      <ProblemsAdminClient initialByCategory={initialByCategory} categories={[...CATEGORIES]} />
    </div>
  );
}
