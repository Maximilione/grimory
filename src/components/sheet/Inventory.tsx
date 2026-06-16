"use client";

import { useState } from "react";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { uid } from "@/lib/db";
import { carryCapacity, currentWeight } from "@/lib/rules";
import type { InventoryItem } from "@/lib/types";
import { searchMagicItems, withId } from "@/lib/srdApi";
import { SectionHeader, ItemCard, Empty, Stepper, RefLink, type SectionProps } from "./common";
import { SrdSearch } from "./SrdSearch";
import { Tag } from "./Weapons";

export function Inventory({ character: c, update }: SectionProps) {
  const [search, setSearch] = useState(false);
  const cap = carryCapacity(c);
  const load = currentWeight(c);

  function add() {
    update((d) => d.inventory.unshift({ id: uid(), name: "Nuovo oggetto", qty: 1 }));
  }
  function edit(id: string, patch: Partial<InventoryItem>) {
    update((d) => {
      const it = d.inventory.find((x) => x.id === id);
      if (it) Object.assign(it, patch);
    });
  }
  function remove(id: string) {
    update((d) => (d.inventory = d.inventory.filter((x) => x.id !== id)));
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Equipaggiamento"
        desc={`Carico ${Math.round(load * 10) / 10} / ${cap} (Forza ×15)`}
        action={
          <div className="flex gap-2">
            <button className="btn" onClick={() => setSearch(true)}>
              <BookOpen size={16} /> Manuale
            </button>
            <button className="btn btn-accent" onClick={add}>
              <Plus size={16} /> Oggetto
            </button>
          </div>
        }
      />
      {search && (
        <SrdSearch
          title="Oggetti magici"
          fetcher={searchMagicItems}
          onPick={(built) => update((d) => d.inventory.unshift(withId(built)))}
          onClose={() => setSearch(false)}
        />
      )}

      {/* wealth + attunement */}
      <div className="card p-3">
        <p className="text-sm font-semibold mb-2">Monete</p>
        <div className="grid grid-cols-5 gap-2">
          {([
            ["pp", "MP"],
            ["gp", "MO"],
            ["ep", "ME"],
            ["sp", "MA"],
            ["cp", "MR"],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex flex-col items-center">
              <span className="text-[11px] uppercase text-[var(--muted)] mb-1">{label}</span>
              <input
                type="number"
                inputMode="numeric"
                className="field text-center px-1"
                value={c.currency?.[k] ?? 0}
                onChange={(e) =>
                  update((d) => {
                    d.currency ??= { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
                    d.currency[k] = Math.max(0, +e.target.value || 0);
                  })
                }
              />
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <span className="text-sm font-semibold">Sintonia</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => update((d) => (d.attunedCount = (d.attunedCount ?? 0) >= n ? n - 1 : n))}
                className="size-6 rounded-full border-2"
                style={{ borderColor: "var(--accent)", background: (c.attunedCount ?? 0) >= n ? "var(--accent)" : "transparent" }}
                aria-label={`sintonia ${n}`}
              />
            ))}
            <span className="text-xs text-[var(--muted)] ml-1">{c.attunedCount ?? 0}/3</span>
          </div>
        </div>
      </div>

      {load > cap && (
        <p className="text-sm" style={{ color: "var(--ember)" }}>Sovraccarico!</p>
      )}
      {c.inventory.length === 0 && <Empty>Zaino vuoto.</Empty>}
      {c.inventory.map((it) => (
        <ItemCard
          key={it.id}
          title={
            <span className="flex items-center gap-2">
              {it.equipped && <span style={{ color: "var(--accent)" }}>●</span>}
              {it.name} {it.homebrew && <Tag>HB</Tag>}
            </span>
          }
          meta={`×${it.qty}${it.weight ? ` · ${it.weight} kg/u` : ""}`}
          right={
            <div className="flex items-center gap-1.5">
              <Stepper value={it.qty} min={0} onChange={(v) => edit(it.id, { qty: v })} />
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <L label="Nome" full>
              <input className="field" value={it.name} onChange={(e) => edit(it.id, { name: e.target.value })} />
            </L>
            <L label="Peso (kg/unità)">
              <input type="number" className="field" value={it.weight ?? 0} onChange={(e) => edit(it.id, { weight: +e.target.value || 0 })} />
            </L>
            <L label="Equipaggiato">
              <label className="flex items-center gap-2 text-sm h-[42px]">
                <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!it.equipped} onChange={(e) => edit(it.id, { equipped: e.target.checked })} />
                Indossato/impugnato
              </label>
            </L>
            <L label="Note" full>
              <textarea className="field" rows={2} value={it.notes ?? ""} onChange={(e) => edit(it.id, { notes: e.target.value })} />
            </L>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!it.homebrew} onChange={(e) => edit(it.id, { homebrew: e.target.checked })} />
              Homebrew
            </label>
            <div className="flex items-center gap-3">
              <RefLink name={it.homebrew ? undefined : it.name} />
              <button className="btn btn-danger btn-ghost text-sm" onClick={() => remove(it.id)}>
                <Trash2 size={15} /> Elimina
              </button>
            </div>
          </div>
        </ItemCard>
      ))}
    </div>
  );
}

function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-1 block">{label}</span>
      {children}
    </label>
  );
}
