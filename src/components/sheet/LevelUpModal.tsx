"use client";

import { useState } from "react";
import { X, ChevronsUp, Plus, Sparkles, Loader2, Star, Award } from "lucide-react";
import { CLASSES, SKILLS, ABILITY_NAMES, classByKey, featureEffects } from "@/lib/srd";
import { abilityMod, getClasses, buildSpellSlots, derive } from "@/lib/rules";
import { fetchClassFeatures, type ClassFeature } from "@/lib/srdApi";
import { GENERAL_FEATS } from "@/lib/feats2024";
import { uid } from "@/lib/db";
import { ABILITIES, type Ability } from "@/lib/types";
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
              {result.asi && <AsiFeatPicker character={c} update={update} />}
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

/** ASI level: choose +2/+1 ability increase OR a General feat (adds the feat as
 * a privilege with its effects, plus the feat's +1 ability). */
function AsiFeatPicker({ character: c, update }: SectionProps) {
  const [tab, setTab] = useState<"asi" | "feat">("asi");
  const [plus2, setPlus2] = useState<Ability | "">("");
  const [plus1, setPlus1] = useState<Ability | "">("");
  const [featName, setFeatName] = useState("");
  const [featAbil, setFeatAbil] = useState<string>("");
  const [done, setDone] = useState<string | null>(null);

  const feat = GENERAL_FEATS.find((f) => f.name === featName);

  function applyAsi() {
    if (!plus2) return;
    update((d) => {
      d.abilities[plus2] = Math.min(20, d.abilities[plus2] + 2);
      if (plus1 && plus1 !== plus2) d.abilities[plus1] = Math.min(20, d.abilities[plus1] + 1);
    });
    setDone(`+2 ${ABILITY_NAMES[plus2]}${plus1 && plus1 !== plus2 ? `, +1 ${ABILITY_NAMES[plus1 as Ability]}` : ""}`);
  }
  function applyFeat() {
    if (!feat) return;
    update((d) => {
      if (featAbil) d.abilities[featAbil as Ability] = Math.min(20, d.abilities[featAbil as Ability] + 1);
      d.features.unshift({
        id: uid(),
        name: feat.name,
        source: "Talento",
        description: feat.desc,
        ref: feat.name,
        ...(feat.effects ? { effects: feat.effects } : {}),
      });
    });
    setDone(`Talento: ${feat.name}${featAbil ? ` (+1 ${ABILITY_NAMES[featAbil as Ability]})` : ""}`);
  }

  if (done)
    return (
      <div className="card p-3" style={{ borderColor: "var(--good)" }}>
        <p className="text-sm" style={{ color: "var(--good)" }}>✓ {done}</p>
      </div>
    );

  return (
    <div className="card p-3 flex flex-col gap-3" style={{ borderColor: "var(--accent)" }}>
      <p className="font-semibold flex items-center gap-2" style={{ color: "var(--accent)" }}>
        <Star size={15} /> Aumento di Caratteristica o Talento
      </p>
      <div className="flex gap-2">
        {(["asi", "feat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-sm px-3 py-1.5 rounded-lg border flex-1"
            style={{
              borderColor: tab === t ? "var(--accent)" : "var(--border)",
              background: tab === t ? "var(--accent-soft)" : "transparent",
              color: tab === t ? "var(--accent)" : "var(--text)",
            }}
          >
            {t === "asi" ? "Caratteristiche" : "Talento"}
          </button>
        ))}
      </div>

      {tab === "asi" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <label className="flex items-center gap-1">+2
              <select className="field py-1 px-2 w-auto" value={plus2} onChange={(e) => setPlus2(e.target.value as Ability)}>
                <option value="">—</option>
                {ABILITIES.map((a) => (<option key={a} value={a}>{ABILITY_NAMES[a]}</option>))}
              </select>
            </label>
            <label className="flex items-center gap-1">+1
              <select className="field py-1 px-2 w-auto" value={plus1} onChange={(e) => setPlus1(e.target.value as Ability)}>
                <option value="">—</option>
                {ABILITIES.filter((a) => a !== plus2).map((a) => (<option key={a} value={a}>{ABILITY_NAMES[a]}</option>))}
              </select>
            </label>
          </div>
          <button className="btn btn-accent text-sm self-start" disabled={!plus2} onClick={applyAsi}>Conferma</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <select className="field" value={featName} onChange={(e) => { setFeatName(e.target.value); setFeatAbil(""); }}>
            <option value="">— scegli talento —</option>
            {GENERAL_FEATS.map((f) => (<option key={f.name} value={f.name}>{f.name}</option>))}
          </select>
          {feat && <p className="text-xs text-[var(--muted)]">{feat.desc}</p>}
          {feat?.abilities && (
            <label className="text-sm flex items-center gap-2">+1 a
              <select className="field py-1 px-2 w-auto" value={featAbil} onChange={(e) => setFeatAbil(e.target.value)}>
                <option value="">—</option>
                {feat.abilities.map((a) => (<option key={a} value={a}>{ABILITY_NAMES[a as Ability]}</option>))}
              </select>
            </label>
          )}
          <button className="btn btn-accent text-sm self-start" disabled={!feat} onClick={applyFeat}>Conferma talento</button>
        </div>
      )}
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
