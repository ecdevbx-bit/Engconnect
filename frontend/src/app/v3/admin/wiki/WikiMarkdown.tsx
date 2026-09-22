import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";

import WikiGraph from "./WikiGraph";
import type { GraphData } from "./wiki";

// Server-rendered markdown for the admin wiki. Styling lives in the component
// map (no typography plugin). ```mermaid blocks (the generated map in
// meta/graph) are replaced by the interactive <WikiGraph>.

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

// "D-012 · Gemini Live…" → "d-012" (decision anchors); otherwise a slug.
function headingId(children: ReactNode): string {
  const text = textOf(children).trim();
  const dec = /^D-\d{3}/.exec(text);
  if (dec) return dec[0].toLowerCase();
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function WikiMarkdown({ markdown, graph, currentId }: { markdown: string; graph: GraphData; currentId: string }) {
  const components: Components = {
    h1: ({ children }) => (
      <h1 id={headingId(children)} className="mb-4 scroll-mt-24 text-2xl font-extrabold text-heading md:text-3xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={headingId(children)}
        className="mt-10 mb-3 scroll-mt-24 border-b border-white/[0.08] pb-2 text-xl font-bold text-heading"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 id={headingId(children)} className="mt-7 mb-2 scroll-mt-24 text-lg font-semibold text-heading">
        {children}
      </h3>
    ),
    h4: ({ children }) => <h4 className="mt-5 mb-2 font-semibold text-heading">{children}</h4>,
    p: ({ children }) => <p className="my-3 text-[15px] leading-7 text-body">{children}</p>,
    ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-body">{children}</ul>,
    ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-body">{children}</ol>,
    li: ({ children }) => <li className="pl-1 marker:text-muted-foreground">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-heading">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-primary/50 pl-4 text-muted-foreground italic">{children}</blockquote>
    ),
    hr: () => <hr className="my-8 border-white/[0.08]" />,
    a: ({ href = "", children }) =>
      href.startsWith("/") || href.startsWith("#") ? (
        <Link href={href} className="font-medium text-primary underline-offset-2 hover:underline">
          {children}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
          {children}
        </a>
      ),
    code: ({ className, children }) => (
      <code className={`${className ?? ""} rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-heading`}>
        {children}
      </code>
    ),
    pre: ({ node, children }) => {
      const code = node?.children?.[0];
      const cls = code && code.type === "element" ? String(code.properties?.className ?? "") : "";
      if (cls.includes("language-mermaid")) return <WikiGraph data={graph} currentId={currentId} />;
      return (
        <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.08] bg-surface-2/60 p-4 text-[13px] leading-6 [&>code]:bg-transparent [&>code]:p-0">
          {children}
        </pre>
      );
    },
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-surface-2/60 text-heading">{children}</thead>,
    th: ({ children }) => <th className="border-b border-white/[0.08] px-3 py-2 font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-b border-white/[0.05] px-3 py-2 align-top text-body">{children}</td>,
    input: ({ checked }) => (
      <input type="checkbox" checked={!!checked} readOnly disabled className="mr-1.5 translate-y-[1px] accent-primary" />
    ),
  };

  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {markdown}
    </Markdown>
  );
}
