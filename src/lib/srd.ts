// D&D 5e (2024) reference data that drives the rules engine. Kept compact and
// declarative so a future ruleset can sit beside it without code changes.

import type { Ability, FeatureEffect } from "./types";

export const ABILITY_NAMES: Record<Ability, string> = {
  str: "Forza",
  dex: "Destrezza",
  con: "Costituzione",
  int: "Intelligenza",
  wis: "Saggezza",
  cha: "Carisma",
};

/** Skill key -> { label, governing ability }. 5e 2024 skill list. */
export const SKILLS: Record<string, { label: string; ability: Ability }> = {
  acrobatics: { label: "Acrobazia", ability: "dex" },
  animalHandling: { label: "Addestrare Animali", ability: "wis" },
  arcana: { label: "Arcano", ability: "int" },
  athletics: { label: "Atletica", ability: "str" },
  deception: { label: "Inganno", ability: "cha" },
  history: { label: "Storia", ability: "int" },
  insight: { label: "Intuizione", ability: "wis" },
  intimidation: { label: "Intimidire", ability: "cha" },
  investigation: { label: "Indagare", ability: "int" },
  medicine: { label: "Medicina", ability: "wis" },
  nature: { label: "Natura", ability: "int" },
  perception: { label: "Percezione", ability: "wis" },
  performance: { label: "Intrattenere", ability: "cha" },
  persuasion: { label: "Persuasione", ability: "cha" },
  religion: { label: "Religione", ability: "int" },
  sleightOfHand: { label: "Rapidità di Mano", ability: "dex" },
  stealth: { label: "Furtività", ability: "dex" },
  survival: { label: "Sopravvivenza", ability: "wis" },
};

/** 2024 conditions (key -> Italian label). Exhaustion handled separately as 0-6. */
export const CONDITIONS: Record<string, string> = {
  blinded: "Accecato",
  charmed: "Affascinato",
  deafened: "Assordato",
  frightened: "Spaventato",
  grappled: "Afferrato",
  incapacitated: "Incapacitato",
  invisible: "Invisibile",
  paralyzed: "Paralizzato",
  petrified: "Pietrificato",
  poisoned: "Avvelenato",
  prone: "Prono",
  restrained: "Trattenuto",
  stunned: "Stordito",
  unconscious: "Privo di sensi",
};

/** Short 2024 effect summary per condition (key matches CONDITIONS). */
export const CONDITION_DESC: Record<string, string> = {
  blinded:
    "Non vedi e fallisci le prove che richiedono la vista. Gli attacchi contro di te hanno vantaggio, i tuoi hanno svantaggio.",
  charmed:
    "Non puoi attaccare chi ti affascina né bersagliarlo con effetti dannosi. Chi ti affascina ha vantaggio alle prove di interazione sociale con te.",
  deafened: "Non senti e fallisci automaticamente le prove basate sull'udito.",
  frightened:
    "Hai svantaggio a prove e attacchi finché vedi la fonte della paura. Non puoi avvicinarti volontariamente ad essa.",
  grappled:
    "La tua velocità è 0. Hai svantaggio agli attacchi tranne contro chi ti afferra. Termina se l'afferrante è incapacitato o allontanato.",
  incapacitated:
    "Niente azioni, azioni bonus o reazioni; non puoi parlare e perdi la concentrazione. Tiri l'iniziativa con svantaggio.",
  invisible:
    "Non sei visto senza mezzi speciali. Gli attacchi contro di te hanno svantaggio, i tuoi hanno vantaggio. Tiri l'iniziativa con vantaggio.",
  paralyzed:
    "Sei incapacitato e non puoi muoverti o parlare. Fallisci i TS su Forza e Destrezza. Gli attacchi contro di te hanno vantaggio; ogni colpo entro 1,5 m è un critico.",
  petrified:
    "Trasformato in sostanza solida, incapacitato e inconsapevole. Resistenza a tutti i danni; immune a veleno e malattia. Gli attacchi contro di te hanno vantaggio; fallisci i TS su Forza e Destrezza.",
  poisoned: "Hai svantaggio ai tiri per colpire e alle prove di caratteristica.",
  prone:
    "Puoi solo strisciare. Hai svantaggio agli attacchi. Gli attacchi contro di te hanno vantaggio se entro 1,5 m, altrimenti svantaggio.",
  restrained:
    "La tua velocità è 0. Gli attacchi contro di te hanno vantaggio, i tuoi svantaggio. Hai svantaggio ai TS su Destrezza.",
  stunned:
    "Sei incapacitato, non puoi muoverti e parli a fatica. Fallisci i TS su Forza e Destrezza. Gli attacchi contro di te hanno vantaggio.",
  unconscious:
    "Sei incapacitato, lasci cadere ciò che impugni e cadi prono. Fallisci i TS su Forza e Destrezza. Gli attacchi contro di te hanno vantaggio; ogni colpo entro 1,5 m è un critico.",
};

