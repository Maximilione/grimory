"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Search, Loader2, Wand2 } from "lucide-react";
import { fetchClassSpells, type SearchHit } from "@/lib/srdApi";
import type { Spell } from "@/lib/types";

/** Browse the spell list available to the character's class(es): filter by
 * level and text, tap to add (precompiled). The list is cached after first load. */
export function ClassSpellPicker({
  classKeys,
  classLabel,
  onPick,
  onClose,
}: {
  classKeys: string[];
  classLabel: string;
  onPick: (built: Omit<Spell, "id">) => void;
  onClose: () => void;
}) {
  const [hits, setHits] = useState<SearchHit<Omit<Spell, "id">>[] | null>(null);
  const [q, setQ] = useState("");
  const [lvl, setLvl] = useState<number | "all">("all");

  useEffect(() => {
    let live = true;
    fetchClassSpells(classKeys).then((h) => live && setHits(h));
    return () => {
      live = false;
    };
  }, [classKeys.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const levels = useMemo(() => {
    const s = new Set<number>();
    (hits ?? []).forEach((h) => s.add(levelOf(h)));
    return [...s].sort((a, b) => a - b);
  }, [hits]);

  const filtered = (hits ?? []).filter(
    (h) => (lvl === "all" || levelOf(h) === lvl) && (!q.trim() || h.name.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={onClose}>
      <div
        className="mt-auto md:mt-[8vh] md:mx-auto md:max-w-lg w-full card rounded-b-none md:rounded-b-[var(--radius)] max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2 p-3 border-b border-[var(--border)]">
          <Wand2 size={18} style={{ color: "var(--accent)" }} />
          <span className="font-semibold flex-1">Incantesimi — {classLabel}</span>
          <button onClick={onClose} className="text-[var(--muted)] p-1" aria-label="Chiudi"><X size={20} /></button>
        </div>

        <div className="p-3 border-b border-[var(--border)] flex flex-col gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input className="field pl-9" placeholder="Filtra per nome…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {hits && (
            <div className="flex flex-wrap gap-1.5">
              <Chip active={lvl === "all"} onClick={() => setLvl("all")}>Tutti</Chip>
              {levels.map((l) => (
                <Chip key={l} active={lvl === l} onClick={() => setLvl(l)}>
                  {l === 0 ? "Trucch." : `Liv ${l}`}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!hits && (
            <div className="flex items-center justify-center gap-2 py-10 text-[var(--muted)] text-sm">
              <Loader2 size={16} className="animate-spin" /> Carico la lista…
            </div>
          )}
          {hits && filtered.length === 0 && (
            <p className="text-center text-sm text-[var(--muted)] py-10">Nessun incantesimo.</p>
          )}
          {filtered.map((h) => (
            <button
              key={h.key}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              onClick={() => {
                onPick(h.build());
                onClose();
              }}
            >
              <p className="font-medium">{h.name}</p>
              <p className="text-xs text-[var(--muted)]">{h.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function levelOf(h: SearchHit<Omit<Spell, "id">>): number {
  // subtitle starts with "Trucchetto" or "Liv. N"
  const m = /Liv\. (\d+)/.exec(h.subtitle);
  return m ? +m[1] : 0;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2.5 py-1 rounded-full border"
      style={{
        borderColor: active ? "var(--accent)" : "var(--border)",
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--muted)",
      }}
    >
      {children}
    </button>
  );
}
