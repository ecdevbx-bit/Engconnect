"use client";

import { Draggable } from "@hello-pangea/dnd";
import { WordTile } from "@/types";

interface WordTileItemProps {
  tile: WordTile;
  index: number;
  disabled?: boolean;
}

// Dark glass chip colour accents — subtle tint + matching text on the dark surface
const TILE_CLASSES = [
  "border-blue-500/30 text-blue-300",
  "border-pink-500/30 text-pink-300",
  "border-amber-500/30 text-amber-300",
  "border-violet-500/30 text-violet-300",
  "border-cyan-500/30 text-cyan-300",
  "border-orange-500/30 text-orange-300",
  "border-sky-500/30 text-sky-300",
  "border-rose-500/30 text-rose-300",
] as const;

function tileColorClass(word: string): string {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = (word.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  return TILE_CLASSES[Math.abs(hash) % TILE_CLASSES.length];
}

export function WordTileItem({ tile, index, disabled = false }: WordTileItemProps) {
  const colorClass = tileColorClass(tile.word);

  return (
    <Draggable draggableId={tile.id} index={index} isDragDisabled={disabled}>
      {(provided, snapshot) => (
        <span
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={[
            // Premium glass chip base
            "inline-flex items-center px-3 py-1.5 rounded-lg",
            "bg-surface-2 border",
            "text-heading text-sm font-semibold tracking-wide",
            "backdrop-blur-sm select-none cursor-grab",
            "transition-all duration-150",
            colorClass,
            snapshot.isDragging
              ? "shadow-lg scale-105 cursor-grabbing opacity-90 ring-2 ring-primary/40"
              : "hover:scale-[1.03] hover:bg-surface-3 active:scale-[0.97]",
            disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {tile.word}
        </span>
      )}
    </Draggable>
  );
}
