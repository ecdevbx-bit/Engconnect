"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

// JsonDocEditor — generic whole-document JSON editor. Unlike JsonBulkEditor
// (an array of items with per-row create/update results), this edits ONE
// document — an object or an array — and saves it wholesale via `apply`.
//
// Used by the config editors (levels, AI-partner rewards, pronunciation
// timings) so every admin editor offers a JSON view + editor next to its
// form UI, matching the problems/badges editors.
export default function JsonDocEditor<T>({
  initial,
  apply,
  hint,
}: {
  initial: T;
  apply: (parsed: T) => Promise<{ ok: boolean; message?: string }>;
  hint?: string;
}) {
  const [text, setText] = useState(() => JSON.stringify(initial, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleApply() {
    setParseError(null);
    setSummary(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
      return;
    }

    startTransition(async () => {
      const res = await apply(parsed as T);
      setOk(res.ok);
      setSummary(res.message ?? (res.ok ? "Saved." : "Save failed."));
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {hint ?? "Edit the JSON below and apply. The whole document is replaced on save."}
      </p>

      <textarea
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full min-h-[420px] font-mono text-sm rounded-xl border border-white/[0.08] bg-surface-1 p-4 leading-relaxed"
      />

      {parseError && (
        <p className="text-sm text-red-600">
          <strong>JSON parse error:</strong> {parseError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleApply} disabled={pending}>
          {pending ? "Applying…" : "Apply changes"}
        </Button>
        {summary && (
          <span className={`text-sm ${ok ? "text-green-400" : "text-red-400"}`}>{summary}</span>
        )}
      </div>
    </div>
  );
}
