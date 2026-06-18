"use client";

import { SectionHeader, type SectionProps } from "./common";

/** Free-form journal / notes for the character and campaign. */
export function Notes({ character: c, update }: SectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="Note & Diario" desc="Storia, legami, obiettivi, appunti di sessione." />
      <textarea
        className="field"
        rows={18}
        value={c.notes ?? ""}
        onChange={(e) => update((d) => (d.notes = e.target.value))}
        placeholder="Scrivi qui…"
      />
    </div>
  );
}
