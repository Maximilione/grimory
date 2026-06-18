// Derived-stat engine. Everything that "auto-scales with stats/level" is
// computed here from the raw Character, so the UI only ever reads derived
// values and never stores them. Pure functions, no side effects.

import type { Ability, Character, ClassEntry, Weapon } from "./types";
import { ABILITIES } from "./types";
import { SKILLS, cantripScale, classByKey, exhaustionPenalty, multiclassSlots } from "./srd";
import { evalFormula, type Vars } from "./dice";

/** Normalized class list: uses classes[] when present, else the legacy single class. */
export function getClasses(c: Character): ClassEntry[] {
  if (c.classes && c.classes.length) return c.classes;
  if (c.classKey) return [{ key: c.classKey, subclass: c.subclass, level: c.level }];
  return [];
}

export function totalLevel(c: Character): number {
  const cls = getClasses(c);
  return cls.length ? cls.reduce((s, e) => s + e.level, 0) : c.level;
}

/** Build the spell-slot map for a character (multiclass aware, pact merged in),
 * preserving already-spent slots. */
export function buildSpellSlots(c: Character): Record<number, { max: number; spent: number }> {
  const { slots } = multiclassSlots(getClasses(c));
  const out: Record<number, { max: number; spent: number }> = {};
  for (const [lvl, max] of Object.entries(slots)) {
    out[+lvl] = { max, spent: Math.min(c.spellSlots?.[+lvl]?.spent ?? 0, max) };
  }
  return out;
}

