"use client";

import { useState } from "react";
import BlobCard from "@/components/blob/BlobCard";
import BlobFullscreen from "@/components/blob/BlobFullscreen";
import { BLOB_VARIANTS, type BlobVariant } from "@/components/blob/shaders";

export default function BlobPage() {
  const [selected, setSelected] = useState<BlobVariant | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="bg-gradient-to-r from-[#b79fff] via-[#f59e0b] to-[#00e3fd] bg-clip-text text-3xl font-extrabold text-transparent">
          AI Agent Blobs
        </h1>
        <p className="mt-2 text-sm text-body">
          {BLOB_VARIANTS.length} GPU-rendered organic visualizations — click any to go fullscreen
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {BLOB_VARIANTS.map((v) => (
          <button
            key={v.name}
            type="button"
            className="cursor-pointer text-left"
            onClick={() => setSelected(v)}
          >
            <BlobCard variant={v} />
          </button>
        ))}
      </div>

      {selected && (
        <BlobFullscreen variant={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
