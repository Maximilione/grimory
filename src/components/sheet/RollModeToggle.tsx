"use client";

import { ChevronUp, ChevronDown, Minus } from "lucide-react";
import { useRoll, type RollMode } from "@/lib/rollStore";

const OPTS: { mode: RollMode; label: string; icon: React.ReactNode; color: string }[] = [
  { mode: "dis", label: "Svantaggio", icon: <ChevronDown size={15} />, color: "var(--ember)" },
  { mode: "normal", label: "Normale", icon: <Minus size={15} />, color: "var(--muted)" },
  { mode: "adv", label: "Vantaggio", icon: <ChevronUp size={15} />, color: "var(--good)" },
];

/**
 * Sticky advantage/disadvantage selector. Applies to every d20 roll (checks,
 * saves, skills, attack to-hit) until changed. Stays visible so the mode is
 * never a surprise.
 */
export function RollModeToggle() {
  const mode = useRoll((s) => s.mode);
  const setMode = useRoll((s) => s.setMode);

  return (
    <div className="fixed left-3 bottom-[max(0.9rem,env(safe-area-inset-bottom))] z-40 card p-1 flex gap-1 shadow-lg">
      {OPTS.map((o) => {
        const active = mode === o.mode;
        return (
          <button
            key={o.mode}
            onClick={() => setMode(o.mode)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            title={o.label}
            style={{
              background: active ? "var(--surface-2)" : "transparent",
              color: active ? o.color : "var(--muted)",
              border: active ? `1px solid ${o.color}` : "1px solid transparent",
            }}
          >
            {o.icon}
            <span className={active ? "inline" : "hidden sm:inline"}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
