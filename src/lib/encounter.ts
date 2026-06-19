// Group-combat / initiative tracker model. An Encounter is a list of combatants
// (party PCs + monsters) with initiative order, round counter and turn pointer.
// Persisted in IndexedDB (see db.ts) so a fight survives reloads mid-session.

import { uid } from "./db";

export interface Combatant {
  id: string;
  name: string;
  initiative: number | null; // null = not yet rolled
  initiativeMod: number; // added when rolling initiative (usually DEX mod)
  ac: number;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  conditions: string[]; // CONDITIONS keys
  exhaustion: number;
  isPC: boolean;
  charId?: string; // link back to a Character (PCs)
  monsterSlug?: string; // source monster (NPCs)
  cr?: string;
  note?: string;
  dead?: boolean;
}

export interface Encounter {
  id: string;
  name: string;
  combatants: Combatant[];
  round: number;
  turnIndex: number; // index into the initiative-sorted order
  started: boolean;
  updatedAt: number;
}

export function newCombatant(partial: Partial<Combatant> = {}): Combatant {
  return {
    id: uid(),
    name: "Combattente",
    initiative: null,
    initiativeMod: 0,
    ac: 10,
    currentHp: 1,
    maxHp: 1,
    tempHp: 0,
    conditions: [],
    exhaustion: 0,
    isPC: false,
    ...partial,
  };
}

export function newEncounter(partial: Partial<Encounter> = {}): Encounter {
  return {
    id: uid(),
    name: "Scontro",
    combatants: [],
    round: 1,
    turnIndex: 0,
    started: false,
    updatedAt: Date.now(),
    ...partial,
  };
}

/** Initiative order: highest first; unrolled (null) sink to the bottom; ties keep insertion order. */
export function initiativeOrder(combatants: Combatant[]): Combatant[] {
  return combatants
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const ai = a.c.initiative ?? -Infinity;
      const bi = b.c.initiative ?? -Infinity;
      if (bi !== ai) return bi - ai;
      return a.i - b.i;
    })
    .map((x) => x.c);
}
