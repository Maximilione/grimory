"use client";

import { Plus, Trash2, Zap } from "lucide-react";
import { uid } from "@/lib/db";
import { formulaVars } from "@/lib/rules";
import { evalFormula } from "@/lib/dice";
import type { Feature, FeatureEffect } from "@/lib/types";
import { SectionHeader, ItemCard, Empty, FormulaField, RefLink, type SectionProps } from "./common";
import { Tag } from "./Weapons";

const EFFECT_TARGETS: { value: FeatureEffect["target"]; label: string }[] = [
  { value: "ac", label: "CA" },
  { value: "speed", label: "Velocità" },
  { value: "initiative", label: "Iniziativa" },
  { value: "maxHp", label: "PF max" },
];
const EFFECT_PRESETS: { label: string; effect: FeatureEffect }[] = [
  { label: "Difesa senza armatura (Monaco)", effect: { target: "ac", mode: "base", formula: "10 + mod.dex + mod.wis" } },
  { label: "Difesa senza armatura (Barbaro)", effect: { target: "ac", mode: "base", formula: "10 + mod.dex + mod.con" } },
  { label: "+1 CA (scudo/talento)", effect: { target: "ac", mode: "add", formula: "1" } },
];

export function Features({ character: c, update }: SectionProps) {
  const vars = formulaVars(c);

  function maxUses(f: Feature): number {
    if (!f.uses) return 0;
    if (f.uses.max.formula?.trim()) {
      try {
        return Math.max(0, Math.round(evalFormula(f.uses.max.formula, vars)));
      } catch {
        return f.uses.max.fixed ?? 0;
      }
    }
    return f.uses.max.fixed ?? 0;
  }

  function add() {
    update((d) => d.features.unshift({ id: uid(), name: "Nuovo privilegio" }));
  }
  function edit(id: string, patch: Partial<Feature>) {
    update((d) => {
      const f = d.features.find((x) => x.id === id);
      if (f) Object.assign(f, patch);
    });
  }
  function remove(id: string) {
    update((d) => (d.features = d.features.filter((x) => x.id !== id)));
  }
  function spend(id: string, delta: number) {
    update((d) => {
      const f = d.features.find((x) => x.id === id);
      if (f?.uses) f.uses.spent = Math.max(0, f.uses.spent + delta);
    });
  }
  function toggleUses(id: string, on: boolean) {
    update((d) => {
      const f = d.features.find((x) => x.id === id);
      if (!f) return;
      f.uses = on ? { max: { formula: "prof" }, spent: 0, recharge: "long" } : undefined;
    });
  }
  function addEffect(id: string, eff: FeatureEffect) {
    update((d) => {
      const f = d.features.find((x) => x.id === id);
      if (f) (f.effects ??= []).push(eff);
    });
  }
  function editEffect(id: string, i: number, patch: Partial<FeatureEffect>) {
    update((d) => {
      const e = d.features.find((x) => x.id === id)?.effects?.[i];
      if (e) Object.assign(e, patch);
    });
  }
  function removeEffect(id: string, i: number) {
    update((d) => {
      const f = d.features.find((x) => x.id === id);
      if (f?.effects) f.effects.splice(i, 1);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Tratti & Privilegi"
        desc="Capacità di classe, razza, talenti. Usi/riposo con max che scala."
        action={
          <button className="btn btn-accent" onClick={add}>
            <Plus size={16} /> Privilegio
          </button>
        }
      />
      {c.features.length === 0 && <Empty>Nessun privilegio.</Empty>}
      {c.features.map((f) => {
        const max = maxUses(f);
        const remaining = f.uses ? max - f.uses.spent : 0;
        return (
          <ItemCard
            key={f.id}
            title={<span className="flex items-center gap-2">{f.name} {f.homebrew && <Tag>HB</Tag>}</span>}
            meta={[f.source, f.uses ? `${remaining}/${max} usi (${f.uses.recharge === "short" ? "breve" : "lungo"})` : null].filter(Boolean).join(" · ") || undefined}
            right={
              f.uses ? (
                <div className="flex items-center gap-1.5">
                  <button className="btn px-2 py-1.5 text-sm" disabled={remaining <= 0} onClick={() => spend(f.id, 1)}>
                    Usa
                  </button>
                  <button className="btn btn-ghost px-2 py-1.5 text-sm" onClick={() => spend(f.id, -1)}>
                    ↺
                  </button>
                </div>
              ) : undefined
            }
          >
            <div className="flex flex-col gap-3">
              <L label="Nome">
                <input className="field" value={f.name} onChange={(e) => edit(f.id, { name: e.target.value })} />
              </L>
              <L label="Fonte">
                <input className="field" value={f.source ?? ""} onChange={(e) => edit(f.id, { source: e.target.value })} placeholder="Classe / Razza / Talento" />
              </L>
              <L label="Descrizione">
                <textarea className="field" rows={3} value={f.description ?? ""} onChange={(e) => edit(f.id, { description: e.target.value })} />
              </L>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!f.uses} onChange={(e) => toggleUses(f.id, e.target.checked)} />
                Ha usi limitati per riposo
              </label>
              {f.uses && (
                <div className="grid grid-cols-2 gap-3">
                  <L label="Usi max (formula)" full>
                    <FormulaField
                      value={f.uses.max.formula ?? ""}
                      onChange={(v) => edit(f.id, { uses: { ...f.uses!, max: { formula: v } } })}
                      character={c}
                      allowDice={false}
                      placeholder="prof  oppure  mod.cha + 1"
                    />
                  </L>
                  <L label="Recupero">
                    <select className="field" value={f.uses.recharge} onChange={(e) => edit(f.id, { uses: { ...f.uses!, recharge: e.target.value as "short" | "long" } })}>
                      <option value="long">Riposo lungo</option>
                      <option value="short">Riposo breve</option>
                    </select>
                  </L>
                </div>
              )}
              {/* stat effects */}
              <div className="pt-3 border-t border-[var(--border)]">
                <p className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-2 flex items-center gap-1.5">
                  <Zap size={12} /> Effetti su statistiche
                </p>
                {(f.effects ?? []).map((eff, i) => {
                  let preview: string | null = null;
                  let err = false;
                  try {
                    preview = String(Math.round(evalFormula(eff.formula, vars)));
                  } catch {
                    err = !!eff.formula.trim();
                  }
                  return (
                    <div key={i} className="mb-2">
                      <div className="flex items-center gap-2">
                        <select className="field py-1.5 px-2 w-auto text-sm" value={eff.target} onChange={(e) => editEffect(f.id, i, { target: e.target.value as FeatureEffect["target"] })}>
                          {EFFECT_TARGETS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                        </select>
                        <select className="field py-1.5 px-2 w-auto text-sm" value={eff.mode} onChange={(e) => editEffect(f.id, i, { mode: e.target.value as FeatureEffect["mode"] })}>
                          <option value="add">+ aggiungi</option>
                          <option value="base">= base (max)</option>
                        </select>
                        <input className="field py-1.5 text-sm font-mono flex-1" value={eff.formula} onChange={(e) => editEffect(f.id, i, { formula: e.target.value })} placeholder="10 + mod.dex + mod.wis" style={{ borderColor: err ? "var(--ember)" : undefined }} />
                        <button className="btn btn-danger btn-ghost px-2" onClick={() => removeEffect(f.id, i)} aria-label="Rimuovi effetto"><Trash2 size={14} /></button>
                      </div>
                      <p className="text-[11px] mt-1 ml-1" style={{ color: err ? "var(--ember)" : "var(--muted)" }}>
                        {err ? "Formula non valida" : preview !== null ? `${EFFECT_TARGETS.find((t) => t.value === eff.target)?.label}: ${eff.mode === "add" ? "+" : "= "}${preview}` : "—"}
                      </p>
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-2 mt-1">
                  <button className="btn btn-ghost text-xs py-1" onClick={() => addEffect(f.id, { target: "ac", mode: "add", formula: "1" })}>
                    <Plus size={13} /> Effetto
                  </button>
                  {EFFECT_PRESETS.map((p) => (
                    <button key={p.label} className="btn btn-ghost text-xs py-1" onClick={() => addEffect(f.id, { ...p.effect })}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!f.homebrew} onChange={(e) => edit(f.id, { homebrew: e.target.checked })} />
                    Homebrew
                  </label>
                  <RefLink name={f.homebrew ? undefined : f.name} />
                </div>
                <button className="btn btn-danger btn-ghost text-sm" onClick={() => remove(f.id)}>
                  <Trash2 size={15} /> Elimina
                </button>
              </div>
            </div>
          </ItemCard>
        );
      })}
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
