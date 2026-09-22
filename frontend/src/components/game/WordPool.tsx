"use client";

import { Droppable } from "@hello-pangea/dnd";
import { WordTile } from "@/types";
import { WordTileItem } from "./WordTileItem";

interface WordPoolProps {
  tiles: WordTile[];
  disabled?: boolean;
}

export function WordPool({ tiles, disabled = false }: WordPoolProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pl-1">
        Available Words
      </p>
      <Droppable droppableId="scrambled" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              "c-box rounded-xl min-h-[56px] flex flex-wrap gap-2 p-3 transition-all duration-200",
              snapshot.isDraggingOver
                ? "border-primary/40 ring-1 ring-primary/20"
                : "border-white/[0.06]",
            ].join(" ")}
          >
            {tiles.map((tile, idx) => (
              <WordTileItem key={tile.id} tile={tile} index={idx} disabled={disabled} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
