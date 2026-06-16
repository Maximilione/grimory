"use client";

import { useRouter } from "next/navigation";
import { Trash2, RefreshCw } from "lucide-react";
import { CLASSES, ABILITY_NAMES, classByKey } from "@/lib/srd";
import { deleteCharacter } from "@/lib/db";
import { getClasses, buildSpellSlots, totalLevel } from "@/lib/rules";
import type { Ability } from "@/lib/types";
import { SectionHeader, type SectionProps } from "./common";

export function Settings({ character: c, update }: SectionProps) {
  const router = useRouter();
  const classes = getClasses(c);

  function recalcSlots() {
    update((d) => {
      d.spellSlots = buildSpellSlots(d);
    });
  }

  function setSubclass(key: string, subclass: string) {
    update((d) => {
      d.classes = getClasses(d).map((e) => (e.key === key ? { ...e, subclass } : { ...e }));
      if (d.classKey === key) d.subclass = subclass;
    });
  }
  function removeClass(key: string) {
    update((d) => {
      const next = getClasses(d).filter((e) => e.key !== key);
      d.classes = next;
      d.level = next.reduce((s, e) => s + e.level, 0) || 1;
      d.hitDiceTotal = d.level;
      if (d.classKey === key) {
        d.classKey = next[0]?.key;
        d.className = next[0] ? classByKey(next[0].key)?.name : undefined;
        d.subclass = next[0]?.subclass;
      }
      d.spellSlots = buildSpellSlots(d);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Impostazioni personaggio" />

      <div className="card p-4 flex flex-col gap-3">
        <L label="Nome">
          <input className="field" value={c.name} onChange={(e) => update((d) => (d.name = e.target.value))} />
        </L>
        <div className="grid grid-cols-2 gap-3">
          <L label="Razza / Stirpe">
            <input className="field" value={c.race ?? ""} onChange={(e) => update((d) => (d.race = e.target.value))} />
          </L>
          <L label="Background">
            <input className="field" value={c.background ?? ""} onChange={(e) => update((d) => (d.background = e.target.value))} />
          </L>
          <L label="Allineamento">
            <input className="field" value={c.alignment ?? ""} onChange={(e) => update((d) => (d.alignment = e.target.value))} />
          </L>
        </div>
      </div>

      {/* classes / multiclass */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Classi</p>
          <span className="text-sm text-[var(--muted)]">Livello totale {totalLevel(c)}</span>
        </div>
        {classes.length === 0 && <p className="text-sm text-[var(--muted)]">Nessuna classe.</p>}
        {classes.map((e) => (
          <div key={e.key} className="flex items-center gap-2">
            <span className="text-sm font-medium w-24 shrink-0">{classByKey(e.key)?.name ?? e.key}</span>
            <span className="text-xs text-[var(--muted)] w-12 shrink-0">liv. {e.level}</span>
            <input
              className="field flex-1"
              placeholder="sottoclasse"
              value={e.subclass ?? ""}
              onChange={(ev) => setSubclass(e.key, ev.target.value)}
            />
            {classes.length > 1 && (
              <button className="btn btn-danger btn-ghost px-2" onClick={() => removeClass(e.key)} aria-label="Rimuovi classe">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
        <p className="text-[11px] text-[var(--muted)]">
          Usa <strong>Sali di livello</strong> (Panoramica) per aggiungere livelli o una nuova classe.
        </p>
      </div>

      <div className="card p-4 flex flex-col gap-3">
        <p className="font-semibold">Regole</p>
        <div className="grid grid-cols-2 gap-3">
          <L label="Caratteristica incantesimi">
            <select className="field" value={c.spellcastingAbility ?? ""} onChange={(e) => update((d) => (d.spellcastingAbility = (e.target.value || undefined) as Ability | undefined))}>
              <option value="">Auto (da classe)</option>
              {(["str", "dex", "con", "int", "wis", "cha"] as Ability[]).map((a) => (
                <option key={a} value={a}>{ABILITY_NAMES[a]}</option>
              ))}
            </select>
          </L>
          <L label="Bonus competenza (override)">
            <input type="number" className="field" value={c.proficiencyBonusOverride ?? 0} onChange={(e) => update((d) => (d.proficiencyBonusOverride = +e.target.value || undefined))} placeholder="auto" />
          </L>
          <L label="CA base (armatura)">
            <input type="number" className="field" value={c.armorClass} onChange={(e) => update((d) => (d.armorClass = +e.target.value || 10))} />
          </L>
          <L label="Velocità base (m)">
            <input type="number" className="field" value={c.speed} onChange={(e) => update((d) => (d.speed = +e.target.value || 0))} />
          </L>
        </div>
        <p className="text-[11px] text-[var(--muted)]">CA e velocità in Panoramica includono gli effetti dei privilegi/talenti (es. Difesa senza Armatura, Speedy).</p>
        <button className="btn self-start" onClick={recalcSlots}>
          <RefreshCw size={15} /> Ricalcola slot da classe/livello
        </button>
      </div>

      <L label="Note">
        <textarea className="field" rows={5} value={c.notes ?? ""} onChange={(e) => update((d) => (d.notes = e.target.value))} placeholder="Storia, legami, appunti…" />
      </L>

      <button
        className="btn btn-danger mt-4"
        onClick={async () => {
          if (confirm(`Eliminare "${c.name}"? Azione irreversibile.`)) {
            await deleteCharacter(c.id);
            router.replace("/");
          }
        }}
      >
        <Trash2 size={16} /> Elimina personaggio
      </button>
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
