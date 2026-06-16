// Local-first persistence. Characters live in IndexedDB (via Dexie) so data
// survives reloads, offline use, and app installs. A rolling JSON snapshot is
// also mirrored to localStorage on every write as a second safety net, because
// losing a sheet is the one unacceptable failure mode.

import Dexie, { type Table } from "dexie";
import type { Ability, Character } from "./types";
import { ABILITIES } from "./types";

class SheetDB extends Dexie {
  characters!: Table<Character, string>;
  constructor() {
    super("dnd-sheets");
    this.version(1).stores({
      characters: "id, name, system, updatedAt",
    });
  }
}

export const db = new SheetDB();

const BACKUP_KEY = "dnd-sheets:autobackup";
const BACKUP_KEEP = 5;

/** Mirror the full DB to localStorage, keeping the last few snapshots. */
export async function snapshotBackup(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const all = await db.characters.toArray();
    const raw = localStorage.getItem(BACKUP_KEY);
    const history: { at: number; data: Character[] }[] = raw ? JSON.parse(raw) : [];
    history.unshift({ at: Date.now(), data: all });
    localStorage.setItem(BACKUP_KEY, JSON.stringify(history.slice(0, BACKUP_KEEP)));
  } catch {
    // localStorage full or unavailable — IndexedDB is still the source of truth.
  }
}

export function latestBackup(): { at: number; data: Character[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    const history = JSON.parse(raw);
    return history[0] ?? null;
  } catch {
    return null;
  }
}

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function emptyAbilities(): Record<Ability, number> {
  return ABILITIES.reduce(
    (o, a) => ((o[a] = 10), o),
    {} as Record<Ability, number>,
  );
}

export function newCharacter(partial: Partial<Character> = {}): Character {
  const now = Date.now();
  const base: Character = {
    id: uid(),
    system: "dnd5e2024",
    name: "Nuovo Personaggio",
    level: 1,
    abilities: emptyAbilities(),
    skills: {},
    savingThrowProf: {},
    maxHp: 8,
    currentHp: 8,
    tempHp: 0,
    armorClass: 10,
    speed: 9,
    weapons: [],
    attacks: [],
    inventory: [],
    spells: [],
    features: [],
    spellSlots: {},
    customVars: {},
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    exhaustion: 0,
    inspiration: false,
    concentration: "",
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    attunedCount: 0,
    languages: [],
    weaponProfs: [],
    armorProfs: [],
    toolProfs: [],
    createdAt: now,
    updatedAt: now,
  };
  // partial overrides defaults, but identity/timestamps are always fresh & valid.
  return { ...base, ...partial, id: uid(), createdAt: now, updatedAt: now };
}

export async function saveCharacter(c: Character): Promise<void> {
  c.updatedAt = Date.now();
  await db.characters.put(c);
  await snapshotBackup();
}

export async function createCharacter(partial: Partial<Character> = {}): Promise<Character> {
  const c = newCharacter(partial);
  await saveCharacter(c);
  return c;
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id);
  await snapshotBackup();
}

export async function duplicateCharacter(id: string): Promise<Character | null> {
  const c = await db.characters.get(id);
  if (!c) return null;
  const copy = newCharacter({ ...c, id: undefined, name: `${c.name} (copia)` });
  await saveCharacter(copy);
  return copy;
}

export { uid };
