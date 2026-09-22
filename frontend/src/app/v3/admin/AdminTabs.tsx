"use client";

// AdminTabs — a tiny, accessible UI/JSON toggle used by both admin pages.
// Each tab is just a `mode` value the parent owns. Keeps the styling
// consistent across pages without dragging in a UI library tab system.

export type AdminMode = "ui" | "json";

export default function AdminTabs({
  mode,
  onChange,
}: {
  mode: AdminMode;
  onChange: (m: AdminMode) => void;
}) {
  return (
    <div role="tablist" className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-surface-2/40 p-1">
      <TabButton active={mode === "ui"} onClick={() => onChange("ui")}>UI</TabButton>
      <TabButton active={mode === "json"} onClick={() => onChange("json")}>JSON</TabButton>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full px-4 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-primary text-[#0b0e14]" : "text-muted-foreground hover:text-heading"
      }`}
    >
      {children}
    </button>
  );
}
