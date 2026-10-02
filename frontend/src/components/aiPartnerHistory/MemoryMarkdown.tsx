import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// K.AI's memory file, rendered with theme tokens (no typography plugin). The
// panel already has an h2, so Markdown headings are shifted down a level to
// keep the outline in order. The file is model-written from the learner's own
// talk, so links render as plain text and images are dropped — nothing on
// this page should send the learner (or their browser) elsewhere.

const components: Components = {
  h1: ({ children }) => <h3 className="mb-2 mt-7 text-lg font-bold text-heading first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-7 text-lg font-bold text-heading first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-5 text-base font-semibold text-heading first:mt-0">{children}</h4>,
  h4: ({ children }) => <h5 className="mb-1 mt-4 text-sm font-semibold text-heading first:mt-0">{children}</h5>,
  h5: ({ children }) => <h5 className="mb-1 mt-4 text-sm font-semibold text-heading first:mt-0">{children}</h5>,
  h6: ({ children }) => <h5 className="mb-1 mt-4 text-sm font-semibold text-heading first:mt-0">{children}</h5>,
  p: ({ children }) => <p className="my-2.5 text-[15px] leading-7 text-body">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-2.5 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-body marker:text-primary">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-body marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-heading">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-primary/40 pl-4 text-muted-foreground">{children}</blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
  a: ({ children }) => <span className="font-medium text-heading">{children}</span>,
  img: () => null,
  code: ({ children }) => (
    <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-heading">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl border border-border bg-surface-2 p-3 text-[13px] leading-6 [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-2 text-heading">{children}</thead>,
  th: ({ children }) => <th className="border-b border-border px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top text-body">{children}</td>,
  input: ({ checked }) => (
    <input type="checkbox" checked={!!checked} readOnly disabled className="mr-1.5 translate-y-[1px] accent-primary" />
  ),
};

export default function MemoryMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="min-w-0 break-words">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </Markdown>
    </div>
  );
}
