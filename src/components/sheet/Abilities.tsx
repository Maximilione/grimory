"use client";

import { ABILITIES, type Ability } from "@/lib/types";
import { ABILITY_NAMES } from "@/lib/srd";
import { derive } from "@/lib/rules";
import { SectionHeader, RollButton, fmt, type SectionProps } from "./common";
import { PixelWatermark } from "@/components/PixelArt";

export function Abilities({ character: c, update }: SectionProps) {
  const d = derive(c);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Caratteristiche" desc="Modifica un punteggio: mod, tiri salvezza, abilità e attacchi si aggiornano da soli." />

      <div className="grid grid-cols-2 gap-3">
        {ABILITIES.map((a) => (
          <div key={a} className="card p-3 relative overflow-hidden isolate">
            <PixelWatermark name={a} />
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{ABILITY_NAMES[a]}</span>
              <RollButton label={`Prova di ${ABILITY_NAMES[a]}`} bonus={d.mods[a]} />
            </div>
            <div className="flex items-end gap-2">
              <input
                type="number"
                inputMode="numeric"
                className="bg-transparent text-3xl font-bold w-16 outline-none"
                value={c.abilities[a]}
                onChange={(e) =>
                  update((draft) => {
                    draft.abilities[a] = Math.max(1, Math.min(30, +e.target.value || 0));
                  })
                }
              />
              <span className="text-lg pb-1" style={{ color: "var(--accent)" }}>{fmt(d.mods[a])}</span>
            </div>
          </div>
        ))}
      </div>

      <SectionHeader title="Tiri Salvezza" desc="Spunta = competente (+ bonus di competenza). Il campo piccolo è un bonus extra (oggetti)." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ABILITIES.map((a) => {
          const save = d.saves[a];
          return (
            <div key={a} className="card p-3 flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={save.proficient}
                  onChange={(e) =>
                    update((draft) => {
                      draft.savingThrowProf[a as Ability] = e.target.checked;
                    })
                  }
                  className="accent-[var(--accent)] size-4 shrink-0"
                />
                <span className="truncate">{ABILITY_NAMES[a]}</span>
              </label>
              <input
                type="number"
                className="field px-1 py-1 text-center text-xs shrink-0"
                style={{ width: "2.75rem" }}
                title="Bonus extra TS (oggetti)"
                value={c.saveBonus?.[a] ?? 0}
                onChange={(e) => update((d) => { d.saveBonus ??= {}; const v = +e.target.value || 0; if (v) d.saveBonus[a] = v; else delete d.saveBonus[a]; })}
              />
              <RollButton label={`TS ${ABILITY_NAMES[a]}`} bonus={save.mod} className="shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