/** 2024 exhaustion: penalty to all D20 Tests and spell save DC = 2 x level. */
export function exhaustionPenalty(level: number): number {
  return Math.max(0, Math.min(6, level)) * 2;
}

/** Known mechanical effects auto-attached to features the API only gives as text
 * (e.g. Unarmored Defense raises AC). Keyed by feature name + class. */
export function featureEffects(name: string, classKey?: string): FeatureEffect[] {
  const n = name.toLowerCase();
  if (/unarmored defense|difesa senza armatura/.test(n)) {
    if (classKey === "barbarian") return [{ target: "ac", mode: "base", formula: "10 + mod.dex + mod.con" }];
    if (classKey === "monk") return [{ target: "ac", mode: "base", formula: "10 + mod.dex + mod.wis" }];
  }
  if (/fast movement|movimento veloce/.test(n) && classKey === "barbarian") {
    return [{ target: "speed", mode: "add", formula: "3" }]; // +10ft ≈ +3m
  }
  if (/unarmored movement|movimento senza armatura/.test(n) && classKey === "monk") {
    return [{ target: "speed", mode: "add", formula: "3" }];
  }
  return [];
}

export interface ClassDef {
  key: string;
  name: string;
  hitDie: number; // d6/d8/d10/d12
  savingThrows: Ability[];
  spellcasting?: Ability;
  /** "full" | "half" | "third" | "pact" caster progression for slot scaling. */
  casterType?: "full" | "half" | "third" | "pact";
  primary: Ability[];
}

export const CLASSES: ClassDef[] = [
  { key: "barbarian", name: "Barbaro", hitDie: 12, savingThrows: ["str", "con"], primary: ["str"] },
  { key: "bard", name: "Bardo", hitDie: 8, savingThrows: ["dex", "cha"], spellcasting: "cha", casterType: "full", primary: ["cha"] },
  { key: "cleric", name: "Chierico", hitDie: 8, savingThrows: ["wis", "cha"], spellcasting: "wis", casterType: "full", primary: ["wis"] },
  { key: "druid", name: "Druido", hitDie: 8, savingThrows: ["int", "wis"], spellcasting: "wis", casterType: "full", primary: ["wis"] },
  { key: "fighter", name: "Guerriero", hitDie: 10, savingThrows: ["str", "con"], primary: ["str", "dex"] },
  { key: "monk", name: "Monaco", hitDie: 8, savingThrows: ["str", "dex"], primary: ["dex", "wis"] },
  { key: "paladin", name: "Paladino", hitDie: 10, savingThrows: ["wis", "cha"], spellcasting: "cha", casterType: "half", primary: ["str", "cha"] },
  { key: "ranger", name: "Ranger", hitDie: 10, savingThrows: ["str", "dex"], spellcasting: "wis", casterType: "half", primary: ["dex", "wis"] },
  { key: "rogue", name: "Ladro", hitDie: 8, savingThrows: ["dex", "int"], primary: ["dex"] },
  { key: "sorcerer", name: "Stregone", hitDie: 6, savingThrows: ["con", "cha"], spellcasting: "cha", casterType: "full", primary: ["cha"] },
  { key: "warlock", name: "Warlock", hitDie: 8, savingThrows: ["wis", "cha"], spellcasting: "cha", casterType: "pact", primary: ["cha"] },
  { key: "wizard", name: "Mago", hitDie: 6, savingThrows: ["int", "wis"], spellcasting: "int", casterType: "full", primary: ["int"] },
];

