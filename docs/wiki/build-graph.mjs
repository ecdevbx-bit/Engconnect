// Build the project's GRAPH MEMORY from the wiki + decision log (DECISIONS.md D-028).
//
//   node docs/wiki/build-graph.mjs
//
// Nodes  : every wiki page (from frontmatter), every decision D-0xx, the STATUS file.
// Edges  : links     page → page      ([[wikilinks]] in the body + frontmatter `links:`)
//          cites     page → decision  (any "D-0xx" mentioned in a page)
//          supersedes decision → decision ("Supersedes D-xxx" / "superseded by D-yyy")
// Output : docs/wiki/graph.json (machine-readable, for agents/tools)
//          docs/wiki/meta/graph.md (Mermaid map, adjacency, decision index, lint report)
// Lint   : broken links, frontmatter/body link mismatches, orphan pages.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const wikiDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(wikiDir, "../..");
const decisionsFile = path.join(root, "docs/memory/DECISIONS.md");
const statusFile = path.join(root, "docs/memory/STATUS.md");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith(".md") ? [p] : [];
  });
}

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else v = v.replace(/^["']|["']$/g, "");
    meta[kv[1]] = v;
  }
  return { meta, body: text.slice(m[0].length) };
}

const LINK_RE = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
const DEC_RE = /\bD-(\d{3})\b/g;
const uniq = (a) => [...new Set(a)];

// ── pages ──────────────────────────────────────────────────────────
const pages = walk(wikiDir)
  .filter((f) => path.relative(wikiDir, f).replace(/\\/g, "/") !== "meta/graph.md")
  .map((file) => {
    const rel = path.relative(wikiDir, file).replace(/\\/g, "/");
    const id = rel.replace(/\.md$/, "");
    const text = fs.readFileSync(file, "utf8");
    const { meta, body } = parseFrontmatter(text);
    // Ignore `inline code` and ``` fences — they hold link *examples*, not links.
    const prose = body.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
    const bodyLinks = uniq([...prose.matchAll(LINK_RE)].map((m) => m[1].trim()));
    const fmLinks = Array.isArray(meta.links) ? meta.links : [];
    const decisions = uniq([...text.matchAll(DEC_RE)].map((m) => `D-${m[1]}`));
    return {
      id,
      title: meta.title || id,
      type: meta.type || "page",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      updated: meta.updated || "",
      path: `docs/wiki/${rel}`,
      bodyLinks,
      fmLinks,
      decisions,
    };
  });
// The generated map page is an output, not an input — but pages may link to it.
pages.push({
  id: "meta/graph",
  title: "Knowledge graph",
  type: "meta",
  tags: ["graph", "memory"],
  updated: new Date().toISOString().slice(0, 10),
  path: "docs/wiki/meta/graph.md",
  bodyLinks: ["index", "meta/how-this-wiki-works"],
  fmLinks: ["index", "meta/how-this-wiki-works"],
  decisions: [],
});
const pageIds = new Set(pages.map((p) => p.id));

