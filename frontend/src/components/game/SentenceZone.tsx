"use client";

import { Droppable } from "@hello-pangea/dnd";
import { WordTile, GameStatus } from "@/types";
import { WordTileItem } from "./WordTileItem";

interface SentenceZoneProps {
  tiles: WordTile[];
  disabled?: boolean;
  status?: GameStatus;
}

export function SentenceZone({ tiles, disabled = false, status }: SentenceZoneProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 pl-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your Sentence
        </p>
        {status === "correct" && (
          <span className="text-xs font-semibold text-cyan bg-cyan/10 border border-cyan/20 px-2 py-0.5 rounded-full">
            ✓ Correct!
          </span>
        )}
        {status === "wrong" && (
          <span className="text-xs font-semibold text-pink bg-pink/10 border border-pink/20 px-2 py-0.5 rounded-full">
            ✗ Try again
          </span>
        )}
      </div>
      <Droppable droppableId="arranged" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              "c-box rounded-xl min-h-[56px] flex flex-wrap gap-2 p-3 transition-all duration-200",
              status === "correct"
                ? "border-cyan/40 ring-1 ring-cyan/20"
                : status === "wrong"
                ? "border-pink/40 ring-1 ring-pink/20"
                : snapshot.isDraggingOver
                ? "border-primary/40 ring-1 ring-primary/20"
                : "border-white/[0.06]",
            ].join(" ")}
          >
            {tiles.map((tile, idx) => (
              <WordTileItem key={tile.id} tile={tile} index={idx} disabled={disabled} />
            ))}
            {tiles.length === 0 && (
              <span className="text-sm text-muted-foreground self-center pl-1">
                Drag words here…
              </span>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
