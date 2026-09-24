import type { Visual as VisualData } from "@/content/learn/types";

import { Inline } from "../Inline";
import { Blocks } from "./Blocks";
import { CompareTable } from "./CompareTable";
import { Formula } from "./Formula";
import { Scale } from "./Scale";
import { Timeline } from "./Timeline";
import { Transform } from "./Transform";

// One frame for every lesson visual (server component — no JS shipped).
export function Visual({ visual }: { visual: VisualData }) {
  return (
    <figure className="c-box overflow-hidden rounded-2xl p-4 sm:p-5">
      {render(visual)}
      {visual.caption && (
        <figcaption className="mt-3 text-sm text-muted-foreground" aria-hidden={visual.type === "table" ? true : undefined}>
          <Inline text={visual.caption} strongClass="font-bold text-heading" />
        </figcaption>
      )}
    </figure>
  );
}

function render(v: VisualData) {
  switch (v.type) {
    case "timeline":
      return <Timeline v={v} />;
    case "blocks":
      return <Blocks v={v} />;
    case "table":
      return <CompareTable v={v} />;
    case "formula":
      return <Formula v={v} />;
    case "transform":
      return <Transform v={v} />;
    case "scale":
      return <Scale v={v} />;
  }
}
