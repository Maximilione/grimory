"use client";

import { Plus, Minus, Trash2, Heart, Dices } from "lucide-react";
import { uid } from "@/lib/db";
import type { Companion } from "@/lib/types";
import { useRoll } from "@/lib/rollStore";
import { SectionHeader, ItemCard, Empty, type SectionProps } from "./common";

/** Companions / familiars / summons — small stat blocks with HP tracking. */
export function Companions({ character: c, update }: SectionProps) {
  const list = c.companions ?? [];
  const roll = useRoll((s) => s.roll);
  const rollD20 = useRoll((s) => s.rollD20);

  function mutAttacks(mId: string, fn: (atks: NonNullable<Companion["attacks"]>) => void) {
    update((d) => {
      const m = d.companions?.find((y) => y.id === mId);
      if (m) {
        m.attacks ??= [];
        fn(m.attacks);
      }
    });
  }
  function add() {
    update((d) => (d.companions = [...(d.companions ?? []), { id: uid(), name: "Compagno", ac: 12, currentHp: 5, maxHp: 5 }]));
  }
  function edit(id: string, patch: Partial<Companion>) {
    update((d) => {
      const x = d.companions?.find((y) => y.id === id);
      if (x) Object.assign(x, patch);
    });
  }
  function remove(id: string) {
    update((d) => (d.companions = (d.companions ?? []).filter((y) => y.id !== id)));
  }
  function hp(id: string, delta: number) {
    update((d) => {
      const x = d.companions?.find((y) => y.id === id);
      if (x) x.currentHp = Math.max(0, Math.min(x.maxHp, x.currentHp + delta));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Compagni"
        desc="Famigli, evocazioni, cavalcature, bestie."
        action={<button className="btn btn-accent" onClick={add}><Plus size={16} /> Compagno</button>}
      />
      {list.length === 0 && <Empty>Nessun compagno.</Empty>}
      {list.map((m) => (
        <ItemCard
          key={m.id}
          title={m.name}
          meta={`CA ${m.ac} · PF ${m.currentHp}/${m.maxHp}${m.speed ? " · " + m.speed : ""}`}
          right={
            <div className="flex items-center gap-1.5">
              <button className="btn btn-danger px-2 py-1.5" onClick={() => hp(m.id, -1)} aria-label="Danno"><Minus size={14} /></button>
              <span className="text-sm font-bold w-10 text-center"><Heart size={11} className="inline" style={{ color: "var(--ember)" }} /> {m.currentHp}</span>
              <button className="btn px-2 py-1.5" onClick={() => hp(m.id, 1)} aria-label="Cura"><Plus size={14} /></button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <L label="Nome" full><input className="field" value={m.name} onChange={(e) => edit(m.id, { name: e.target.value })} /></L>
            <L label="CA"><input type="number" className="field" value={m.ac} onChange={(e) => edit(m.id, { ac: +e.target.value || 0 })} /></L>
            <L label="Velocità"><input className="field" value={m.speed ?? ""} onChange={(e) => edit(m.id, { speed: e.target.value })} placeholder="9 m" /></L>
            <L label="PF attuali"><input type="number" className="field" value={m.currentHp} onChange={(e) => edit(m.id, { currentHp: +e.target.value || 0 })} /></L>
            <L label="PF max"><input type="number" className="field" value={m.maxHp} onChange={(e) => edit(m.id, { maxHp: Math.max(1, +e.target.value || 1) })} /></L>
            <L label="Note" full><textarea className="field" rows={2} value={m.notes ?? ""} onChange={(e) => edit(m.id, { notes: e.target.value })} /></L>
          </div>

          {/* attacks */}
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Attacchi</span>
              <button className="btn btn-ghost text-xs py-1" onClick={() => mutAttacks(m.id, (a) => a.unshift({ id: uid(), name: "Attacco", toHit: 0, damage: "1d6" }))}>
                <Plus size={13} /> Attacco
              </button>
            </div>
            {(m.attacks ?? []).map((atk, i) => (
              <div key={atk.id} className="flex items-center gap-2 mb-2">
                <input className="field py-1.5 text-sm flex-1" value={atk.name} onChange={(e) => mutAttacks(m.id, (a) => (a[i].name = e.target.value))} placeholder="Morso" />
                <input type="number" className="field py-1.5 text-sm w-14 text-center" value={atk.toHit ?? 0} onChange={(e) => mutAttacks(m.id, (a) => (a[i].toHit = +e.target.value || 0))} title="colpire" />
                <input className="field py-1.5 text-sm w-20 font-mono" value={atk.damage ?? ""} onChange={(e) => mutAttacks(m.id, (a) => (a[i].damage = e.target.value))} placeholder="1d6+2" />
                <button className="btn px-2 py-1.5" title="Colpire" onClick={() => rollD20(`${m.name}: ${atk.name} — colpire`, atk.toHit ?? 0)}><Dices size={13} /></button>
                <button className="btn px-2 py-1.5" title="Danni" disabled={!atk.damage?.trim()} onClick={() => roll(`${m.name}: ${atk.name} — danni`, atk.damage!)}>dmg</button>
                <button className="btn btn-danger btn-ghost px-1.5" onClick={() => mutAttacks(m.id, (a) => a.splice(i, 1))}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>

          <button className="btn btn-danger btn-ghost text-sm mt-3" onClick={() => remove(m.id)}><Trash2 size={15} /> Elimina</button>
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