/** Warlock Pact Magic slots (tracked separately from normal slots). */
export function pactMagic(c: Character): { slotLevel: number; max: number } | null {
  const { pact } = multiclassSlots(getClasses(c));
  return pact && pact.count ? { slotLevel: pact.lvl, max: pact.count } : null;
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(c: Character): number {
  if (c.proficiencyBonusOverride) return c.proficiencyBonusOverride;
  return Math.ceil(c.level / 4) + 1;
}

export function spellcastingAbility(c: Character): Ability | undefined {
  if (c.spellcastingAbility) return c.spellcastingAbility;
  // first class (in order) that can cast determines the default ability
  for (const e of getClasses(c)) {
    const sp = classByKey(e.key)?.spellcasting;
    if (sp) return sp;
  }
  return undefined;
}

export interface Derived {
  prof: number;
  mods: Record<Ability, number>;
  saves: Record<Ability, { mod: number; proficient: boolean }>;
  skills: Record<string, { mod: number; tier: "none" | "prof" | "expert"; ability: Ability }>;
  initiative: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  armorClass: number; // effective AC after feature effects
  speed: number; // effective speed after feature effects
  maxHp: number; // effective max HP after feature effects
  spellMod?: number;
  spellSaveDc?: number;
  spellAttack?: number;
  /** Per-ability spell DC/attack (multiclass casters with different abilities). */
  spellcasters: { ability: Ability; dc: number; attack: number }[];
}

export function derive(c: Character): Derived {
  const prof = proficiencyBonus(c);
  // Exhaustion penalty applies to every d20 Test (checks/saves/attacks) and the
  // spell save DC. mods[] stay pure (used for display & formulas); the penalty
  // is folded into the rollable bonuses below so it propagates everywhere.
  const exh = exhaustionPenalty(c.exhaustion ?? 0);
  const mods = {} as Record<Ability, number>;
  for (const a of ABILITIES) mods[a] = abilityMod(c.abilities[a]);

  const saves = {} as Derived["saves"];
  for (const a of ABILITIES) {
    const proficient = !!c.savingThrowProf[a];
    saves[a] = { mod: mods[a] + (proficient ? prof : 0) + (c.saveBonus?.[a] ?? 0) - exh, proficient };
  }

  const half = c.jackOfAllTrades ? Math.floor(prof / 2) : 0;
  const skills: Derived["skills"] = {};
  for (const [key, def] of Object.entries(SKILLS)) {
    const tier = c.skills[key] ?? "none";
    const profBonus = tier === "expert" ? prof * 2 : tier === "prof" ? prof : half; // Jack of all Trades on non-prof
    const misc = c.skillBonus?.[key] ?? 0;
    skills[key] = { mod: mods[def.ability] + profBonus + misc - exh, tier, ability: def.ability };
  }

  const sAbil = spellcastingAbility(c);
  const spellMod = sAbil ? mods[sAbil] : undefined;

  // distinct spellcasting abilities (override, else each caster class) → DC/attack
  const abils: Ability[] = [];
  if (c.spellcastingAbility) abils.push(c.spellcastingAbility);
  else
    for (const e of getClasses(c)) {
      const sp = classByKey(e.key)?.spellcasting;
      if (sp && !abils.includes(sp)) abils.push(sp);
    }
  const spellcasters = abils.map((ability) => ({
    ability,
    dc: 8 + prof + mods[ability] - exh,
    attack: prof + mods[ability] - exh,
  }));

  // Apply feature effects (e.g. Unarmored Defense). Build a local var map here
  // rather than calling formulaVars() to avoid recursion.
  const evars: Vars = { level: c.level, prof, pb: prof, exhaustion: c.exhaustion ?? 0, cantrip: cantripScale(c.level) };
  for (const a of ABILITIES) {
    evars[a] = c.abilities[a];
    evars[`mod.${a}`] = mods[a];
  }
  if (spellMod !== undefined) evars["mod.spell"] = spellMod;
  /** Use a custom formula override for a derived stat if set+valid, else default. */
  const ov = (key: string, def: number): number => {
    const f = c.formulaOverrides?.[key];
    if (f && f.trim()) {
      try {
        return Math.round(evalFormula(f, evars));
      } catch {
        /* fall back to default */
      }
    }
    return def;
  };
  let ac = c.armorClass;
  let acBonus = 0;
  let speed = c.speed;
  let initBonus = 0;
  let hpBonus = 0;
  for (const f of c.features) {
    for (const e of f.effects ?? []) {
      let val = 0;
      try {
        val = Math.round(evalFormula(e.formula, evars));
      } catch {
        continue;
      }
      if (e.target === "ac") e.mode === "base" ? (ac = Math.max(ac, val)) : (acBonus += val);
      else if (e.target === "speed") e.mode === "base" ? (speed = Math.max(speed, val)) : (speed += val);
      else if (e.target === "initiative") initBonus += val;
      else if (e.target === "maxHp") hpBonus += val;
    }
  }

  return {
    prof,
    mods,
    saves,
    skills,
    initiative: ov("initiative", mods.dex - exh + initBonus),
    passivePerception: ov("passivePerception", 10 + skills.perception.mod + exh),
    passiveInvestigation: ov("passiveInvestigation", 10 + skills.investigation.mod + exh),
    passiveInsight: ov("passiveInsight", 10 + skills.insight.mod + exh),
    armorClass: ov("armorClass", ac + acBonus),
    speed: ov("speed", speed),
    maxHp: ov("maxHp", c.maxHp + hpBonus + (c.maxHpBonus ?? 0)),
    spellMod,
    spellSaveDc:
      c.formulaOverrides?.spellSaveDc?.trim() || spellMod !== undefined
        ? ov("spellSaveDc", spellMod !== undefined ? 8 + prof + spellMod - exh : 0)
        : undefined,
    spellAttack:
      c.formulaOverrides?.spellAttack?.trim() || spellMod !== undefined
        ? ov("spellAttack", spellMod !== undefined ? prof + spellMod - exh : 0)
        : undefined,
    spellcasters,
  };
}

/**
 * Build the variable context used to evaluate scaling formulas. Includes every
 * ability score & modifier, proficiency, level, spell mod, cantrip scale, and
 * any user-defined custom vars. Homebrew formulas reference these by name,
 * e.g. "1d8 + mod.str + ceil(level/2)" or "prof + customVars.rage".
 */
export function formulaVars(c: Character): Vars {
  const d = derive(c);
  const v: Vars = {
    level: c.level,
    prof: d.prof,
    cantrip: cantripScale(c.level),
    pb: d.prof,
    exhaustion: c.exhaustion ?? 0,
  };
  for (const a of ABILITIES) {
    v[a] = c.abilities[a];
    v[`mod.${a}`] = d.mods[a];
    v[`save.${a}`] = d.saves[a].mod;
  }
  if (d.spellMod !== undefined) {
    v["mod.spell"] = d.spellMod;
    v["spellDc"] = d.spellSaveDc!;
    v["spellAtk"] = d.spellAttack!;
  }
  for (const [k, val] of Object.entries(c.customVars ?? {})) {
    v[`customVars.${k}`] = val;
    v[k] = val; // also bare name for convenience
  }
  return v;
}

/** Resolve the effective attack ability for a weapon (finesse => better of str/dex). */
export function weaponAbility(c: Character, w: Weapon): Ability {
  if (w.ability !== "auto") return w.ability;
  const finesse = (w.properties ?? []).some((p) => /finesse/i.test(p));
  const mods = derive(c).mods;
  if (finesse) return mods.dex >= mods.str ? "dex" : "str";
  const ranged = (w.properties ?? []).some((p) => /thrown|ammunition|range/i.test(p));
  return ranged ? "dex" : "str";
}

/** Auto-computed attack bonus and damage string for a weapon, scaling with stats. */
export function weaponAttack(
  c: Character,
  w: Weapon,
): { toHit: number; damage: string; ability: Ability } {
  const d = derive(c);
  const abil = weaponAbility(c, w);
  const mod = d.mods[abil];
  const mag = w.magicBonus ?? 0;
  const exh = exhaustionPenalty(c.exhaustion ?? 0);
  const toHit = mod + (w.proficient ? d.prof : 0) + mag + (w.attackBonus ?? 0) - exh;
  const dmgBonus = mod + mag + (w.damageBonus ?? 0);
  const sign = dmgBonus >= 0 ? `+ ${dmgBonus}` : `- ${Math.abs(dmgBonus)}`;
  const damage = dmgBonus === 0 ? w.damage : `${w.damage} ${sign}`;
  return { toHit, damage, ability: abil };
}

/** Evaluate a resource's max (formula against the character's vars, else fixed). */
export function resourceMax(c: Character, r: { max: { formula?: string; fixed?: number } }): number {
  if (r.max.formula?.trim()) {
    try {
      return Math.max(0, Math.round(evalFormula(r.max.formula, formulaVars(c))));
    } catch {
      return r.max.fixed ?? 0;
    }
  }
  return r.max.fixed ?? 0;
}

export function carryCapacity(c: Character): number {
  const f = c.formulaOverrides?.carryCapacity;
  if (f && f.trim()) {
    try {
      return Math.round(evalFormula(f, formulaVars(c)));
    } catch {
      /* default */
    }
  }
  return c.abilities.str * 15;
}

export function currentWeight(c: Character): number {
  return c.inventory.reduce((sum, it) => sum + (it.weight ?? 0) * it.qty, 0);
}
