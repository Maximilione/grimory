"use client";

import { useState } from "react";
import { Plus, X, Swords, Shield, Wrench, Languages } from "lucide-react";
import type { Character } from "@/lib/types";
import { SectionHeader, type SectionProps } from "./common";

type ListKey = "weaponProfs" | "armorProfs" | "toolProfs" | "languages";

const GROUPS: { key: ListKey; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { key: "weaponProfs", label: "Armi", icon: <Swords size={16} />, placeholder: "Es. Armi semplici" },
  { key: "armorProfs", label: "Armature & Scudi", icon: <Shield size={16} />, placeholder: "Es. Armatura pesante" },
  { key: "toolProfs", label: "Strumenti", icon: <Wrench size={16} />, placeholder: "Es. Strumenti da fabbro" },
  { key: "languages", label: "Lingue", icon: <Languages size={16} />, placeholder: "Es. Comune" },
];

/** Dedicated screen for weapon/armor/shield/tool proficiencies and languages. */
export function Proficiencies({ character: c, update }: SectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Competenze & Lingue" desc="Competenze in armi, armature, scudi, strumenti e lingue conosciute." />
      {GROUPS.map((g) => (
        <ListEditor
          key={g.key}
          icon={g.icon}
          label={g.label}
          placeholder={g.placeholder}
          values={c[g.key] ?? []}
          onChange={(next) => update((d) => { d[g.key] = next; })}
        />
      ))}
    </div>
  );
}

function ListEditor({
  icon,
  label,
  placeholder,
  values,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v || values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span style={{ color: "var(--accent)" }}>{icon}</span> {label}
        <span className="text-[var(--muted)] font-normal">({values.length})</span>
      </p>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 text-sm pl-3 pr-2 py-1.5 rounded-full"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              {v}
              <button
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="text-[var(--muted)] hover:text-[var(--ember)]"
                aria-label={`Rimuovi ${v}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="field"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn" onClick={add}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
