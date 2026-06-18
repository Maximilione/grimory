// Data model for a character sheet. System-agnostic where possible so other
// RPG systems can be layered on later; D&D 5e (2024) is the first ruleset.

export type System = "dnd5e2024";

export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type Ability = (typeof ABILITIES)[number];

export type AbilityScores = Record<Ability, number>;

/** A scalable value: either a fixed number or a formula evaluated by the engine. */
export interface Scalable {
  /** Raw formula string, e.g. "2 + prof" or "1d8 + mod.str". Empty => use `fixed`. */
  formula?: string;
  /** Fallback fixed value when no formula is set. */
  fixed?: number;
}

export interface SkillProf {
  // skill key (from SRD) -> proficiency tier
  [skill: string]: "none" | "prof" | "expert";
}

export interface Weapon {
  id: string;
  name: string;
  /** Damage dice expression, e.g. "1d8". May reference formula vars. */
  damage: string;
  damageType: string;
  /** Ability used for attack/damage; "auto" picks the better of str/dex (finesse). */
  ability: Ability | "auto";
  proficient: boolean;
  /** Bonus to attack/damage beyond the standard, e.g. +1 weapon. */
  magicBonus?: number;
  properties?: string[];
  range?: string;
  /** Ammunition / thrown quantity remaining (undefined = not tracked). */
  ammo?: number;
  notes?: string;
  /** When set, marks this as a homebrew item with custom scaling formulas. */
  homebrew?: boolean;
  /** Official reference slug/url for quick manual lookup. */
  ref?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  weight?: number;
  equipped?: boolean;
  notes?: string;
  homebrew?: boolean;
  ref?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = cantrip
  school?: string;
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  description?: string;
  prepared?: boolean;
  /** For cantrips/scaling spells: damage formula that auto-scales (e.g. cantrip dice by level). */
  damage?: string;
  homebrew?: boolean;
  ref?: string;
}

/** A mechanical effect a feature applies to a derived stat. */
export interface FeatureEffect {
  target: "ac" | "speed" | "initiative" | "maxHp";
  /** add => +formula; base => stat = max(stat, formula) (e.g. Unarmored Defense AC). */
  mode: "add" | "base";
  formula: string;
}

/** A tracked resource pool: focus/ki, sorcery points, luck points, rages, etc. */
export interface Resource {
  id: string;
  name: string;
  max: Scalable; // formula (e.g. "level", "prof", "max(1,mod.cha)") or fixed
  spent: number;
  recharge: "short" | "long";
}

export interface Feature {
  id: string;
  name: string;
  source?: string; // class/race/feat
  description?: string;
  /** Optional uses-per-rest resource with scaling max. */
  uses?: { max: Scalable; spent: number; recharge?: "short" | "long" };
  /** Stat effects (e.g. Unarmored Defense raises AC). */
  effects?: FeatureEffect[];
  homebrew?: boolean;
  ref?: string;
}

/** A homebrew ability/action with a fully custom scaling formula the engine evaluates. */
export interface Attack {
  id: string;
  name: string;
  /** Attack bonus: formula or auto from a linked weapon. */
  toHit?: Scalable;
  /** Damage expression; may include formula vars resolved by the engine. */
  damage?: string;
  damageType?: string;
  /** Optional save instead of attack roll, e.g. "dex". */
  save?: Ability;
  notes?: string;
  weaponId?: string; // when derived from a weapon in the armory
  homebrew?: boolean;
}

/** One class a character has levels in (multiclassing supported). */
export interface ClassEntry {
  key: string; // SRD class key
  subclass?: string;
  level: number;
}

/** A companion / familiar / summon mini-sheet. */
export interface Companion {
  id: string;
  name: string;
  ac: number;
  currentHp: number;
  maxHp: number;
  speed?: string;
  notes?: string;
}

export interface Character {
  id: string;
  system: System;
  name: string;
  /** Personalization */
  avatar?: string; // small data-URL portrait
  accent?: string; // accent color override (hex)
  companions?: Companion[];
  // identity
  className?: string;
  classKey?: string; // legacy single-class key (still primary for display)
  subclass?: string;
  /** Multiclass list. When present it is the source of truth; `level` stays = sum. */
  classes?: ClassEntry[];
  level: number; // total character level (= sum of classes[].level)
  race?: string;
  background?: string;
  alignment?: string;
  // core stats
  abilities: AbilityScores;
  skills: SkillProf;
  savingThrowProf: Partial<Record<Ability, boolean>>;
  // combat
  maxHp: number;
  currentHp: number;
  tempHp: number;
  hitDiceTotal?: number;
  hitDiceSpent?: number;
  armorClass: number;
  speed: number;
  // collections
  weapons: Weapon[];
  attacks: Attack[];
  inventory: InventoryItem[];
  spells: Spell[];
  features: Feature[];
  // spellcasting
  spellcastingAbility?: Ability;
  spellSlots?: Record<number, { max: number; spent: number }>;
  pactSpent?: number; // warlock Pact Magic slots spent
  // combat state
  deathSaves?: { successes: number; failures: number };
  conditions?: string[]; // active condition keys (see srd CONDITIONS)
  exhaustion?: number; // 0..6 (2024: -2 x level to d20 tests & spell DC)
  inspiration?: boolean;
  concentration?: string; // name of the spell currently concentrated on ("" = none)
  // wealth
  currency?: { cp: number; sp: number; ep: number; gp: number; pp: number };
  attunedCount?: number; // attunement slots in use (max 3)
  // proficiencies & languages (own screen)
  languages?: string[];
  weaponProfs?: string[];
  armorProfs?: string[]; // armor types + shields
  toolProfs?: string[];
  // misc
  proficiencyBonusOverride?: number;
  /** Custom flat modifier to max HP (can be negative). Editable in Homebrew. */
  maxHpBonus?: number;
  notes?: string;
  /** Tracked resource pools (focus, sorcery/luck points, rages…). */
  resources?: Resource[];
  /** Custom global formula variables the user can define for homebrew scaling. */
  customVars?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}
