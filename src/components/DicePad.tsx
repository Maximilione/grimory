"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Dices, X, Minus, Plus } from "lucide-react";
import { useRoll, type RollEntry } from "@/lib/rollStore";

const DICE = [4, 6, 8, 10, 12, 20, 100];

/** Global free-dice roller — a floating button on pages without a sheet, so you
 * can roll "2d6+3" without opening a character. Hidden where the full roll UI
 * already lives (sheet / tracker). */
export function DicePad() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [mod, setMod] = useState(0);
  const [expr, setExpr] = useState("");
  const [last, setLast] = useState<RollEntry | null>(null);
  const roll = useRoll((s) => s.roll);

  if (pathname?.startsWith("/sheet") || pathname?.startsWith("/tracker")) return null;

  const modStr = mod ? ` ${mod >= 0 ? "+" : "-"} ${Math.abs(mod)}` : "";

  function rollDie(die: number) {
    const e = roll(`${count}d${die}${modStr}`, `${count}d${die}${modStr}`);
    if (e) setLast(e);
  }
  function rollExpr() {
    if (!expr.trim()) return;
    const e = roll(expr, expr);
    if (e) setLast(e);
  }

  return (
    <>
      {!open && (
        <button
          className="fixed z-40 bottom-5 right-5 size-14 rounded-full grid place-items-center shadow-lg btn-accent"
          style={{ borderRadius: "9999px" }}
          onClick={() => setOpen(true)}
          aria-label="Tira dadi"
        >
          <Dices size={24} />
        </button>
      )}

      {open && (
        <div className="fixed z-40 bottom-5 right-5 left-5 sm:left-auto sm:w-80 card p-4" style={{ boxShadow: "var(--shadow)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold flex items-center gap-2"><Dices size={18} /> Dadi</h2>
            <button className="text-[var(--muted)] hover:text-[var(--text)]" onClick={() => setOpen(false)} aria-label="Chiudi"><X size={18} /></button>
          </div>

          {/* result */}
          <div className="rounded-xl bg-[var(--surface-2)] p-3 mb-3 text-center min-h-16 flex flex-col justify-center">
            {last ? (
              <>
                <div className="text-3xl font-bold font-display" style={{ color: last.crit ? "var(--good)" : last.fumble ? "var(--ember)" : "var(--accent)" }}>{last.total}</div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5 truncate">{last.expr} · [{last.rolls.join(", ")}]</div>
              </>
            ) : (
              <div className="text-sm text-[var(--muted)]">Tocca un dado o scrivi una formula.</div>
            )}
          </div>

          {/* count + modifier */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--muted)] mr-1">Quantità</span>
              <button className="btn px-2 py-1" onClick={() => setCount((n) => Math.max(1, n - 1))}><Minus size={13} /></button>
              <span className="w-6 text-center font-bold text-sm">{count}</span>
              <button className="btn px-2 py-1" onClick={() => setCount((n) => Math.min(20, n + 1))}><Plus size={13} /></button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--muted)] mr-1">Mod</span>
              <button className="btn px-2 py-1" onClick={() => setMod((m) => m - 1)}><Minus size={13} /></button>
              <span className="w-7 text-center font-bold text-sm">{mod >= 0 ? `+${mod}` : mod}</span>
              <button className="btn px-2 py-1" onClick={() => setMod((m) => m + 1)}><Plus size={13} /></button>
            </div>
          </div>

          {/* dice grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {DICE.map((d) => (
              <button key={d} className="btn py-2.5 font-bold" onClick={() => rollDie(d)}>d{d}</button>
            ))}
          </div>

          {/* free expression */}
          <div className="flex gap-2">
            <input
              className="field font-mono text-sm"
              placeholder="es. 2d6 + 1d4 + 3"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") rollExpr(); }}
            />
            <button className="btn btn-accent shrink-0" onClick={rollExpr}>Tira</button>
          </div>
        </div>
      )}
    </>
  );
}
