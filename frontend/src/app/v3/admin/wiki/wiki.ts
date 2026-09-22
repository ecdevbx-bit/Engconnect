import "server-only";

import bundle from "@/generated/wiki-bundle.json";

// The admin wiki (/v3/admin/wiki) reads a snapshot of docs/wiki + docs/memory
// that `node docs/wiki/build-graph.mjs` writes to src/generated/wiki-bundle.json
// (the app deploys from frontend/ only, so it can't read docs/ at runtime).
// Server-only: pages are rendered on the server after the admin check.

export type WikiPage = {
  id: string;
  title: string;
  type: string;
  tags: string[];
  updated: string;
  path: string;
  body: string;
};
export type WikiEdge = { source: string; target: string; kind: "links" | "cites" | "supersedes" };
export type WikiDecision = { id: string; title: string; date: string; status: string; supersededBy: string | null };

export const WIKI = bundle as unknown as {
  generatedAt: string;
  pages: WikiPage[];
  decisions: WikiDecision[];
  edges: WikiEdge[];
  lint: string[];
};

export const WIKI_BASE = "/v3/admin/wiki";

const isDecision = (id: string) => /^D-\d{3}$/.test(id);

export function hrefFor(id: string): string {
  if (isDecision(id)) return `${WIKI_BASE}/memory/decisions#${id.toLowerCase()}`;
  return id === "index" ? WIKI_BASE : `${WIKI_BASE}/${id}`;
}

export function titleOf(id: string): string {
  if (isDecision(id)) return `${id} · ${WIKI.decisions.find((d) => d.id === id)?.title ?? ""}`;
  return WIKI.pages.find((p) => p.id === id)?.title ?? id;
}

export function getPage(slug: string[] | undefined): WikiPage | undefined {
  const id = slug?.length ? slug.map(decodeURIComponent).join("/") : "index";
  return WIKI.pages.find((p) => p.id === id);
}

// Sidebar sections, in reading order.
const GROUPS: { label: string; match: (p: WikiPage) => boolean }[] = [
  { label: "Start here", match: (p) => p.id === "index" || p.id === "overview" },
  { label: "Memory", match: (p) => p.type === "memory" || p.type === "log" },
  { label: "Features", match: (p) => p.type === "feature" },
  { label: "Architecture", match: (p) => p.type === "architecture" },
  { label: "Operations", match: (p) => p.type === "operations" },
  { label: "About this wiki", match: (p) => p.type === "meta" },
];

export type NavGroup = { label: string; pages: { id: string; title: string; href: string }[] };

export function navGroups(): NavGroup[] {
  const used = new Set<string>();
  const groups = GROUPS.map((g) => {
    const pages = WIKI.pages.filter((p) => !used.has(p.id) && g.match(p));
    pages.forEach((p) => used.add(p.id));
    return { label: g.label, pages: pages.map((p) => ({ id: p.id, title: p.title, href: hrefFor(p.id) })) };
  });
  const rest = WIKI.pages.filter((p) => !used.has(p.id));
  if (rest.length) groups.push({ label: "Other", pages: rest.map((p) => ({ id: p.id, title: p.title, href: hrefFor(p.id) })) });
  return groups.filter((g) => g.pages.length);
}

export type Connections = {
  linksTo: { id: string; title: string }[];
  linkedFrom: { id: string; title: string }[];
  decisions: { id: string; title: string; status: string }[];
};

export function connections(id: string): Connections {
  const out = WIKI.edges.filter((e) => e.source === id);
  const inbound = WIKI.edges.filter((e) => e.target === id && e.kind === "links");
  const page = (x: string) => ({ id: x, title: titleOf(x) });
  return {
    linksTo: out.filter((e) => e.kind === "links").map((e) => page(e.target)),
    linkedFrom: inbound.map((e) => page(e.source)),
    decisions: out
      .filter((e) => e.kind === "cites")
      .map((e) => WIKI.decisions.find((d) => d.id === e.target))
      .filter((d): d is WikiDecision => !!d)
      .map((d) => ({ id: d.id, title: d.title, status: d.status })),
  };
}

// Data for the interactive graph (pages + decisions + edges).
export function graphData() {
  return {
    nodes: [
      ...WIKI.pages.map((p) => ({ id: p.id, title: p.title, type: p.type, href: hrefFor(p.id) })),
      ...WIKI.decisions.map((d) => ({ id: d.id, title: `${d.id} ${d.title}`, type: "decision", href: hrefFor(d.id) })),
    ],
    edges: WIKI.edges,
  };
}
export type GraphData = ReturnType<typeof graphData>;

// [[id]] / [[id|label]] and bare D-0xx → markdown links. Code spans and fenced
// blocks are left alone (they hold link *examples*); headings keep their D-ids
// as plain text so they can serve as anchors.
export function linkify(md: string): string {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((chunk, i) =>
      i % 2
        ? chunk
        : chunk
            .split(/(`[^`\n]*`)/g)
            .map((part, j) => (j % 2 ? part : linkProse(part)))
            .join(""),
    )
    .join("");
}

function linkProse(s: string): string {
  const withWikiLinks = s.replace(/\[\[([^\]|#]+)(?:[|#]([^\]]*))?\]\]/g, (_m, rawId: string, label?: string) => {
    const id = rawId.trim();
    const text = (label?.trim() || titleOf(id)).replace(/[[\]]/g, "");
    return `[${text}](${hrefFor(id)})`;
  });
  return withWikiLinks
    .split("\n")
    .map((line) =>
      /^#{1,6}\s/.test(line) ? line : line.replace(/(?<![\w/#[-])D-\d{3}\b(?![^[]*\])/g, (m) => `[${m}](${hrefFor(m)})`),
    )
    .join("\n");
}
