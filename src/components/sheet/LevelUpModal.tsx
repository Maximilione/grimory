"use client";

import { useState } from "react";
import { X, ChevronsUp, Plus, Sparkles, Loader2, Star, Award } from "lucide-react";
import { CLASSES, SKILLS, classByKey, featureEffects } from "@/lib/srd";
import { abilityMod, getClasses, buildSpellSlots, derive } from "@/lib/rules";
import { fetchClassFeatures, type ClassFeature } from "@/lib/srdApi";
import { uid } from "@/lib/db";
import type { SectionProps } from "./common";

/**
 * Guided, multiclass-aware level up. Pick WHICH class to advance (or add a new
 * one). On confirm: total level +1, HP added, spell slots recomputed across all
 * classes, and that class's 2024 features for the new class-level are pulled
 * from Open5e and added to the sheet. ASI/feat levels are flagged (not auto-applied).
 */
export function LevelUpModal({ character: c, update, onClose }: SectionProps & { onClose: () => void }) {
  const classes = getClasses(c);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    className: string;
    classLevel: number;
    gained: ClassFeature[];
    asi: boolean;
  } | null>(null);

  const takenKeys = new Set(classes.map((e) => e.key));
  const addable = CLASSES.filter((cd) => !takenKeys.has(cd.key));
  const atCap = c.level >= 20;

  async function levelClass(key: string) {
    if (busy || atCap) return;
    setBusy(true);
    const cd = classByKey(key);
    const features = await fetchClassFeatures(key);

    const next = classes.map((e) => ({ ...e }));
    let entry = next.find((e) => e.key === key);
    if (!entry) {
      entry = { key, level: 0 };
      next.push(entry);
    }
    const newClassLevel = ++entry.level;

    const die = cd?.hitDie ?? 8;
    const conMod = abilityMod(c.abilities.con);
    const avg = Math.max(1, Math.floor(die / 2) + 1 + conMod);
    const gained = features[newClassLevel] ?? [];
    const asi = gained.some((f) => f.isASI);

    await update((d) => {
      d.classes = next;
      if (!d.classKey) d.classKey = next[0].key;
      d.className = classByKey(next[0].key)?.name;
      d.level = next.reduce((s, e) => s + e.level, 0);
      d.maxHp += avg;
      d.currentHp += avg;
      d.hitDiceTotal = d.level;
      d.spellSlots = buildSpellSlots(d);
      for (const f of gained) {
        if (f.isASI) continue; // surfaced as a prompt, user chooses ASI vs feat
        if (d.features.some((x) => x.name === f.name && x.source === cd?.name)) continue;
        const effects = featureEffects(f.name, key);
        d.features.unshift({
          id: uid(),
          name: f.name,
          source: cd?.name,
          description: f.desc,
          ...(effects.length ? { effects } : {}),
        });
      }
    });

    setResult({ className: cd?.name ?? key, classLevel: newClassLevel, gained, asi });
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60" onClick={onClose}>
      <div
        className="mt-auto md:m-auto w-full md:max-w-md card rounded-b-none md:rounded-b-[var(--radius)] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2 p-3 border-b border-[var(--border)]">
          <ChevronsUp size={18} style={{ color: "var(--accent)" }} />
          <span className="font-semibold flex-1">Sali di livello {result ? "" : `(totale ${c.level})`}</span>
          <button onClick={onClose} className="text-[var(--muted)] p-1" aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {busy && (
            <div className="flex items-center justify-center gap-2 py-10 text-[var(--muted)] text-sm">
              <Loader2 size={16} className="animate-spin" /> Applico livello e privilegi…
            </div>
          )}

          {!busy && result && (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                <strong>{result.className}</strong> ora a livello {result.classLevel} · personaggio livello {c.level}.
              </p>
              {result.asi && (
                <div className="card p-3" style={{ borderColor: "var(--accent)" }}>
                  <p className="font-semibold flex items-center gap-2" style={{ color: "var(--accent)" }}>
                    <Star size={15} /> Aumento Caratteristiche o Talento
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    A questo livello scegli: +2 a una caratteristica (o +1 a due) <em>oppure</em> un talento.
                    Aggiorna i punteggi in Caratteristiche o aggiungi il talento in Tratti.
                  </p>
                </div>
              )}
              {result.gained.some((f) => /expertise|competenza/i.test(f.name)) && (
                <ExpertisePicker character={c} update={update} />
              )}
              {result.gained.filter((f) => !f.isASI).length > 0 ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-1.5">Privilegi ottenuti</p>
                  <ul className="flex flex-col gap-1.5">
                    {result.gained.filter((f) => !f.isASI).map((f) => (
                      <li key={f.name} className="flex items-center gap-2 text-sm">
                        <Sparkles size={14} style={{ color: "var(--accent)" }} /> {f.name}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-[var(--muted)] mt-2">Aggiunti in Tratti &amp; Privilegi.</p>
                </div>
              ) : (
                !result.asi && <p className="text-sm text-[var(--muted)]">Nessun nuovo privilegio a questo livello.</p>
              )}
              <button className="btn btn-accent mt-2" onClick={onClose}>Fatto</button>
            </div>
          )}

          {!busy && !result && (
            <div className="flex flex-col gap-4">
              {atCap && <p className="text-sm" style={{ color: "var(--ember)" }}>Livello massimo (20) raggiunto.</p>}
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">Sali in una classe esistente</p>
                <div className="flex flex-col gap-2">
                  {classes.length === 0 && <p className="text-sm text-[var(--muted)]">Nessuna classe. Aggiungine una qui sotto.</p>}
                  {classes.map((e) => {
                    const cd = classByKey(e.key);
                    return (
                      <button
                        key={e.key}
                        className="card p-3 flex items-center justify-between text-left disabled:opacity-40"
                        disabled={atCap}
                        onClick={() => levelClass(e.key)}
                      >
                        <span className="font-medium">{cd?.name ?? e.key}</span>
                        <span className="text-sm text-[var(--muted)]">liv. {e.level} → {e.level + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!atCap && addable.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">Multiclasse — aggiungi una classe (liv. 1)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {addable.map((cd) => (
                      <button
                        key={cd.key}
                        className="btn btn-ghost justify-start text-sm"
                        onClick={() => levelClass(cd.key)}
                      >
                        <Plus size={14} /> {cd.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Expertise grants double proficiency on chosen skills — this lets the user
 * actually pick them (the bug: feature added but choice never offered). */
function ExpertisePicker({ character: c, update }: SectionProps) {
  const d = derive(c);
  const eligible = Object.entries(d.skills).filter(([, s]) => s.tier === "prof");
  const [sel, setSel] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  function toggle(key: string) {
    setSel((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length < 2 ? [...p, key] : p));
  }
  function apply() {
    update((draft) => sel.forEach((k) => (draft.skills[k] = "expert")));
    setDone(true);
  }

  return (
    <div className="card p-3" style={{ borderColor: "var(--accent)" }}>
      <p className="font-semibold flex items-center gap-2" style={{ color: "var(--accent)" }}>
        <Award size={15} /> Competenza (Expertise)
      </p>
      {done ? (
        <p className="text-sm text-[var(--good)] mt-1">Esperto in: {sel.map((k) => SKILLS[k]?.label ?? k).join(", ")} ✓</p>
      ) : eligible.length === 0 ? (
        <p className="text-xs text-[var(--muted)] mt-1">Nessuna competenza disponibile. Scegli prima le abilità competenti.</p>
      ) : (
        <>
          <p className="text-xs text-[var(--muted)] mt-1 mb-2">Scegli 2 competenze da raddoppiare ({sel.length}/2):</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {eligible.map(([key]) => {
              const on = sel.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className="text-sm px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: on ? "var(--accent)" : "var(--border)",
                    background: on ? "var(--accent-soft)" : "transparent",
                    color: on ? "var(--accent)" : "var(--text)",
                  }}
                >
                  {SKILLS[key]?.label ?? key}
                </button>
              );
            })}
          </div>
          <button className="btn btn-accent text-sm" disabled={sel.length === 0} onClick={apply}>
            Conferma Expertise
          </button>
        </>
      )}
    </div>
  );
}
