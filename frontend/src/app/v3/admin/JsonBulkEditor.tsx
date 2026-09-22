"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

// JsonBulkEditor — generic textarea-based JSON editor used by both admin
// pages. Takes the current data (pretty-printed in the textarea) and an
// `apply` handler that posts to the appropriate bulk endpoint and
// returns per-item results.
//
// Two kinds of error feedback:
//   1. Client-side JSON parse failure — surfaced as a single red line
//      before any network call.
//   2. Server-side validation / per-item apply errors — rendered as a
//      list under the textarea.

export type BulkResult = {
  index: number;
  status: "created" | "updated" | "failed";
  error?: string;
};

export default function JsonBulkEditor<TItem>({
  initial,
  fieldKey,
  apply,
  onApplied,
}: {
  // Current catalog as an array of plain JS objects — caller serializes.
  initial: TItem[];
  // The top-level key the backend expects, e.g. "problems" or "badges".
  fieldKey: "problems" | "badges";
  // Server action that posts the parsed payload and returns the result.
  apply: (payload: { [k: string]: unknown[] }) => Promise<{
    ok: boolean;
    results: BulkResult[];
    message?: string;
  }>;
  // Called after a successful apply so the parent can refresh.
  onApplied: () => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(initial, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApply() {
    setParseError(null);
    setResults(null);
    setSummary(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
      return;
    }
    if (!Array.isArray(parsed)) {
      setParseError(`Top-level JSON must be an array of ${fieldKey}.`);
      return;
    }

    startTransition(async () => {
      const res = await apply({ [fieldKey]: parsed });
      setResults(res.results);
      const failed = res.results.filter((r) => r.status === "failed").length;
      const created = res.results.filter((r) => r.status === "created").length;
      const updated = res.results.filter((r) => r.status === "updated").length;
      if (!res.ok && created + updated === 0) {
        setSummary(res.message ?? `Validation failed; no writes applied (${failed} errors).`);
      } else {
        setSummary(
          `${created} created, ${updated} updated${failed > 0 ? `, ${failed} failed` : ""}.`,
        );
        if (failed === 0) onApplied();
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Edit the JSON below and apply. Items <span className="font-mono">without</span>{" "}
        an identifier ({fieldKey === "problems" ? "no order" : "no id"}) are created;
        items with one are updated. Items removed from the JSON are{" "}
        <strong>not</strong> deleted — use the UI tab to deactivate.
      </p>

      <textarea
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full min-h-[480px] font-mono text-sm rounded-xl border border-white/[0.08] bg-surface-1 p-4 leading-relaxed"
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
        {summary && <span className="text-sm text-muted-foreground">{summary}</span>}
      </div>

      {results && results.some((r) => r.status === "failed") && (
        <div className="c-box rounded-xl p-4">
          <p className="text-sm font-semibold text-heading mb-2">Failed rows</p>
          <ul className="space-y-1 text-xs text-red-600">
            {results
              .filter((r) => r.status === "failed")
              .map((r) => (
                <li key={r.index}>
                  Row {r.index}: {r.error ?? "(no error message)"}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
