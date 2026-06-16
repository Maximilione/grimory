// Live SRD lookup against Open5e (free, CORS-open, includes the 2024 SRD 5.2).
// Each search maps the upstream record into our own item shape so a pick
// "precompiles" a weapon / spell / magic item straight into the sheet.
//
// Everything is best-effort: offline or API down => the catch returns [] and
// the UI falls back to manual entry. Nothing here is required to use the app.

import { OPEN5E_API } from "./srd";
import type { InventoryItem, Spell, Weapon } from "./types";
import { uid } from "./db";

const TIMEOUT = 12000;

async function get(url: string): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// Open5e v2 ignores ?search=, so we fetch the (small, fixed) SRD dataset once,
// cache it for the session, and filter by name client-side. Makes repeat
// searches instant and lets partial matches work.
const cache = new Map<string, Promise<any[]>>();

async function fetchAll(url: string): Promise<any[]> {
  if (cache.has(url)) return cache.get(url)!;
  const p = (async () => {
    const out: any[] = [];
    let next: string | null = `${url}${url.includes("?") ? "&" : "?"}limit=100`;
    let guard = 0;
    while (next && guard++ < 8) {
      const data = await get(next);
      out.push(...(data.results ?? []));
      next = data.next ?? null;
    }
    return out;
  })().catch((e) => {
    cache.delete(url); // don't cache failures — let it retry next time
    throw e;
  });
  cache.set(url, p);
  return p;
}

function nameMatch(records: any[], q: string, nameKey = "name"): any[] {
  const needle = q.trim().toLowerCase();
  return records
    .filter((r) => (r[nameKey] ?? "").toLowerCase().includes(needle))
    .sort((a, b) => {
      // prefix matches first, then alphabetical
      const ap = a[nameKey].toLowerCase().startsWith(needle) ? 0 : 1;
      const bp = b[nameKey].toLowerCase().startsWith(needle) ? 0 : 1;
      return ap - bp || a[nameKey].localeCompare(b[nameKey]);
    })
    .slice(0, 20);
}

function descToText(desc: unknown, higher?: string): string {
  let body = Array.isArray(desc) ? desc.join("\n\n") : typeof desc === "string" ? desc : "";
  if (higher) body += `\n\nAi livelli superiori: ${higher}`;
  return body.trim();
}

export interface SearchHit<T> {
  key: string;
  name: string;
  subtitle: string;
  build: () => T;
}

/** Spells from the 2024 SRD. */
export async function searchSpells(q: string): Promise<SearchHit<Omit<Spell, "id">>[]> {
  if (!q.trim()) return [];
  try {
    const all = await fetchAll(`${OPEN5E_API}/v2/spells/?document__key=srd-2024`);
    return nameMatch(all, q).map((r: any) => ({
      key: r.key,
      name: r.name,
      subtitle: `${r.level === 0 ? "Trucchetto" : `Liv. ${r.level}`} · ${r.school?.name ?? ""}`,
      build: (): Omit<Spell, "id"> => ({
        name: r.name,
        level: r.level ?? 0,
        school: r.school?.name,
        castingTime: r.casting_time,
        range: r.range_text,
        duration: r.duration,
        components: [r.verbal && "V", r.somatic && "S", r.material && "M"].filter(Boolean).join(", "),
        damage: r.damage_roll || undefined,
        description: descToText(r.desc, r.higher_level),
        prepared: true,
        ref: r.name,
      }),
    }));
  } catch {
    return [];
  }
}

function mapWeaponRecord(r: any): Omit<Weapon, "id"> {
  const props: string[] = (r.properties ?? []).map((p: any) => p.property?.name).filter(Boolean);
  return {
    name: r.name,
    damage: r.damage_dice && r.damage_dice !== "1" ? r.damage_dice : "1d4",
    damageType: r.damage_type?.name ?? "",
    ability: "auto",
    proficient: true,
    properties: props,
    range: r.range ? `${r.range}${r.long_range ? "/" + r.long_range : ""}` : undefined,
    ref: r.name,
  };
}