export function classByKey(key?: string): ClassDef | undefined {
  return CLASSES.find((c) => c.key === key);
}

/** Full-caster spell slots by character level (index 0 unused). 5e standard table. */
const FULL_CASTER_SLOTS: number[][] = [
  [], // L0
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Warlock pact-magic slots: [slotLevel, count] by character level. */
const PACT_SLOTS: { lvl: number; count: number }[] = [
  { lvl: 0, count: 0 }, { lvl: 1, count: 1 }, { lvl: 1, count: 2 }, { lvl: 2, count: 2 },
  { lvl: 2, count: 2 }, { lvl: 3, count: 2 }, { lvl: 3, count: 2 }, { lvl: 4, count: 2 },
  { lvl: 4, count: 2 }, { lvl: 5, count: 2 }, { lvl: 5, count: 2 }, { lvl: 5, count: 3 },
  { lvl: 5, count: 3 }, { lvl: 5, count: 3 }, { lvl: 5, count: 3 }, { lvl: 5, count: 3 },
  { lvl: 5, count: 3 }, { lvl: 5, count: 4 }, { lvl: 5, count: 4 }, { lvl: 5, count: 4 },
  { lvl: 5, count: 4 },
];

/** Returns slot map { slotLevel: max } for a class at a level. */
export function spellSlotsFor(
  casterType: ClassDef["casterType"],
  level: number,
): Record<number, number> {
  const out: Record<number, number> = {};
  const L = Math.max(1, Math.min(20, level));
  if (casterType === "full") {
    (FULL_CASTER_SLOTS[L] ?? []).forEach((n, i) => (out[i + 1] = n));
  } else if (casterType === "half") {
    // half-casters use the full table at ceil(level/2) (round up, 2024 style)
    const eff = Math.ceil(L / 2);
    (FULL_CASTER_SLOTS[eff] ?? []).forEach((n, i) => (out[i + 1] = n));
  } else if (casterType === "third") {
    const eff = Math.ceil(L / 3);
    (FULL_CASTER_SLOTS[eff] ?? []).forEach((n, i) => (out[i + 1] = n));
  } else if (casterType === "pact") {
    const p = PACT_SLOTS[L];
    if (p && p.count) out[p.lvl] = p.count;
  }
  return out;
}

/**
 * Multiclass spellcasting slots. Combined caster level = full levels +
 * floor(half/2) + floor(third/3) using the full-caster table. Warlock pact
 * magic is tracked separately and added on top (returned under key `pact`).
 */
export function multiclassSlots(
  entries: { key: string; level: number }[],
): { slots: Record<number, number>; pact?: { lvl: number; count: number } } {
  let casterLevels = 0;
  let pactWarlock = 0;
  for (const e of entries) {
    const cd = classByKey(e.key);
    if (!cd?.casterType) continue;
    if (cd.casterType === "full") casterLevels += e.level;
    else if (cd.casterType === "half") casterLevels += Math.floor(e.level / 2);
    else if (cd.casterType === "third") casterLevels += Math.floor(e.level / 3);
    else if (cd.casterType === "pact") pactWarlock += e.level;
  }
  const slots: Record<number, number> = {};
  const L = Math.max(0, Math.min(20, casterLevels));
  if (L > 0) (FULL_CASTER_SLOTS[L] ?? []).forEach((n, i) => (slots[i + 1] = n));
  let pact;
  if (pactWarlock > 0) {
    const p = PACT_SLOTS[Math.min(20, pactWarlock)];
    if (p && p.count) pact = p;
  }
  return { slots, pact };
}

/** Number of cantrip dice at a level (5e cantrip scaling at 5/11/17). */
export function cantripScale(level: number): number {
  if (level >= 17) return 4;
  if (level >= 11) return 3;
  if (level >= 5) return 2;
  return 1;
}

/** Open5e is a free SRD API/site. Build a quick-reference search URL for any name. */
export function referenceUrl(name: string): string {
  return `https://open5e.com/search?text=${encodeURIComponent(name)}`;
}

/** Live SRD lookup endpoint (Open5e) — used for the "consult official data" feature. */
export const OPEN5E_API = "https://api.open5e.com";
