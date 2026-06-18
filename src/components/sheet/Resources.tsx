"use client";

import { useState } from "react";
import { Plus, Minus, Trash2, Zap, RotateCcw } from "lucide-react";
import { resourceMax } from "@/lib/rules";
import { makeResource, RESOURCE_PRESETS } from "@/lib/resources";
import type { Resource } from "@/lib/types";
import { ItemCard, FormulaField, type SectionProps } from "./common";

/** Tracker for resource pools (focus, sorcery/luck points, rages…). Shows pips
 * for small pools, a counter for big ones; spend/restore; edit formula + recharge. */
export function Resources({ character: c, update }: SectionProps) {
  const [adding, setAdding] = useState(false);
  const resources = c.resources ?? [];

  function spend(id: string, delta: number, max: number) {
    update((d) => {
      const r = d.resources?.find((x) => x.id === id);
      if (r) r.spent = Math.max(0, Math.min(max, r.spent + delta));
    });
  }
  function edit(id: string, patch: Partial<Resource>) {
    update((d) => {
      const r = d.resources?.find((x) => x.id === id);
      if (r) Object.assign(r, patch);
    });
  }
  function remove(id: string) {
    update((d) => (d.resources = (d.resources ?? []).filter((x) => x.id !== id)));
  }
  function add(preset: (typeof RESOURCE_PRESETS)[number]) {
    update((d) => (d.resources = [...(d.resources ?? []), makeResource(preset)]));
    setAdding(false);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 font-semibold">
          <Zap size={18} style={{ color: "var(--accent)" }} /> Risorse
        </span>
        <button className="btn btn-ghost text-sm py-1" onClick={() => setAdding((a) => !a)}>
          <Plus size={15} /> Risorsa
        </button>
      </div>

      {adding && (
        <div className="flex flex-wrap gap-2 mb-3">
          {RESOURCE_PRESETS.map((p) => (
            <button key={p.name} className="btn btn-ghost text-xs py-1" onClick={() => add(p)}>
              {p.name}
            </button>
          ))}
          <button className="btn btn-ghost text-xs py-1" onClick={() => add({ name: "Risorsa", max: "prof", recharge: "long" })}>
            + Personalizzata
          </button>
        </div>
      )}

      {resources.length === 0 && (
        <p className="text-sm text-[var(--muted)]">Nessuna risorsa. Aggiungine una (Focus, Punti Stregoneria…).</p>
      )}

      <div className="flex flex-col gap-2">
        {resources.map((r) => {
          const max = resourceMax(c, r);
          const remaining = max - r.spent;
          return (
            <ItemCard
              key={r.id}
              title={r.name}
              meta={`${remaining}/${max} · ${r.recharge === "short" ? "riposo breve" : "riposo lungo"}`}
              right={
                <div className="flex items-center gap-1.5">
                  <button className="btn px-2 py-1.5" disabled={remaining <= 0} onClick={() => spend(r.id, 1, max)} aria-label="Usa"><Minus size={15} /></button>
                  {max <= 10 ? (
                    <div className="flex gap-1">
                      {Array.from({ length: max }, (_, i) => (
                        <span key={i} className="size-3 rounded-full border" style={{ borderColor: "var(--accent)", background: i < remaining ? "var(--accent)" : "transparent" }} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm font-bold w-8 text-center" style={{ color: "var(--accent)" }}>{remaining}</span>
                  )}
                  <button className="btn px-2 py-1.5" disabled={r.spent <= 0} onClick={() => spend(r.id, -1, max)} aria-label="Recupera"><Plus size={15} /></button>
                </div>
              }
            >
              <div className="flex flex-col gap-3">
                <L label="Nome">
                  <input className="field" value={r.name} onChange={(e) => edit(r.id, { name: e.target.value })} />
                </L>
                <L label="Massimo (formula)">
                  <FormulaField value={r.max.formula ?? ""} onChange={(v) => edit(r.id, { max: { formula: v } })} character={c} allowDice={false} placeholder="level / prof / max(1, mod.cha)" />
                </L>
                <div className="flex items-center justify-between">
                  <label className="text-sm flex items-center gap-2">
                    Recupero
                    <select className="field py-1 px-2 w-auto" value={r.recharge} onChange={(e) => edit(r.id, { recharge: e.target.value as "short" | "long" })}>
                      <option value="short">Riposo breve</option>
                      <option value="long">Riposo lungo</option>
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost text-sm" onClick={() => edit(r.id, { spent: 0 })}><RotateCcw size={14} /> Reset</button>
                    <button className="btn btn-danger btn-ghost text-sm" onClick={() => remove(r.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </ItemCard>
          );
        })}
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-1 block">{label}</span>
      {children}
    </label>
  );
}