/** Weapons from the 2024 SRD. */
export async function searchWeapons(q: string): Promise<SearchHit<Omit<Weapon, "id">>[]> {
  if (!q.trim()) return [];
  try {
    const all = await fetchAll(`${OPEN5E_API}/v2/weapons/?document__key=srd-2024`);
    return nameMatch(all, q).map((r: any) => {
      const props: string[] = (r.properties ?? []).map((p: any) => p.property?.name).filter(Boolean);
      return {
        key: r.key,
        name: r.name,
        subtitle: `${r.damage_dice ?? "—"} ${r.damage_type?.name ?? ""}${props.length ? " · " + props.join(", ") : ""}`,
        build: (): Omit<Weapon, "id"> => mapWeaponRecord(r),
      };
    });
  } catch {
    return [];
  }
}

export interface ClassifiedEquip {
  weapons: Omit<Weapon, "id">[];
  items: string[];
  armorClass?: number;
}

/**
 * Turn starting-equipment phrases into usable gear: match weapon names against
 * the SRD so they land in the armory (rollable attacks), derive AC from any
 * matched armor (+2 for a shield), and keep the rest as plain inventory items.
 */
export async function classifyEquipment(names: string[], dexMod: number): Promise<ClassifiedEquip> {
  const out: ClassifiedEquip = { weapons: [], items: [] };
  let bestArmorAc: number | undefined;
  let shield = false;
  try {
    const [weapons, armors] = await Promise.all([
      fetchAll(`${OPEN5E_API}/v2/weapons/?document__key=srd-2024`),
      fetchAll(`${OPEN5E_API}/v2/armor/?document__key=srd-2024`),
    ]);
    for (const raw of names) {
      // split multi-item phrases ("Leather armor, longbow, and 20 arrows")
      const tokens = raw.split(/,|\band\b/i).map((s) => s.trim()).filter(Boolean);
      for (const tok of tokens) {
        const n = tok.toLowerCase();
        if (/\bshield\b/.test(n)) {
          shield = true;
          continue;
        }
        const w = weapons.find((x) => n.includes((x.name ?? "").toLowerCase()));
        if (w) {
          out.weapons.push(mapWeaponRecord(w));
          continue;
        }
        const a = armors.find((x) => (x.name ?? "").toLowerCase() !== "shield" && n.includes((x.name ?? "").toLowerCase()));
        if (a) {
          const ac = (a.ac_base ?? 10) + (a.ac_add_dexmod ? Math.min(dexMod, a.ac_cap_dexmod ?? 99) : 0);
          bestArmorAc = Math.max(bestArmorAc ?? 0, ac);
          continue;
        }
        out.items.push(tok);
      }
    }
  } catch {
    // API down: keep everything as inventory text
    return { weapons: [], items: names, armorClass: undefined };
  }
  if (bestArmorAc !== undefined) out.armorClass = bestArmorAc + (shield ? 2 : 0);
  else if (shield) out.armorClass = 10 + dexMod + 2;
  return out;
}

/** Magic items (Open5e v1 — broad SRD/OGL pool). */
export async function searchMagicItems(q: string): Promise<SearchHit<Omit<InventoryItem, "id">>[]> {
  if (!q.trim()) return [];
  try {
    const data = await get(
      `${OPEN5E_API}/v1/magicitems/?search=${encodeURIComponent(q)}&limit=15`,
    );
    return (data.results ?? []).map((r: any) => ({
      key: r.slug,
      name: r.name,
      subtitle: `${r.type ?? ""}${r.rarity ? " · " + r.rarity : ""}${r.requires_attunement ? " · sintonia" : ""}`,
      build: (): Omit<InventoryItem, "id"> => ({
        name: r.name,
        qty: 1,
        notes: [
          [r.type, r.rarity].filter(Boolean).join(" · "),
          r.requires_attunement ? "Richiede sintonia" : "",
          descToText(r.desc),
        ]
          .filter(Boolean)
          .join("\n"),
        ref: r.name,
      }),
    }));
  } catch {
    return [];
  }
}

export interface ClassFeature {
  name: string;
  desc: string;
  isASI: boolean; // Ability Score Improvement / feat level
}

/**
 * Class features per class-level from the 2024 SRD, keyed by level.
 * `classKey` is our English slug (e.g. "wizard") which matches Open5e's name.
 * Returns {} on failure so leveling still works (features just aren't auto-added).
 */