// ── decisions ──────────────────────────────────────────────────────
const decText = fs.existsSync(decisionsFile) ? fs.readFileSync(decisionsFile, "utf8") : "";
const decisions = [];
for (const block of decText.split(/\n(?=## D-\d{3})/)) {
  const h = /^## (D-\d{3}) · (.+?)(?: — (\d{4}-\d{2}-\d{2}))?\s*$/m.exec(block);
  if (!h) continue;
  const supersededBy = /superseded by (D-\d{3})/i.exec(block)?.[1] ?? null;
  const supersedes = uniq([...block.matchAll(/Supersedes (D-\d{3})/gi)].map((m) => m[1]));
  const cites = uniq([...block.matchAll(DEC_RE)].map((m) => `D-${m[1]}`)).filter((d) => d !== h[1]);
  decisions.push({ id: h[1], title: h[2].trim(), date: h[3] ?? "", status: supersededBy ? "superseded" : "active", supersededBy, supersedes, cites });
}
const decIds = new Set(decisions.map((d) => d.id));

// ── status (working memory) ────────────────────────────────────────
const statusText = fs.existsSync(statusFile) ? fs.readFileSync(statusFile, "utf8") : "";
const statusNode = {
  id: "memory/status",
  title: "Status (working memory)",
  type: "memory",
  path: "docs/memory/STATUS.md",
  decisions: uniq([...statusText.matchAll(DEC_RE)].map((m) => `D-${m[1]}`)),
};

// ── edges ──────────────────────────────────────────────────────────
const edges = [];
const lint = [];
for (const p of pages) {
  for (const t of uniq([...p.bodyLinks, ...p.fmLinks])) {
    if (!pageIds.has(t)) lint.push(`broken link: [[${t}]] in ${p.path}`);
    else if (t !== p.id) edges.push({ source: p.id, target: t, kind: "links" });
  }
  for (const t of p.bodyLinks) if (!p.fmLinks.includes(t) && p.type !== "index" && p.type !== "log") lint.push(`frontmatter links: missing "${t}" in ${p.path}`);
  for (const d of p.decisions) {
    if (decIds.has(d)) edges.push({ source: p.id, target: d, kind: "cites" });
    else lint.push(`unknown decision ${d} cited in ${p.path}`);
  }
}
for (const d of decisions) {
  for (const s of d.supersedes) edges.push({ source: d.id, target: s, kind: "supersedes" });
  if (d.supersededBy && !d.supersedes.length) edges.push({ source: d.supersededBy, target: d.id, kind: "supersedes" });
}
for (const d of statusNode.decisions) if (decIds.has(d)) edges.push({ source: statusNode.id, target: d, kind: "cites" });
const dedup = uniq(edges.map((e) => JSON.stringify(e))).map((s) => JSON.parse(s));

const inbound = new Map();
for (const e of dedup) if (e.kind === "links") inbound.set(e.target, (inbound.get(e.target) ?? 0) + 1);
for (const p of pages) if (p.id !== "index" && !inbound.get(p.id)) lint.push(`orphan page (nothing links to it): ${p.path}`);

// ── graph.json ─────────────────────────────────────────────────────
const graph = {
  generatedAt: new Date().toISOString(),
  about: "English Connection project memory graph. Regenerate: node docs/wiki/build-graph.mjs",
  nodes: [
    ...pages.map(({ bodyLinks, fmLinks, decisions: _d, ...n }) => n),
    ...decisions.map((d) => ({ id: d.id, title: d.title, type: "decision", date: d.date, status: d.status, path: "docs/memory/DECISIONS.md" })),
    { id: statusNode.id, title: statusNode.title, type: statusNode.type, path: statusNode.path },
  ],
  edges: dedup,
  lint,
};
fs.writeFileSync(path.join(wikiDir, "graph.json"), JSON.stringify(graph, null, 2) + "\n");

// ── meta/graph.md ──────────────────────────────────────────────────
const mid = (id) => id.replace(/[^A-Za-z0-9]/g, "_");
const byType = {};
for (const p of pages) (byType[p.type] ??= []).push(p);
const mermaid = [
  "```mermaid",
  "flowchart LR",
  ...Object.entries(byType).flatMap(([type, ps]) => [
    `  subgraph ${type}`,
    ...ps.map((p) => `    ${mid(p.id)}["${p.title.replace(/"/g, "'")}"]`),
    "  end",
  ]),
  ...dedup.filter((e) => e.kind === "links" && e.source !== "index" && e.source !== "log").map((e) => `  ${mid(e.source)} --> ${mid(e.target)}`),
  "```",
];
const citeRows = pages
  .filter((p) => p.decisions.length)
  .map((p) => `| [[${p.id}]] | ${p.decisions.join(", ")} |`);
const decRows = decisions.map((d) => {
  const citedBy = dedup.filter((e) => e.kind === "cites" && e.target === d.id).map((e) => e.source);
  return `| ${d.id} | ${d.title.replace(/\|/g, "/")} | ${d.status}${d.supersededBy ? ` → ${d.supersededBy}` : ""} | ${citedBy.length ? citedBy.map((s) => `[[${s}]]`).join(" ") : "—"} |`;
});
const md = `---
title: Knowledge graph
type: meta
tags: [graph, memory]
links: [index, meta/how-this-wiki-works]
updated: ${new Date().toISOString().slice(0, 10)}
---

# Knowledge graph (generated — do not edit by hand)

Regenerate with \`node docs/wiki/build-graph.mjs\`. Machine-readable version: \`docs/wiki/graph.json\`
(${graph.nodes.length} nodes · ${dedup.length} edges). See [[index]] and [[meta/how-this-wiki-works]].

## Map of pages
${mermaid.join("\n")}

## Which pages cite which decisions
| Page | Decisions |
|---|---|
${citeRows.join("\n")}

## Decisions (from docs/memory/DECISIONS.md)
| Id | Decision | Status | Cited by |
|---|---|---|---|
${decRows.join("\n")}

## Lint
${lint.length ? lint.map((l) => `- ${l}`).join("\n") : "- ✅ no broken links, mismatches or orphans"}
`;
fs.mkdirSync(path.join(wikiDir, "meta"), { recursive: true });
fs.writeFileSync(path.join(wikiDir, "meta/graph.md"), md);

console.log(`graph: ${pages.length} pages, ${decisions.length} decisions, ${dedup.length} edges, ${lint.length} lint issue(s)`);
for (const l of lint) console.log("  - " + l);
