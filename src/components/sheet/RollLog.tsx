"use client";

import { useState } from "react";
import { ScrollText, X, Dices, Trash2 } from "lucide-react";
import { useRoll } from "@/lib/rollStore";

/** Session roll history. Floating button bottom-right opens a panel listing
 * the last rolls (already kept in the store). */
export function RollLog() {
  const log = useRoll((s) => s.log);
  const clear = useRoll((s) => s.clear);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="fixed right-3 bottom-[max(0.9rem,env(safe-area-inset-bottom))] z-40 card size-12 grid place-items-center shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Cronologia tiri"
      >
        <ScrollText size={20} style={{ color: "var(--accent)" }} />
        {log.length > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 text-[10px] font-bold size-5 grid place-items-center rounded-full"
            style={{ background: "var(--accent)", color: "#1a1407" }}
          >
            {log.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="ml-auto h-full w-full max-w-sm bg-[var(--surface)] border-l border-[var(--border)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 p-3 border-b border-[var(--border)] pt-[max(0.75rem,env(safe-area-inset-top))]">
              <Dices size={18} style={{ color: "var(--accent)" }} />
              <span className="font-semibold flex-1">Cronologia tiri</span>
              {log.length > 0 && (
                <button className="text-[var(--muted)] p-1" onClick={clear} aria-label="Svuota">
                  <Trash2 size={17} />
                </button>
              )}
              <button className="text-[var(--muted)] p-1" onClick={() => setOpen(false)} aria-label="Chiudi">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {log.length === 0 && <p className="text-center text-sm text-[var(--muted)] py-10">Nessun tiro ancora.</p>}
              {log.map((e) => (
                <div key={e.id} className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-3">
                  <span
                    className="text-xl font-bold w-10 text-center shrink-0"
                    style={{ color: e.crit ? "var(--accent)" : e.fumble ? "var(--ember)" : "var(--text)" }}
                  >
                    {e.total}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">
                      {e.label}
                      {e.crit && <span style={{ color: "var(--accent)" }}> · CRIT</span>}
                      {e.fumble && <span style={{ color: "var(--ember)" }}> · x1</span>}
                      {e.mode === "adv" && <span style={{ color: "var(--good)" }}> · vant.</span>}
                      {e.mode === "dis" && <span style={{ color: "var(--ember)" }}> · svant.</span>}
                    </p>
                    <p className="text-[11px] text-[var(--muted)] font-mono truncate">
                      {e.expr} → [{e.rolls.join(", ")}]
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
