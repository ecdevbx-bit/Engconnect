import type { TableVisual } from "@/content/learn/types";

import { Inline } from "../Inline";

// Compact comparison table — real table markup. The first column is a row
// header unless the columns are equals (`peer`). On a narrow phone a wide
// table scrolls inside its own box; the page itself never scrolls sideways.
export function CompareTable({ v }: { v: TableVisual }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[16rem] border-separate border-spacing-0 text-left text-sm">
        {v.caption && <caption className="sr-only">{v.caption}</caption>}
        <thead>
          <tr>
            {v.head.map((h, i) => (
              <th
                key={i}
                scope="col"
                className={`border-b border-border bg-surface-2 px-3 py-2 align-bottom text-xs font-bold text-heading ${
                  i === 0 ? "rounded-tl-lg" : ""
                } ${i === v.head.length - 1 ? "rounded-tr-lg" : ""}`}
              >
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {v.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) =>
                ci === 0 && !v.peer ? (
                  <th key={ci} scope="row" className="border-b border-border px-3 py-2.5 align-top font-semibold text-heading">
                    <Inline text={cell} />
                  </th>
                ) : (
                  <td key={ci} className={`border-b border-border px-3 py-2.5 align-top ${v.peer ? "text-heading" : "text-body"}`}>
                    <Inline text={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