export async function fetchClassFeatures(
  classKey: string,
): Promise<Record<number, ClassFeature[]>> {
  try {
    const all = await fetchAll(`${OPEN5E_API}/v2/classes/?document__key=srd-2024`);
    const cls = all.find((r) => (r.name ?? "").toLowerCase() === classKey.toLowerCase());
    if (!cls) return {};
    const byLevel: Record<number, ClassFeature[]> = {};
    for (const f of cls.features ?? []) {
      const isASI = /ability score improvement|epic boon/i.test(f.name ?? "");
      const gained: { level?: number }[] = Array.isArray(f.gained_at) ? f.gained_at : [];
      const levels = gained.map((g) => g.level).filter((l): l is number => typeof l === "number");
      // Features with no explicit level are class-table columns (spell-slot rows,
      // "Proficiency Bonus", grouping traits) — skip them, keep only real grants.
      for (const lvl of levels) {
        (byLevel[lvl] ??= []).push({
          name: f.name,
          desc: typeof f.desc === "string" ? f.desc : Array.isArray(f.desc) ? f.desc.join("\n\n") : "",
          isASI,
        });
      }
    }
    return byLevel;
  } catch {
    return {};
  }
}

const SKILL_NAME_TO_KEY: Record<string, string> = {
  acrobatics: "acrobatics",
  "animal handling": "animalHandling",
  arcana: "arcana",
  athletics: "athletics",
  deception: "deception",
  history: "history",
  insight: "insight",
  intimidation: "intimidation",
  investigation: "investigation",
  medicine: "medicine",
  nature: "nature",
  perception: "perception",
  performance: "performance",
  persuasion: "persuasion",
  religion: "religion",
  "sleight of hand": "sleightOfHand",
  stealth: "stealth",
  survival: "survival",
};
const NUM_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
const ALL_SKILL_KEYS = Object.values(SKILL_NAME_TO_KEY);

/** Each starting-equipment line: one entry = fixed item, multiple = a choice. */
export interface EquipLine {
  options: string[];
}

export interface ClassBuild {
  skillChoose: number; // how many skills to pick
  skillOptions: string[]; // our skill keys to choose from
  subclasses: { key: string; name: string; edition: "2024" | "2014" }[];
  subclassLevel: number; // 2024: 3 for all classes
  equipment: EquipLine[];
  armorProfs: string[];
  weaponProfs: string[];
  toolProfs: string[];
}

/** Split a "A, B, and C" / "None" proficiency string into a clean list. */
function profList(text: string): string[] {
  if (!text || /^none$/i.test(text.trim())) return [];
  return text
    .split(/,|\band\b/i)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => s && !/^none$/i.test(s))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

function parseSkills(text: string): { count: number; options: string[] } {
  if (!text) return { count: 0, options: [] };
  const m = /choose\s+(\w+)/i.exec(text);
  const word = (m?.[1] ?? "").toLowerCase();
  const count = NUM_WORDS[word] ?? (parseInt(word, 10) || 2);
  if (/any/i.test(text)) return { count, options: ALL_SKILL_KEYS };
  const options: string[] = [];
  for (const [name, key] of Object.entries(SKILL_NAME_TO_KEY)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(text)) options.push(key);
  }
  return { count, options: options.length ? options : ALL_SKILL_KEYS };
}

function parseEquipment(text: string): EquipLine[] {
  if (!text) return [];
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\*/g, "").trim())
    .filter((l) => l && !/^you start/i.test(l));
  const clean = (s: string) =>
    s
      .replace(/\((?:a|b|c)\)/gi, "")
      .replace(/^\s*(a|an|the)\s+/i, "")
      .trim()
      .replace(/^./, (c) => c.toUpperCase());
  return lines.map((line) => {
    if (/\bor\b/i.test(line) && /\(/.test(line)) {
      return { options: line.split(/\bor\b/i).map(clean).filter(Boolean) };
    }
    return { options: [clean(line)] };
  });
}

