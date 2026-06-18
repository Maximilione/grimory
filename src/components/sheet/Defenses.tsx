"use client";

import { useState } from "react";
import { Plus, X, ShieldHalf, Eye, Wind } from "lucide-react";
import type { Character } from "@/lib/types";
import { SectionHeader, type SectionProps } from "./common";

type ListKey = "resistances" | "immunities" | "vulnerabilities" | "conditionImmunities" | "senses";
const GROUPS: { key: ListKey; label: string; ph: string; color: string }[] = [
  { key: "resistances", label: "Resistenze", ph: "Es. Fuoco", color: "var(--good)" },
  { key: "immunities", label: "Immunità", ph: "Es. Veleno", color: "var(--good)" },
  { key: "vulnerabilities", label: "Vulnerabilità", ph: "Es. Freddo", color: "var(--ember)" },
  { key: "conditionImmunities", label: "Immunità a condizioni", ph: "Es. Affascinato", color: "var(--accent)" },
  { key: "senses", label: "Sensi", ph: "Es. Scurovisione 18 m", color: "var(--accent)" },
];

export function Defenses({ character: c, update }: SectionProps) {
  const speeds = c.speeds ?? {};
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Difese & Sensi" desc="Resistenze, immunità, vulnerabilità, sensi e velocità aggiuntive." />

      {/* extra movement speeds */}
      <div className="card p-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Wind size={16} style={{ color: "var(--accent)" }} /> Velocità aggiuntive (m)</p>
        <div className="grid grid-cols-4 gap-2">
          {(["fly", "swim", "climb", "burrow"] as const).map((k) => (
            <label key={k} className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-[var(--muted)] mb-1">{{ fly: "Volo", swim: "Nuoto", climb: "Scalata", burrow: "Scavo" }[k]}</span>
              <input type="number" inputMode="numeric" className="field text-center px-1" value={speeds[k] ?? 0}
                onChange={(e) => update((d) => { d.speeds ??= {}; const v = +e.target.value || 0; if (v) d.speeds[k] = v; else delete d.speeds[k]; })} />
            </label>
          ))}
        </div>
      </div>

      {GROUPS.map((g) => (
        <ChipList
          key={g.key}
          icon={g.key === "senses" ? <Eye size={16} /> : <ShieldHalf size={16} />}
          label={g.label}
          placeholder={g.ph}
          color={g.color}
          values={(c[g.key] as string[]) ?? []}
          onChange={(next) => update((d) => { d[g.key] = next; })}
        />
      ))}
    </div>
  );
}

function ChipList({ icon, label, placeholder, color, values, onChange }: {
  icon: React.ReactNode; label: string; placeholder: string; color: string; values: string[]; onChange: (n: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v || values.some((x) => x.toLowerCase() === v.toLowerCase())) { setDraft(""); return; }
    onChange([...values, v]);
    setDraft("");
  }
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold mb-3 flex items-center gap-2"><span style={{ color }}>{icon}</span> {label} <span className="text-[var(--muted)] font-normal">({values.length})</span></p>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1.5 text-sm pl-3 pr-2 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {v}
              <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-[var(--muted)] hover:text-[var(--ember)]" aria-label={`Rimuovi ${v}`}><X size={14} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input className="field" placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={add}><Plus size={16} /></button>
      </div>
    </div>
  );
}
