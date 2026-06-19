"use client";

import { useState } from "react";
import { Minus, Plus, ExternalLink, Dices } from "lucide-react";
import type { Character } from "@/lib/types";
import { referenceUrl } from "@/lib/srd";
import { useRoll } from "@/lib/rollStore";
import { formulaVars } from "@/lib/rules";
import { avgExpr, evalFormula, validateFormula, type Vars } from "@/lib/dice";

export interface SectionProps {
  character: Character;
  update: (mutator: (draft: Character) => void) => Promise<void>;
}

export function SectionHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-xl font-bold font-display tracking-wide">{title}</h2>
          {desc && <p className="text-sm text-[var(--muted)] mt-0.5">{desc}</p>}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
      <div className="rule-fancy mt-2.5" aria-hidden><span>◆</span></div>
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center gap-2">
      <button className="btn px-2.5 py-2" onClick={() => onChange(clamp(value - 1))} aria-label="-">
        <Minus size={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="field text-center w-16 px-1"
        value={value}
        onChange={(e) => onChange(clamp(+e.target.value || 0))}
      />
      <button className="btn px-2.5 py-2" onClick={() => onChange(clamp(value + 1))} aria-label="+">
        <Plus size={16} />
      </button>
    </div>
  );
}

/** Quick-reference link to official SRD data (Open5e). */
export function RefLink({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <a
      href={referenceUrl(name)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink size={12} /> manuale
    </a>
  );
}

export function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** A button that rolls 1d20 + a bonus and pushes the result to the roll toast. */
export function RollButton({
  label,
  bonus,
  className = "",
}: {
  label: string;
  bonus: number;
  className?: string;
}) {
  const rollD20 = useRoll((s) => s.rollD20);
  return (
    <button
      className={`btn px-2.5 py-1.5 text-sm ${className}`}
      onClick={() => rollD20(label, bonus)}
    >
      <Dices size={14} /> {fmt(bonus)}
    </button>
  );
}

/** Roll an arbitrary expression (e.g. damage) resolved against the character. */
export function ExprRollButton({
  label,
  expr,
  character,
  extraVars,
  children,
}: {
  label: string;
  expr: string;
  character: Character;
  extraVars?: Vars;
  children: React.ReactNode;
}) {
  const roll = useRoll((s) => s.roll);
  return (
    <button
      className="btn px-2.5 py-1.5 text-sm"
      onClick={() => roll(label, expr, { ...formulaVars(character), ...extraVars })}
    >
      <Dices size={14} /> {children}
    </button>
  );
}

/**
 * A formula input with live validation + a computed preview, evaluated against
 * the character's variables. This is what makes homebrew scaling tangible:
 * type "1d8 + mod.str + ceil(level/2)" and immediately see what it resolves to.
 */
export function FormulaField({
  value,
  onChange,
  character,
  allowDice,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  character: Character;
  allowDice: boolean;
  placeholder?: string;
}) {
  const vars = formulaVars(character);
  const err = value.trim() ? validateFormula(value, vars, allowDice) : null;
  let preview: string | null = null;
  if (value.trim() && !err) {
    try {
      preview = allowDice
        ? `media ≈ ${Math.round(avgExpr(value, vars) * 10) / 10}`
        : `= ${evalFormula(value, vars)}`;
    } catch {
      preview = null;
    }
  }
  return (
    <div>
      <input
        className="field font-mono text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "es. 1d8 + mod.str + prof"}
        style={{ borderColor: err ? "var(--ember)" : undefined }}
      />
      <p className="text-[11px] mt-1" style={{ color: err ? "var(--ember)" : "var(--muted)" }}>
        {err ? `Errore: ${err}` : preview ?? "Variabili: level, prof, mod.str…, spellDc, cantrip, customVars.*"}
      </p>
    </div>
  );
}

/** Generic "empty list" hint. */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="card p-6 text-center text-sm text-[var(--muted)]">{children}</div>
  );
}

/** Collapsible card used by every list item (weapon, spell, feature…). */
export function ItemCard({
  title,
  meta,
  right,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button className="flex-1 text-left min-w-0" onClick={() => setOpen((o) => !o)}>
          <p className="font-semibold truncate">{title}</p>
          {meta && <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{meta}</p>}
        </button>
        {right}
      </div>
      {open && children && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border)]">{children}</div>
      )}
    </div>
  );
}
