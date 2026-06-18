"use client";

import { Sparkle, Skull, Brain, Minus, Plus, Dices } from "lucide-react";
import { CONDITIONS, CONDITION_DESC, exhaustionPenalty } from "@/lib/srd";
import { useRoll } from "@/lib/rollStore";
import { derive } from "@/lib/rules";
import { fmt, type SectionProps } from "./common";

/** Inspiration, death saves, conditions, exhaustion, concentration — the
 * moment-to-moment combat state that lives below the core stats on Overview. */
export function CombatState({ character: c, update }: SectionProps) {
  const rollD20 = useRoll((s) => s.rollD20);
  const d = derive(c);
  const ds = c.deathSaves ?? { successes: 0, failures: 0 };
  const conditions = c.conditions ?? [];
  const exh = c.exhaustion ?? 0;

  function setDeath(kind: "successes" | "failures", n: number) {
    update((d) => {
      d.deathSaves ??= { successes: 0, failures: 0 };
      d.deathSaves[kind] = d.deathSaves[kind] === n ? n - 1 : n; // tap same pip to clear down
    });
  }
  function rollDeathSave() {
    const r = rollD20("Tiro salvezza morte", 0);
    if (!r) return;
    update((d) => {
      d.deathSaves ??= { successes: 0, failures: 0 };
      if (r.fumble) d.deathSaves.failures = Math.min(3, d.deathSaves.failures + 2);
      else if (r.crit) {
        d.deathSaves = { successes: 0, failures: 0 };
        d.currentHp = Math.max(1, d.currentHp);
      } else if (r.total >= 10) d.deathSaves.successes = Math.min(3, d.deathSaves.successes + 1);
      else d.deathSaves.failures = Math.min(3, d.deathSaves.failures + 1);
    });
  }
  function toggleCondition(key: string) {
    update((d) => {
      const list = new Set(d.conditions ?? []);
      list.has(key) ? list.delete(key) : list.add(key);
      d.conditions = [...list];
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* inspiration + concentration row */}
      <div className="grid grid-cols-2 gap-3">
        {(() => {
          const insp = c.inspirationCount ?? (c.inspiration ? 1 : 0);
          const set = (n: number) => update((d) => { d.inspirationCount = Math.max(0, n); d.inspiration = n > 0; });
          return (
            <div className="card p-3 flex items-center justify-between" style={insp > 0 ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}>
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: insp > 0 ? "var(--accent)" : "var(--muted)" }}>
                <Sparkle size={16} /> Ispirazione
              </span>
              <div className="flex items-center gap-1.5">
                <button className="btn px-2 py-1" disabled={insp <= 0} onClick={() => set(insp - 1)}><Minus size={14} /></button>
                <span className="font-bold w-5 text-center" style={{ color: insp > 0 ? "var(--accent)" : "var(--text)" }}>{insp}</span>
                <button className="btn px-2 py-1" onClick={() => set(insp + 1)}><Plus size={14} /></button>
              </div>
            </div>
          );
        })()}
        <div className="card p-3 flex flex-col justify-center">
          <span className="text-[11px] uppercase tracking-wide text-[var(--muted)] flex items-center gap-1 mb-1">
            <Brain size={12} /> Concentrazione
          </span>
          <div className="flex items-center gap-2">
            <input
              className="bg-transparent outline-none text-sm font-medium flex-1 min-w-0"
              placeholder="nessuna"
              value={c.concentration ?? ""}
              onChange={(e) => update((dr) => (dr.concentration = e.target.value))}
            />
            {c.concentration?.trim() && (
              <button
                className="btn px-2 py-1 text-xs shrink-0"
                title="Tiro salvezza Costituzione (CD 10 o metà danni)"
                onClick={() => rollD20("TS Concentrazione (Cost.)", d.saves.con.mod)}
              >
                <Dices size={13} /> TS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* death saves */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 font-semibold">
            <Skull size={18} style={{ color: "var(--muted)" }} /> Tiri salvezza morte
          </span>
          <button className="btn text-sm py-1.5" onClick={rollDeathSave}>Tira</button>
        </div>
        <div className="flex items-center justify-between">
          <Pips label="Successi" color="var(--good)" value={ds.successes} onSet={(n) => setDeath("successes", n)} />
          <Pips label="Fallimenti" color="var(--ember)" value={ds.failures} onSet={(n) => setDeath("failures", n)} />
        </div>
      </div>

      {/* exhaustion */}
      <div className="card p-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Sfinimento</p>
          <p className="text-[11px] text-[var(--muted)]">
            {exh > 0 ? `Livello ${exh} · ${fmt(-exhaustionPenalty(exh))} ai tiri d20 e CD` : "Nessuno"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn px-2.5 py-2" onClick={() => update((d) => (d.exhaustion = Math.max(0, (d.exhaustion ?? 0) - 1)))}><Minus size={16} /></button>
          <span className="text-xl font-bold w-6 text-center" style={{ color: exh > 0 ? "var(--ember)" : "var(--text)" }}>{exh}</span>
          <button className="btn px-2.5 py-2" onClick={() => update((d) => (d.exhaustion = Math.min(6, (d.exhaustion ?? 0) + 1)))}><Plus size={16} /></button>
        </div>
      </div>

      {/* conditions */}
      <div className="card p-4">
        <p className="text-sm font-semibold mb-3">Condizioni</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CONDITIONS).map(([key, label]) => {
            const on = conditions.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleCondition(key)}
                className="text-sm px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: on ? "var(--ember)" : "var(--border)",
                  background: on ? "var(--ember-soft)" : "transparent",
                  color: on ? "var(--ember)" : "var(--muted)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* descriptions of the active conditions */}
        {conditions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2.5">
            {conditions
              .filter((k) => CONDITION_DESC[k])
              .map((k) => (
                <div key={k}>
                  <p className="text-sm font-semibold" style={{ color: "var(--ember)" }}>
                    {CONDITIONS[k]}
                  </p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{CONDITION_DESC[k]}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Pips({ label, color, value, onSet }: { label: string; color: string; value: number; onSet: (n: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => onSet(n)}
            className="size-6 rounded-full border-2"
            style={{ borderColor: color, background: value >= n ? color : "transparent" }}
            aria-label={`${label} ${n}`}
          />
        ))}
      </div>
    </div>
  );
}