/** Everything the guided creation wizard needs for a class (2024 where possible). */
export async function fetchClassBuild(classKey: string): Promise<ClassBuild> {
  const out: ClassBuild = {
    skillChoose: 2, skillOptions: ALL_SKILL_KEYS, subclasses: [], subclassLevel: 3,
    equipment: [], armorProfs: [], weaponProfs: [], toolProfs: [],
  };
  try {
    const v1 = await get(`${OPEN5E_API}/v1/classes/?search=${encodeURIComponent(classKey)}&limit=5`);
    const c1 = (v1.results ?? []).find((r: any) => r.slug === classKey) ?? (v1.results ?? [])[0];
    if (c1) {
      const sk = parseSkills(c1.prof_skills ?? "");
      out.skillChoose = sk.count;
      out.skillOptions = sk.options;
      out.equipment = parseEquipment(c1.equipment ?? "");
      out.armorProfs = profList(c1.prof_armor ?? "");
      out.weaponProfs = profList(c1.prof_weapons ?? "");
      out.toolProfs = profList(c1.prof_tools ?? "");
      // classic 2014 subclasses (archetypes) adapted
      for (const a of c1.archetypes ?? []) {
        if (a?.name) out.subclasses.push({ key: a.slug ?? a.name, name: a.name, edition: "2014" });
      }
    }
  } catch {
    /* keep defaults */
  }
  try {
    const all = await fetchAll(`${OPEN5E_API}/v2/classes/?document__key=srd-2024`);
    const native = all
      .filter((r) => {
        const so = r.subclass_of;
        const parent = typeof so === "string" ? so : so?.name ?? so?.key;
        return parent && String(parent).toLowerCase().includes(classKey.toLowerCase());
      })
      .map((r) => ({ key: r.key, name: r.name, edition: "2024" as const }));
    // prepend 2024 ones before the 2014 archetypes already collected
    out.subclasses = [...native, ...out.subclasses];
  } catch {
    /* no subclasses */
  }
  return out;
}

// ---- Race & Background (guided creation) ----

const ABILITY_EN: Record<string, string> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
};
const CORE_RACES = new Set([
  "dragonborn", "dwarf", "elf", "gnome", "half-elf", "half-orc", "halfling", "human", "tiefling",
]);

export interface RaceInfo {
  key: string;
  name: string;
  speed: number; // meters (converted from feet)
  languages?: string;
  traits: { name: string; desc: string }[];
}

export interface BackgroundInfo {
  key: string;
  name: string;
  edition: "2024" | "2014";
  skills: string[]; // our skill keys
  feat?: string;
  toolProf?: string;
  abilityOptions: string[]; // ability keys eligible for the +2/+1
  equipment: string[];
  feature?: { name: string; desc: string }; // 2014 roleplay feature (adapted)
  languages?: string; // language proficiencies (mainly 2014)
}

// Skill key -> governing ability, to suggest the 2024 +2/+1 when adapting a 2014 bg.
const SKILL_KEY_ABILITY: Record<string, string> = {
  acrobatics: "dex", animalHandling: "wis", arcana: "int", athletics: "str",
  deception: "cha", history: "int", insight: "wis", intimidation: "cha",
  investigation: "int", medicine: "wis", nature: "int", perception: "wis",
  performance: "cha", persuasion: "cha", religion: "int", sleightOfHand: "dex",
  stealth: "dex", survival: "wis",
};
// Known D&D languages, to extract clean names from prose race descriptions.
const LANGUAGE_NAMES = [
  "Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc",
  "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon",
];
function languagesFromText(text: string): string {
  if (!text) return "";
  const found = LANGUAGE_NAMES.filter((l) => new RegExp(`\\b${l}\\b`, "i").test(text));
  if (/of your choice|extra language|one (other|extra)/i.test(text)) found.push("una a scelta");
  return found.join(", ");
}

// Classic PHB backgrounds worth adapting from the 2014 data.
const CORE_2014_BG = new Set([
  "charlatan", "entertainer", "folk hero", "guild artisan", "guildmember", "artisan",
  "hermit", "noble", "outlander", "sailor", "urchin",
]);

