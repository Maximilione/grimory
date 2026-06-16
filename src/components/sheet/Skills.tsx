"use client";

import { SKILLS, ABILITY_NAMES } from "@/lib/srd";
import { derive } from "@/lib/rules";
import { SectionHeader, RollButton, type SectionProps } from "./common";

const TIERS = ["none", "prof", "expert"] as const;
const TIER_LABEL = { none: "—", prof: "C", expert: "E" };

export function Skills({ character: c, update }: SectionProps) {
  const d = derive(c);
  const entries = Object.entries(SKILLS).sort((a, b) => a[1].label.localeCompare(b[1].label));

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Abilità"
        desc="Tocca il cerchio per ciclare: — (niente) → C (competente) → E (esperto)."
      />
      {entries.map(([key, def]) => {
        const sk = d.skills[key];
        const tier = sk.tier;
        return (
          <div key={key} className="card px-3 py-2.5 flex items-center gap-3">
            <button
              className="size-8 rounded-full border grid place-items-center text-xs font-bold shrink-0"
              style={{
                borderColor: tier === "none" ? "var(--border)" : "var(--accent)",
                background: tier === "none" ? "transparent" : "var(--accent-soft)",
                color: tier === "none" ? "var(--muted)" : "var(--accent)",
              }}
              onClick={() =>
                update((draft) => {
                  const cur = draft.skills[key] ?? "none";
                  const next = TIERS[(TIERS.indexOf(cur as typeof TIERS[number]) + 1) % TIERS.length];
                  draft.skills[key] = next;
                })
              }
            >
              {TIER_LABEL[tier]}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{def.label}</p>
              <p className="text-[11px] uppercase text-[var(--muted)]">{ABILITY_NAMES[def.ability]}</p>
            </div>
            <RollButton label={def.label} bonus={sk.mod} />
          </div>
        );
      })}
    </div>
  );
}
