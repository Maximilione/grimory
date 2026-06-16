"use client";

import { useEffect, useState } from "react";
import { Dices, X } from "lucide-react";
import { useRoll } from "@/lib/rollStore";

/** Floating result of the most recent roll. Auto-hides; tap to dismiss. */
export function RollToast() {
  const last = useRoll((s) => s.last);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!last) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [last]);

  if (!last || !visible) return null;

  return (
    <button
      onClick={() => setVisible(false)}
      className="fixed left-1/2 -translate-x-1/2 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 card px-4 py-3 flex items-center gap-3 shadow-xl"
      style={{ borderColor: last.crit ? "var(--accent)" : "var(--border)", minWidth: 200 }}
    >
      <Dices size={20} style={{ color: "var(--accent)" }} />
      <div className="text-left">
        <p className="text-xs text-[var(--muted)] leading-tight">
          {last.label}
          {last.mode === "adv" && <span style={{ color: "var(--good)" }}> · vantaggio</span>}
          {last.mode === "dis" && <span style={{ color: "var(--ember)" }}> · svantaggio</span>}
        </p>
        <p className="font-bold leading-tight">
          <span className="text-2xl" style={{ color: last.crit ? "var(--accent)" : last.fumble ? "var(--ember)" : "var(--text)" }}>
            {last.total}
          </span>
          {last.crit && <span className="text-xs ml-2" style={{ color: "var(--accent)" }}>CRIT!</span>}
          {last.fumble && <span className="text-xs ml-2" style={{ color: "var(--ember)" }}>x1!</span>}
        </p>
        {last.rolls.length > 0 && (
          <p className="text-[11px] text-[var(--muted)]">
            {last.mode === "adv" || last.mode === "dis" ? (
              <>
                d20:{" "}
                {last.rolls.map((r, i) => (
                  <span key={i} style={r === last.keptDie ? { color: "var(--text)", fontWeight: 700 } : { textDecoration: "line-through" }}>
                    {r}{i < last.rolls.length - 1 ? " · " : ""}
                  </span>
                ))}
              </>
            ) : (
              <>dadi: {last.rolls.join(", ")}</>
            )}
          </p>
        )}
      </div>
      <X size={16} className="text-[var(--muted)]" />
    </button>
  );
}
