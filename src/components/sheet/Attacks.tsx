"use client";

import { useState } from "react";
import { Plus, Trash2, Swords, Dices, RotateCcw, Wand2 } from "lucide-react";
import { uid } from "@/lib/db";
import { weaponAttack, formulaVars, derive } from "@/lib/rules";
import { evalFormula, critDice } from "@/lib/dice";
import { useRoll } from "@/lib/rollStore";
import type { Attack, Ability, Character } from "@/lib/types";
import { ABILITY_NAMES } from "@/lib/srd";
import {
  SectionHeader,
  ItemCard,
  Empty,
  FormulaField,
  RollButton,
  ExprRollButton,
  fmt,
  type SectionProps,
} from "./common";
import { Tag } from "./Weapons";

export function Attacks({ character: c, update }: SectionProps) {
  const vars = formulaVars(c);
  const d = derive(c);

  function addAttack() {
    update((draft) =>
      draft.attacks.unshift({
        id: uid(),
        name: "Nuova azione",
        toHit: { formula: "prof + mod.str" },
        damage: "1d6 + mod.str",
        damageType: "",
        homebrew: true,
      }),
    );
  }
  function editAttack(id: string, patch: Partial<Attack>) {
    update((draft) => {
      const a = draft.attacks.find((x) => x.id === id);
      if (a) Object.assign(a, patch);
    });
  }
  function removeAttack(id: string) {
    update((draft) => (draft.attacks = draft.attacks.filter((x) => x.id !== id)));
  }

  function resolveToHit(a: Attack): number | null {
    if (!a.toHit) return null;
    if (a.toHit.formula?.trim()) {
      try {
        return Math.round(evalFormula(a.toHit.formula, vars));
      } catch {
        return null;
      }
    }
    return a.toHit.fixed ?? 0;
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Attacchi disponibili" desc="Prima il tiro per colpire, poi si sbloccano i danni (×2 al critico)." />

      {/* Weapon-derived attacks */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-[var(--muted)] flex items-center gap-1.5">
          <Swords size={13} /> Armi
        </span>
        {/* Unarmed Strike — every creature always has it */}
        <AttackRow
          character={c}
          name="Colpo senz'armi"
          meta="contundenti"
          toHit={d.mods.str + d.prof}
          damageExpr="1 + mod.str"
        />
        {c.weapons.map((w) => {
          const atk = weaponAttack(c, w);
          return (
            <AttackRow
              key={w.id}
              character={c}
              name={w.name}
              meta={`${atk.damage} ${w.damageType}`}
              toHit={atk.toHit}
              damageExpr={atk.damage}
            />
          );
        })}
      </div>

      {/* Quick spells / cantrips with damage */}
      {d.spellAttack !== undefined && c.spells.some((s) => s.damage?.trim()) && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--muted)] flex items-center gap-1.5">
            <Wand2 size={13} /> Incantesimi rapidi
          </span>
          {c.spells
            .filter((s) => s.damage?.trim())
            .sort((a, b) => a.level - b.level)
            .map((s) => (
              <div key={s.id} className="card p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {s.level === 0 ? "Trucchetto" : `Liv. ${s.level}`}
                    {s.school ? ` · ${s.school}` : ""} · {s.damage}
                  </p>
                </div>
                <RollButton label={`${s.name} — attacco`} bonus={d.spellAttack!} />
                <ExprRollButton label={`${s.name} — danno`} expr={s.damage!} character={c}>
                  danno
                </ExprRollButton>
              </div>
            ))}
        </div>
      )}

      {/* Custom / homebrew attacks */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Azioni personalizzate</span>
          <button className="btn btn-accent text-sm py-1.5" onClick={addAttack}>
            <Plus size={15} /> Azione
          </button>
        </div>
        {c.attacks.length === 0 && <Empty>Nessuna azione homebrew.</Empty>}
        {c.attacks.map((a) => {
          const toHit = resolveToHit(a);
          return (
            <ItemCard
              key={a.id}
              title={<span className="flex items-center gap-2">{a.name} {a.homebrew && <Tag>HB</Tag>}</span>}
              meta={[
                a.save ? `TS ${ABILITY_NAMES[a.save]} CD ${d.spellSaveDc ?? "—"}` : toHit !== null ? `Colpire ${fmt(toHit)}` : null,
                a.damage ? `Danno ${a.damage}` : null,
              ].filter(Boolean).join(" · ")}
            >
              {/* live attack flow at top of the expanded card */}
              <div className="mb-3 -mt-1">
                <AttackRow
                  character={c}
                  name={a.name}
                  meta={a.damageType || ""}
                  toHit={a.save ? null : toHit}
                  damageExpr={a.damage}
                  save={a.save ? `TS ${ABILITY_NAMES[a.save]} · CD ${d.spellSaveDc ?? "—"}` : undefined}
                  bare
                />
              </div>
              <div className="flex flex-col gap-3 pt-3 border-t border-[var(--border)]">
                <L label="Nome">
                  <input className="field" value={a.name} onChange={(e) => editAttack(a.id, { name: e.target.value })} />
                </L>
                <L label="Bonus a colpire (formula)">
                  <FormulaField
                    value={a.toHit?.formula ?? ""}
                    onChange={(v) => editAttack(a.id, { toHit: { formula: v } })}
                    character={c}
                    allowDice={false}
                    placeholder="prof + mod.str"
                  />
                </L>
                <L label="Danno (formula con dadi)">
                  <FormulaField
                    value={a.damage ?? ""}
                    onChange={(v) => editAttack(a.id, { damage: v })}
                    character={c}
                    allowDice
                    placeholder="2d6 + mod.dex + ceil(level/2)"
                  />
                </L>
                <div className="grid grid-cols-2 gap-3">
                  <L label="Tipo danno">
                    <input className="field" value={a.damageType ?? ""} onChange={(e) => editAttack(a.id, { damageType: e.target.value })} />
                  </L>
                  <L label="Tiro salvezza (invece di colpire)">
                    <select className="field" value={a.save ?? ""} onChange={(e) => editAttack(a.id, { save: (e.target.value || undefined) as Ability | undefined })}>
                      <option value="">— (tiro per colpire)</option>
                      {(["str", "dex", "con", "int", "wis", "cha"] as Ability[]).map((ab) => (
                        <option key={ab} value={ab}>{ABILITY_NAMES[ab]}</option>
                      ))}
                    </select>
                  </L>
                </div>
                <button className="btn btn-danger btn-ghost text-sm self-end" onClick={() => removeAttack(a.id)}>
                  <Trash2 size={15} /> Elimina
                </button>
              </div>
            </ItemCard>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Guided attack flow: roll to-hit first, then the damage button unlocks.
 * A natural 20 marks the hit as a crit and the damage roll doubles its dice.
 * Save-based actions skip the to-hit gate (damage available immediately).
 */
function AttackRow({
  character,
  name,
  meta,
  toHit,
  damageExpr,
  save,
  bare,
}: {
  character: Character;
  name: string;
  meta?: string;
  toHit: number | null;
  damageExpr?: string;
  save?: string;
  bare?: boolean;
}) {
  const roll = useRoll((s) => s.roll);
  const rollD20 = useRoll((s) => s.rollD20);
  const [hit, setHit] = useState<{ total: number; crit: boolean; fumble: boolean } | null>(null);
  const vars = formulaVars(character);
  const damageUnlocked = save !== undefined || hit !== null;

  function rollToHit() {
    if (toHit === null) return;
    const r = rollD20(`${name} — colpire`, toHit);
    if (!r) return;
    setHit({ total: r.total, crit: !!r.crit, fumble: !!r.fumble });
  }

  function rollDamage() {
    if (!damageExpr) return;
    const crit = hit?.crit ?? false;
    const expr = crit ? critDice(damageExpr) : damageExpr;
    roll(`${name} — danni${crit ? " CRIT" : ""}`, expr, vars);
  }

  const Wrapper = bare ? "div" : "div";

  return (
    <Wrapper className={bare ? "" : "card p-3"}>
      {!bare && (
        <div className="mb-2">
          <p className="font-semibold leading-tight">{name}</p>
          {(meta || save) && (
            <p className="text-xs text-[var(--muted)]">{save ?? meta}</p>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {save ? (
          <span className="text-sm text-[var(--muted)] px-2 py-1.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
            {save}
          </span>
        ) : toHit !== null ? (
          <button className="btn" onClick={rollToHit} style={hit ? { borderColor: "var(--border)" } : { borderColor: "var(--accent)", color: "var(--accent)" }}>
            <Dices size={15} /> Colpire {fmt(toHit)}
          </button>
        ) : null}

        {/* to-hit result chip */}
        {hit && (
          <span
            className="text-sm font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{
              background: hit.crit ? "var(--accent-soft)" : hit.fumble ? "var(--ember-soft)" : "var(--surface-2)",
              color: hit.crit ? "var(--accent)" : hit.fumble ? "var(--ember)" : "var(--text)",
            }}
          >
            {hit.total}
            {hit.crit && " CRIT!"}
            {hit.fumble && " x1!"}
            <button onClick={rollToHit} aria-label="Ritira colpire" className="opacity-70">
              <RotateCcw size={13} />
            </button>
          </span>
        )}

        {/* damage button — unlocked after the to-hit roll (or always for saves) */}
        {damageExpr && (
          <button
            className={`btn ${hit?.crit ? "btn-accent" : ""}`}
            disabled={!damageUnlocked}
            onClick={rollDamage}
            style={!damageUnlocked ? { opacity: 0.4 } : undefined}
            title={!damageUnlocked ? "Prima tira per colpire" : undefined}
          >
            <Dices size={15} /> Danni{hit?.crit ? " ×2" : ""}
          </button>
        )}
      </div>
      {!damageUnlocked && damageExpr && (
        <p className="text-[11px] text-[var(--muted)] mt-1.5">Tira prima per colpire per sbloccare i danni.</p>
      )}
    </Wrapper>
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
