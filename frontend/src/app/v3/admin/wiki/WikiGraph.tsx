"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

// Interactive map of the project memory: wiki pages in columns by kind, plus
// (optionally) the decision log. Hover or focus a node to light up everything
// it connects to; click to open it. Plain SVG — no graph library.

type Node = { id: string; title: string; type: string; href: string };
type Edge = { source: string; target: string; kind: string };

const COLUMNS: { label: string; match: (n: Node) => boolean }[] = [
  { label: "Start & memory", match: (n) => ["index", "overview", "memory", "log"].includes(n.type) },
  { label: "Features", match: (n) => n.type === "feature" },
  { label: "Architecture", match: (n) => n.type === "architecture" },
  { label: "Operations & meta", match: (n) => n.type === "operations" || n.type === "meta" },
  { label: "Decisions", match: (n) => n.type === "decision" },
];

const NODE_W = 184;
const NODE_H = 28;
const COL_W = 244;
const ROW_H = 36;
const TOP = 34;

// The index and the log link to everything — drawing those edges hides the real structure.
const HUBS = new Set(["index", "log"]);

export default function WikiGraph({ data, currentId }: { data: { nodes: Node[]; edges: Edge[] }; currentId?: string }) {
  const router = useRouter();
  const [showDecisions, setShowDecisions] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const focus = hover ?? currentId ?? null;

  const layout = useMemo(() => {
    const cols = COLUMNS.filter((c) => showDecisions || c.label !== "Decisions");
    const pos = new Map<string, { x: number; y: number; node: Node }>();
    cols.forEach((c, ci) => {
      data.nodes
        .filter(c.match)
        .forEach((n, ri) => pos.set(n.id, { x: 12 + ci * COL_W, y: TOP + ri * ROW_H, node: n }));
    });
    const edges = data.edges.filter((e) => pos.has(e.source) && pos.has(e.target) && !HUBS.has(e.source));
    const rows = Math.max(...cols.map((c) => data.nodes.filter(c.match).length), 1);
    return { cols, pos, edges, width: cols.length * COL_W, height: TOP + rows * ROW_H + 8 };
  }, [data, showDecisions]);

  const neighbours = useMemo(() => {
    const set = new Set<string>();
    if (!focus) return set;
    set.add(focus);
    for (const e of layout.edges) {
      if (e.source === focus) set.add(e.target);
      if (e.target === focus) set.add(e.source);
    }
    return set;
  }, [focus, layout.edges]);

  const path = (e: Edge) => {
    const a = layout.pos.get(e.source)!;
    const b = layout.pos.get(e.target)!;
    const ay = a.y + NODE_H / 2;
    const by = b.y + NODE_H / 2;
    if (a.x === b.x) {
      // same column: loop out to the right
      const x = a.x + NODE_W;
      const bulge = 28 + Math.min(Math.abs(by - ay) / 6, 40);
      return `M${x} ${ay} C${x + bulge} ${ay}, ${x + bulge} ${by}, ${x} ${by}`;
    }
    const forward = b.x > a.x;
    const x1 = forward ? a.x + NODE_W : a.x;
    const x2 = forward ? b.x : b.x + NODE_W;
    const mid = (x1 + x2) / 2;
    return `M${x1} ${ay} C${mid} ${ay}, ${mid} ${by}, ${x2} ${by}`;
  };

  return (
    <div className="my-5 rounded-2xl border border-white/[0.08] bg-surface-2/30 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs text-muted-foreground">Hover or tap a page to see its connections · click to open</p>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-heading">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={showDecisions}
            onChange={(e) => setShowDecisions(e.target.checked)}
          />
          Show decisions
        </label>
      </div>
      <div className="overflow-x-auto">
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Knowledge graph of wiki pages and decisions"
          className="block"
        >
          {layout.cols.map((c, ci) => (
            <text key={c.label} x={12 + ci * COL_W} y={16} className="fill-muted-foreground text-[11px] font-semibold uppercase">
              {c.label}
            </text>
          ))}
          <g fill="none">
            {layout.edges.map((e, i) => {
              const lit = focus !== null && (e.source === focus || e.target === focus);
              return (
                <path
                  key={i}
                  d={path(e)}
                  className={cn(
                    "transition-[stroke-opacity] duration-150",
                    e.kind === "links" ? "stroke-primary" : "stroke-cyan",
                  )}
                  strokeWidth={lit ? 1.6 : 1}
                  strokeOpacity={focus === null ? 0.18 : lit ? 0.85 : 0.04}
                  strokeDasharray={e.kind === "links" ? undefined : "3 3"}
                />
              );
            })}
          </g>
          {[...layout.pos.values()].map(({ x, y, node }) => {
            const dim = focus !== null && !neighbours.has(node.id);
            const isFocus = node.id === focus;
            const label = node.title.length > 26 ? `${node.title.slice(0, 25)}…` : node.title;
            return (
              <g
                key={node.id}
                transform={`translate(${x} ${y})`}
                role="link"
                tabIndex={0}
                aria-label={node.title}
                className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-primary"
                opacity={dim ? 0.3 : 1}
                onMouseEnter={() => setHover(node.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(node.id)}
                onBlur={() => setHover(null)}
                onClick={() => router.push(node.href)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(node.href);
                }}
              >
                <title>{node.title}</title>
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={9}
                  className={cn(
                    "transition-colors duration-150",
                    isFocus ? "fill-primary stroke-primary" : "fill-surface-2 stroke-white/15",
                  )}
                  strokeWidth={1}
                />
                <text
                  x={10}
                  y={NODE_H / 2 + 4}
                  className={cn("text-[12px] font-medium", isFocus ? "fill-[#0b0e14]" : "fill-heading")}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