function parseTraitBlocks(md: string): { name: string; desc: string }[] {
  if (!md) return [];
  const out: { name: string; desc: string }[] = [];
  const re = /\*\*_(.+?)\.?_\*\*\s*([\s\S]*?)(?=\*\*_|$)/g;
  let m;
  while ((m = re.exec(md))) out.push({ name: m[1].trim(), desc: m[2].trim() });
  return out;
}
function skillsFromText(text: string): string[] {
  const out: string[] = [];
  for (const [name, key] of Object.entries(SKILL_NAME_TO_KEY)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(text)) out.push(key);
  }
  return out;
}

/** Species/races. 2024 species are bundled locally (the API has no 2024 race
 * endpoint) — this is the authoritative source for 5.5. */
export async function fetchRaces(): Promise<RaceInfo[]> {
  const { SPECIES_2024 } = await import("./species2024");
  return SPECIES_2024;
}

function parseEquipList(text: string): string[] {
  return (text || "")
    .split(",")
    .map((s) => s.replace(/\*/g, "").replace(/choose a or b:?/i, "").trim())
    .filter((s) => s && !/^\d+\s*GP$/i.test(s) && !/^and\b/i.test(s));
}

/**
 * Backgrounds: the 4 native 2024 SRD ones (full benefits) plus the classic 2014
 * PHB backgrounds adapted to 2024 rules — skills + roleplay feature kept, and a
 * 2024-style +2/+1 ability choice offered over the abilities their skills use.
 */
export async function fetchBackgrounds(): Promise<BackgroundInfo[]> {
  const out: BackgroundInfo[] = [];
  const taken = new Set<string>();
  // --- native 2024 ---
  try {
    const all = await fetchAll(`${OPEN5E_API}/v2/backgrounds/?document__key=srd-2024`);
    for (const r of all) {
      const ben: { type?: string; desc?: string }[] = Array.isArray(r.benefits) ? r.benefits : [];
      const find = (t: string) => ben.find((b) => b.type === t)?.desc ?? "";
      const abilityOptions: string[] = [];
      for (const [en, key] of Object.entries(ABILITY_EN)) {
        if (new RegExp(en, "i").test(find("ability_score"))) abilityOptions.push(key);
      }
      const eqText = find("equipment");
      const aPart = /\(A\)([\s\S]*?)(?:;?\s*or\s*\(B\)|$)/i.exec(eqText)?.[1] ?? eqText;
      taken.add(r.name.toLowerCase());
      out.push({
        key: r.key,
        name: r.name,
        edition: "2024",
        skills: skillsFromText(find("skill_proficiency")),
        feat: find("feat") || undefined,
        toolProf: find("tool_proficiency") || undefined,
        abilityOptions,
        equipment: parseEquipList(aPart),
      });
    }
  } catch {
    /* keep going to 2014 */
  }
  // --- classic 2014, adapted to 2024 ---
  try {
    const v1 = await fetchAll(`${OPEN5E_API}/v1/backgrounds/`);
    for (const r of v1) {
      const name: string = r.name ?? "";
      if (!CORE_2014_BG.has(name.toLowerCase()) || taken.has(name.toLowerCase())) continue;
      taken.add(name.toLowerCase());
      const skills = skillsFromText(r.skill_proficiencies ?? "");
      // suggested +2/+1: abilities the granted skills key off (fallback: all six)
      let abilityOptions = [...new Set(skills.map((k) => SKILL_KEY_ABILITY[k]).filter(Boolean))];
      if (abilityOptions.length < 2) abilityOptions = ["str", "dex", "con", "int", "wis", "cha"];
      out.push({
        key: r.slug,
        name,
        edition: "2014",
        skills,
        abilityOptions,
        equipment: parseEquipList(r.equipment ?? ""),
        // v1 often leaves feature_desc empty; fall back to the background flavor text.
        feature: r.feature
          ? { name: r.feature, desc: (r.feature_desc && r.feature_desc.trim()) || (r.desc ?? "").trim() }
          : undefined,
        toolProf: r.tool_proficiencies && r.tool_proficiencies !== "None" ? r.tool_proficiencies : undefined,
        languages: r.languages && r.languages !== "None" ? r.languages : undefined,
      });
    }
  } catch {
    /* native list already returned */
  }
  return out;
}

/** withId — attach a fresh id to a built partial. */
export function withId<T extends object>(partial: T): T & { id: string } {
  return { ...partial, id: uid() };
}
