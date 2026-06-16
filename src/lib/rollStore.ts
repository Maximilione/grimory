"use client";

import { create } from "zustand";
import { rollExpr, type Vars } from "./dice";

export type RollMode = "normal" | "adv" | "dis";

export interface RollEntry {
  id: number;
  label: string;
  total: number;
  rolls: number[];
  expr: string;
  crit?: boolean;
  fumble?: boolean;
  /** d20 roll mode used (advantage/disadvantage), if any. */
  mode?: RollMode;
  /** For adv/dis: the natural d20 actually kept. */
  keptDie?: number;
  at: number;
}

interface RollState {
  last: RollEntry | null;
  log: RollEntry[];
  mode: RollMode;
  setMode: (m: RollMode) => void;
  /** Generic expression roll (damage, formulas) — no advantage logic. */
  roll: (label: string, expr: string, vars?: Vars) => RollEntry | null;
  /** d20 check/attack roll that honours the current advantage/disadvantage mode. */
  rollD20: (label: string, bonus: number, vars?: Vars) => RollEntry | null;
  clear: () => void;
}

let counter = 0;

function push(set: any, entry: RollEntry) {
  set((s: RollState) => ({ last: entry, log: [entry, ...s.log].slice(0, 30) }));
}

/** Central dice roller — every "tira" button funnels here so results surface
 * in one consistent floating toast + a session log. */
export const useRoll = create<RollState>((set, get) => ({
  last: null,
  log: [],
  mode: "normal",
  setMode: (mode) => set({ mode }),

  roll: (label, expr, vars = {}) => {
    let res;
    try {
      res = rollExpr(expr, vars);
    } catch {
      return null;
    }
    const isD20 = /\b1d20\b/.test(expr) && res.rolls.length === 1;
    const crit = isD20 && res.rolls[0] === 20;
    const fumble = isD20 && res.rolls[0] === 1;
    const entry: RollEntry = {
      id: ++counter,
      label,
      total: res.total,
      rolls: res.rolls,
      expr,
      crit,
      fumble,
      at: Date.now(),
    };
    push(set, entry);
    return entry;
  },

  rollD20: (label, bonus, vars = {}) => {
    const mode = get().mode;
    const sign = `${bonus >= 0 ? "+" : "-"} ${Math.abs(bonus)}`;
    if (mode === "normal") {
      const res = rollExpr(`1d20 ${sign}`, vars);
      const nat = res.rolls[0];
      const entry: RollEntry = {
        id: ++counter,
        label,
        total: res.total,
        rolls: res.rolls,
        expr: `1d20 ${sign}`,
        crit: nat === 20,
        fumble: nat === 1,
        mode: "normal",
        at: Date.now(),
      };
      push(set, entry);
      return entry;
    }
    // advantage / disadvantage: roll two d20, keep highest / lowest
    const a = rollExpr("1d20").total;
    const b = rollExpr("1d20").total;
    const kept = mode === "adv" ? Math.max(a, b) : Math.min(a, b);
    const total = kept + bonus;
    const entry: RollEntry = {
      id: ++counter,
      label,
      total,
      rolls: [a, b],
      expr: `2d20kept ${sign}`,
      crit: kept === 20,
      fumble: kept === 1,
      mode,
      keptDie: kept,
      at: Date.now(),
    };
    push(set, entry);
    return entry;
  },

  clear: () => set({ last: null, log: [] }),
}));
