"use client";

import { useState } from "react";
import { Plus, Trash2, FlaskConical } from "lucide-react";
import { formulaVars, derive, carryCapacity } from "@/lib/rules";
import { avgExpr, validateFormula, rollExpr } from "@/lib/dice";
import { useRoll } from "@/lib/rollStore";
import { SectionHeader, FormulaField, type SectionProps } from "./common";
import { Resources } from "./Resources";

const OVERRIDE_FIELDS: { key: string; label: string; ex: string }[] = [
  { key: "armorClass", label: "Classe Armatura", ex: "10 + mod.dex + mod.con" },
  { key: "initiative", label: "Iniziativa", ex: "mod.dex + prof" },
  { key: "maxHp", label: "PF massimi", ex: "8 + level * (5 + mod.con)" },
  { key: "speed", label: "Velocità (m)", ex: "9" },
  { key: "spellSaveDc", label: "CD Incantesimi", ex: "8 + prof + mod.spell" },
  { key: "spellAttack", label: "Attacco Incantesimi", ex: "prof + mod.spell" },
  { key: "passivePerception", label: "Percezione passiva", ex: "10 + mod.wis + prof" },
  { key: "passiveInvestigation", label: "Indagare passiva", ex: "10 + mod.int" },
  { key: "passiveInsight", label: "Intuizione passiva", ex: "10 + mod.wis" },
  { key: "carryCapacity", label: "Capacità di carico", ex: "str * 15" },
];

export function Homebrew({ character: c, update }: SectionProps) {
  const vars = formulaVars(c);
  const customEntries = Object.entries(c.customVars ?? {});
  const [newName, setNewName] = useState("");
  const [test, setTest] = useState("1d8 + mod.str + prof");
  const roll = useRoll((s) => s.roll);

  function setVar(name: string, value: number) {
    update((d) => {
      d.customVars ??= {};
      d.customVars[name] = value;
    });
  }
  function renameVar(oldName: string, newName: string) {
    update((d) => {
      d.customVars ??= {};
      const v = d.customVars[oldName];
      delete d.customVars[oldName];
      d.customVars[newName] = v ?? 0;
    });
  }
  function removeVar(name: string) {
    update((d) => {
      if (d.customVars) delete d.customVars[name];
    });
  }
  function addVar() {
    const n = newName.trim().replace(/\s+/g, "_");
    if (!n) return;
    setVar(n, 0);
    setNewName("");
  }

  const testErr = test.trim() ? validateFormula(test, vars, true) : null;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Homebrew & Scaling"
        desc="Definisci variabili tue e usale in qualsiasi formula di danno, attacco o usi."
      />

      {/* override calculation formulas */}
      <div className="card p-4">
        <p className="font-semibold mb-1">Override formule di calcolo</p>
        <p className="text-xs text-[var(--muted)] mb-3">
          Sostituisci la formula di una statistica derivata. Vuoto = calcolo standard. Valore attuale a destra.
        </p>
        <div className="flex flex-col gap-3">
          {OVERRIDE_FIELDS.map((f) => {
            const current =
              f.key === "carryCapacity"
                ? carryCapacity(c)
                : (derive(c) as unknown as Record<string, number | undefined>)[f.key];
            return (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{f.label}</span>
                  <span className="text-xs" style={{ color: "var(--accent)" }}>= {current ?? "—"}</span>
                </div>
                <FormulaField
                  value={c.formulaOverrides?.[f.key] ?? ""}
                  onChange={(v) =>
                    update((d) => {
                      d.formulaOverrides ??= {};
                      if (!v.trim()) delete d.formulaOverrides[f.key];
                      else d.formulaOverrides[f.key] = v;
                    })
                  }
                  character={c}
                  allowDice={false}
                  placeholder={f.ex}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* custom resource pools */}
      <Resources character={c} update={update} />

      {/* custom max-HP modifier (can be negative) */}
      <div className="card p-4">
        <p className="font-semibold mb-1">Modificatore PF massimi</p>
        <p className="text-xs text-[var(--muted)] mb-3">
          Valore fisso aggiunto (o sottratto) ai PF massimi. Usalo per bonus/malus homebrew.
        </p>
        <input
          type="number"
          inputMode="numeric"
          className="field w-32 text-center"
          value={c.maxHpBonus ?? 0}
          onChange={(e) => update((d) => (d.maxHpBonus = +e.target.value || 0))}
        />
      </div>

      {/* Custom vars */}
      <div className="card p-4">
        <p className="font-semibold mb-1">Variabili personalizzate</p>
        <p className="text-xs text-[var(--muted)] mb-3">
          Richiamabili in ogni formula come <code>nome</code> o <code>customVars.nome</code>.
          Es. crea <code>rage</code> = 2 e usa <code>1d12 + mod.str + rage</code>.
        </p>
        <div className="flex flex-col gap-2 mb-3">
          {customEntries.length === 0 && (
            <p className="text-sm text-[var(--muted)]">Nessuna variabile ancora.</p>
          )}
          {customEntries.map(([name, value]) => (
            <div key={name} className="flex items-center gap-2">
              <input
                className="field font-mono text-sm flex-1"
                defaultValue={name}
                onBlur={(e) => {
                  const nn = e.target.value.trim().replace(/\s+/g, "_");
                  if (nn && nn !== name) renameVar(name, nn);
                }}
              />
              <input
                type="number"
                className="field w-24 text-center"
                value={value}
                onChange={(e) => setVar(name, +e.target.value || 0)}
              />
              <button className="btn btn-danger btn-ghost px-2" onClick={() => removeVar(name)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="field font-mono text-sm flex-1"
            placeholder="nome_variabile"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addVar()}
          />
          <button className="btn btn-accent" onClick={addVar}>
            <Plus size={16} /> Aggiungi
          </button>
        </div>
      </div>

      {/* Formula tester */}
      <div className="card p-4">
        <p className="font-semibold mb-3 flex items-center gap-2">
          <FlaskConical size={16} style={{ color: "var(--accent)" }} /> Banco di prova formule
        </p>
        <input
          className="field font-mono text-sm mb-2"
          value={test}
          onChange={(e) => setTest(e.target.value)}
          style={{ borderColor: testErr ? "var(--ember)" : undefined }}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: testErr ? "var(--ember)" : "var(--muted)" }}>
            {testErr ? `Errore: ${testErr}` : `media ≈ ${Math.round(avgExpr(test, vars) * 10) / 10}`}
          </span>
          <button
            className="btn"
            disabled={!!testErr}
            onClick={() => roll("Prova formula", test, vars)}
          >
            Tira
          </button>
        </div>
      </div>

      {/* Variable reference */}
      <div className="card p-4">
        <p className="font-semibold mb-3">Variabili disponibili (valori attuali)</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm font-mono">
          {Object.entries(vars)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-[var(--muted)] truncate">{k}</span>
                <span style={{ color: "var(--accent)" }}>{v}</span>
              </div>
            ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          Funzioni: floor, ceil, round, abs, min, max. Dadi: <code>NdM</code> (es. 2d6).
        </p>
      </div>
    </div>
  );
}
