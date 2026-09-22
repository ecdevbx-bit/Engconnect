import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../../problems/adminAuth";
import WikiMarkdown from "../WikiMarkdown";
import WikiNav from "../WikiNav";
import { WIKI, connections, getPage, graphData, hrefFor, linkify, navGroups } from "../wiki";

// /v3/admin/wiki/[...page] — the product + architecture wiki and the project
// memory (status, decisions, knowledge graph), readable by admins in the app.
export const dynamic = "force-dynamic";

export default async function AdminWikiPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  const links = connections(page.id);
  const built = new Date(WIKI.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link href="/v3/admin" className="hover:text-heading">Admin</Link> / <Link href={hrefFor("index")} className="hover:text-heading">Wiki</Link>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-heading">Wiki &amp; memory</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["memory/status", "Status"],
            ["memory/decisions", "Decisions"],
            ["meta/graph", "Graph"],
          ].map(([id, label]) => (
            <Link
              key={id}
              href={hrefFor(id)}
              className="inline-flex min-h-11 items-center rounded-full border border-white/[0.08] bg-surface-2/40 px-4 text-sm font-semibold text-heading transition-colors hover:border-primary/40"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <WikiNav groups={navGroups()} currentId={page.id} />

        <article className="min-w-0 rounded-2xl border border-white/[0.08] bg-surface-2/20 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold capitalize text-primary">{page.type}</span>
            {page.tags.map((t) => (
              <span key={t} className="rounded-full border border-white/[0.08] px-2.5 py-1">
                {t}
              </span>
            ))}
            {page.updated && <span>Updated {page.updated}</span>}
            <span className="font-mono">{page.path}</span>
          </div>

          <WikiMarkdown markdown={linkify(page.body)} graph={graphData()} currentId={page.id} />

          {(links.linksTo.length > 0 || links.linkedFrom.length > 0 || links.decisions.length > 0) && (
            <section aria-label="Connections" className="mt-10 grid gap-5 border-t border-white/[0.08] pt-6 md:grid-cols-3">
              {[
                { label: "Links to", items: links.linksTo.map((l) => ({ ...l, note: "" })) },
                { label: "Linked from", items: links.linkedFrom.map((l) => ({ ...l, note: "" })) },
                {
                  label: "Decisions",
                  items: links.decisions.map((d) => ({ id: d.id, title: `${d.id} · ${d.title}`, note: d.status === "superseded" ? "superseded" : "" })),
                },
              ]
                .filter((c) => c.items.length)
                .map((c) => (
                  <div key={c.label}>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                    <ul className="space-y-1">
                      {c.items.map((it) => (
                        <li key={it.id}>
                          <Link href={hrefFor(it.id)} className="text-sm text-body hover:text-primary">
                            {it.title}
                            {it.note && <span className="ml-1 text-xs text-muted-foreground">({it.note})</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </section>
          )}

          <p className="mt-8 text-xs text-muted-foreground">
            Snapshot built {built} IST from <span className="font-mono">docs/</span> · refresh with{" "}
            <span className="font-mono">node docs/wiki/build-graph.mjs</span> and deploy.
            {WIKI.lint.length > 0 && ` · ${WIKI.lint.length} lint issue(s) — see the Graph page.`}
          </p>
        </article>
      </div>
    </div>
  );
}
