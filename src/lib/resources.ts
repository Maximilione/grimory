import type { Resource } from "./types";
import { uid } from "./db";

type ResDef = { name: string; max: string; recharge: "short" | "long" };

/** Quick-add presets for the resource tracker (formula in `max`). */
export const RESOURCE_PRESETS: ResDef[] = [
  { name: "Punti Focus", max: "level", recharge: "short" },
  { name: "Punti Stregoneria", max: "level", recharge: "long" },
  { name: "Ira", max: "min(6, 2 + floor(level/3))", recharge: "long" },
  { name: "Ispirazione Bardica", max: "max(1, mod.cha)", recharge: "long" },
  { name: "Incanalare Divinità", max: "2", recharge: "long" },
  { name: "Forma Selvatica", max: "2", recharge: "short" },
  { name: "Azione Impetuosa", max: "1", recharge: "short" },
  { name: "Indomito", max: "1", recharge: "long" },
  { name: "Punti Fortuna", max: "prof", recharge: "long" },
];

function mk(d: ResDef): Resource {
  return { id: uid(), name: d.name, max: { formula: d.max }, spent: 0, recharge: d.recharge };
}

/** Resources a class brings (added at creation / when the class is gained). */
export function classResources(classKey: string): Resource[] {
  switch (classKey) {
    case "monk": return [mk({ name: "Punti Focus", max: "level", recharge: "short" })];
    case "sorcerer": return [mk({ name: "Punti Stregoneria", max: "level", recharge: "long" })];
    case "barbarian": return [mk({ name: "Ira", max: "min(6, 2 + floor(level/3))", recharge: "long" })];
    case "bard": return [mk({ name: "Ispirazione Bardica", max: "max(1, mod.cha)", recharge: "long" })];
    case "cleric":
    case "paladin": return [mk({ name: "Incanalare Divinità", max: "2", recharge: "long" })];
    case "druid": return [mk({ name: "Forma Selvatica", max: "2", recharge: "short" })];
    case "fighter": return [mk({ name: "Azione Impetuosa", max: "1", recharge: "short" })];
    default: return [];
  }
}

/** Resources a feat grants (e.g. Lucky → Luck Points). */
export function featResources(featName: string): Resource[] {
  if (/lucky/i.test(featName)) return [mk({ name: "Punti Fortuna", max: "prof", recharge: "long" })];
  return [];
}

export function makeResource(d: ResDef): Resource {
  return mk(d);
}
