"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import {
  PronunciationHistoryRow,
  v3ListPronunciationAttempts,
} from "@/lib/v3Pronunciation";

// Shows the user's lifetime best accuracy + recent attempt count. Pulls
// from /pronunciation/attempts once on mount and refreshes on prop change
// so the parent can bump a counter after each submit if it wants to force
// a refresh.

export function ProgressCard({
  accessToken,
  refreshKey = 0,
}: {
  accessToken: string;
  refreshKey?: number;
}) {
  const [rows, setRows] = useState<PronunciationHistoryRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void v3ListPronunciationAttempts(accessToken, 50)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshKey]);

  const count = rows?.length ?? 0;
  // Prefer the server-floored integer; fall back to accuracy * 100 floor
  // for legacy rows written before the field existed.
  const bestPct = rows && rows.length > 0
    ? Math.max(...rows.map((r) => r.accuracyPercent ?? Math.floor(r.accuracy * 100)))
    : 0;

  return (
    <Card className="p-3">
      <h3 className="px-2 text-sm font-semibold text-heading">Your progress</h3>
      <div className="mt-2 grid grid-cols-2 gap-3 px-2">
        <div>
          <p className="text-xs text-muted-foreground">Attempts</p>
          <p className="font-display text-xl font-bold text-heading">{count}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="font-display text-xl font-bold text-primary">
            {bestPct}%
          </p>
        </div>
      </div>
    </Card>
  );
}
