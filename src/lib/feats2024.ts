import type { FeatureEffect } from "./types";

/**
 * 2024 Origin feats (granted by backgrounds), transcribed from the manual as
 * short mechanical summaries. Some carry stat effects auto-applied to the sheet
 * (Tough → +PF, Alert → +iniziativa). Looked up when a background grants a feat.
 */
export interface FeatInfo {
  name: string;
  category: "Origin" | "General" | "Fighting Style" | "Epic Boon";
  desc: string;
  effects?: FeatureEffect[];
  /** Ability keys this feat can raise by 1 ("any" = qualsiasi). Used at level-up. */
  abilities?: string[];
}

const ALL6 = ["str", "dex", "con", "int", "wis", "cha"];

/** 2024 General feats (level 4+): each gives +1 to an ability + a benefit. Concise. */
export const GENERAL_FEATS: FeatInfo[] = [
  { name: "Actor", category: "General", abilities: ["cha"], desc: "Vantaggio a Inganno/Intrattenere per impersonare; imiti voci e suoni." },
  { name: "Athlete", category: "General", abilities: ["str", "dex"], desc: "Velocità di scalata; ti rialzi dal prono con 1,5 m; salti dopo 1,5 m di corsa." },
  { name: "Charger", category: "General", abilities: ["str", "dex"], desc: "Scatto migliorato; carica dopo 3 m in linea: +1d8 danni o spinta." },
  { name: "Chef", category: "General", abilities: ["con", "wis"], desc: "Cucini cibo che cura/dà PF temporanei dopo un riposo." },
  { name: "Crossbow Expert", category: "General", abilities: ["dex"], desc: "Ignori il caricamento; niente svantaggio in mischia coi balestre." },
  { name: "Defensive Duelist", category: "General", abilities: ["dex"], desc: "Reazione: aggiungi il bonus competenza alla CA contro un attacco in mischia." },
  { name: "Dual Wielder", category: "General", abilities: ["str", "dex"], desc: "Bonus alla CA con due armi; estrai/riponi due armi; combatti a due armi migliorato." },
  { name: "Durable", category: "General", abilities: ["con"], desc: "Recuperi più PF coi dadi vita; TS morte più facili." },
  { name: "Eldritch Adept", category: "General", abilities: ["int", "wis", "cha"], desc: "Impari un'Invocazione Occulta." },
  { name: "Fey-Touched", category: "General", abilities: ["int", "wis", "cha"], desc: "Passo Velato + un incantesimo di 1° (divinazione/incantamento), 1/riposo gratis." },
  { name: "Grappler", category: "General", abilities: ["str", "dex"], desc: "Vantaggio agli attacchi contro creature che afferri; puoi spostarle." },
  { name: "Great Weapon Master", category: "General", abilities: ["str"], desc: "Attacco bonus dopo un critico/uccisione; opzione −colpire/+danni con armi pesanti." },
  { name: "Heavily Armored", category: "General", abilities: ["con", "str"], desc: "Competenza nelle armature pesanti." },
  { name: "Heavy Armor Master", category: "General", abilities: ["con", "str"], desc: "Riduzione dei danni da armi non magiche con armatura pesante." },
  { name: "Inspiring Leader", category: "General", abilities: ["wis", "cha"], desc: "Discorso: dai PF temporanei agli alleati." },
  { name: "Keen Mind", category: "General", abilities: ["int"], desc: "Memoria perfetta; sai sempre dove sei e che ore sono." },
  { name: "Lightly Armored", category: "General", abilities: ["str", "dex"], desc: "Competenza nelle armature leggere." },
  { name: "Mage Slayer", category: "General", abilities: ["str", "dex"], desc: "Reazione contro chi lancia vicino; vantaggio ai TS contro incantesimi." },
  { name: "Medium Armor Master", category: "General", abilities: ["str", "dex"], desc: "Niente svantaggio Furtività; +3 Des alla CA con armature medie." },
  { name: "Moderately Armored", category: "General", abilities: ["str", "dex"], desc: "Competenza armature medie e scudi." },
  { name: "Mounted Combatant", category: "General", abilities: ["str", "dex", "wis"], desc: "Vantaggi in combattimento da cavalcatura; proteggi la cavalcatura." },
  { name: "Observant", category: "General", abilities: ["int", "wis"], desc: "Lettura labiale; bonus a Indagare/Percezione." },
  { name: "Piercer", category: "General", abilities: ["str", "dex"], desc: "Ritira un dado di danno perforante 1/turno; critico +1 dado." },
  { name: "Poisoner", category: "General", abilities: ["dex", "int"], desc: "Applichi veleni; ignori resistenza al veleno; crei veleni." },
  { name: "Polearm Master", category: "General", abilities: ["str", "dex"], desc: "Attacco bonus col calcio dell'arma; attacco di opportunità all'avvicinarsi." },
  { name: "Resilient", category: "General", abilities: ALL6, desc: "Competenza nei tiri salvezza della caratteristica scelta." },
  { name: "Ritual Caster", category: "General", abilities: ["int", "wis", "cha"], desc: "Lanci incantesimi rituali da un libro." },
  { name: "Shadow-Touched", category: "General", abilities: ["int", "wis", "cha"], desc: "Invisibilità + un incantesimo di 1° (illusione/negromanzia), 1/riposo gratis." },
  { name: "Sharpshooter", category: "General", abilities: ["dex"], desc: "Ignori copertura/lunga gittata; opzione −colpire/+danni a distanza." },
  { name: "Skill Expert", category: "General", abilities: ALL6, desc: "Una competenza, una nuova abilità, ed esperto in un'abilità." },
  { name: "Skulker", category: "General", abilities: ["dex"], desc: "Ti nascondi meglio; mancare non rivela la tua posizione." },
  { name: "Slasher", category: "General", abilities: ["str", "dex"], desc: "Riduci la velocità con danni taglienti; critico impone svantaggio." },
  { name: "Speedy", category: "General", abilities: ["dex", "con"], desc: "Velocità +3 m; lo Scatto ignora il terreno difficile.", effects: [{ target: "speed", mode: "add", formula: "3" }] },
  { name: "Spell Sniper", category: "General", abilities: ["int", "wis", "cha"], desc: "Gittata raddoppiata degli incantesimi d'attacco; ignori copertura." },
  { name: "Telekinetic", category: "General", abilities: ["int", "wis", "cha"], desc: "Mano Magica mentale; spingi creature come azione bonus." },
  { name: "Telepathic", category: "General", abilities: ["int", "wis", "cha"], desc: "Parli telepaticamente; lanci Individuazione del Pensiero 1/riposo." },
];

export const FEATS_2024: Record<string, FeatInfo> = {
  alert: {
    name: "Alert", category: "Origin",
    desc: "Competenza in Iniziativa (aggiungi il bonus di competenza ai tiri di iniziativa). Puoi scambiare la tua iniziativa con quella di un alleato consenziente.",
    effects: [{ target: "initiative", mode: "add", formula: "prof" }],
  },
  crafter: {
    name: "Crafter", category: "Origin",
    desc: "Competenza con 3 set di strumenti da artigiano. Sconto del 20% sugli acquisti non magici. Puoi creare un oggetto durante un riposo lungo.",
  },
  healer: {
    name: "Healer", category: "Origin",
    desc: "Con un Kit del Guaritore puoi far spendere a una creatura un dado vita e curarla (tiro + bonus competenza). Ritiri gli 1 sui dadi di cura.",
  },
  lucky: {
    name: "Lucky", category: "Origin",
    desc: "Punti Fortuna pari al bonus di competenza (per riposo lungo): spendili per avere vantaggio su un tuo d20, o imporre svantaggio a un attacco contro di te.",
  },
  "magic initiate": {
    name: "Magic Initiate", category: "Origin",
    desc: "Impari 2 trucchetti e 1 incantesimo di 1° livello (da Chierico/Druido/Mago a seconda della versione). L'incantesimo si lancia 1 volta gratis per riposo lungo. Caratteristica a scelta Int/Sag/Car.",
  },
  musician: {
    name: "Musician", category: "Origin",
    desc: "Competenza con 3 strumenti musicali. Dopo un riposo puoi dare Ispirazione Eroica ad alleati (numero pari al bonus di competenza).",
  },
  "savage attacker": {
    name: "Savage Attacker", category: "Origin",
    desc: "Una volta per turno, quando colpisci con un'arma, puoi ritirare i dadi di danno dell'arma e usare il risultato migliore.",
  },
  skilled: {
    name: "Skilled", category: "Origin",
    desc: "Ottieni competenza in 3 abilità o strumenti a tua scelta (in qualsiasi combinazione).",
  },
  "tavern brawler": {
    name: "Tavern Brawler", category: "Origin",
    desc: "Ritiri gli 1 sul danno senz'armi. Il colpo senz'armi infligge 1d4. Puoi spingere/afferrare dopo un colpo senz'armi a segno. Competenza con improvvisate.",
  },
  tough: {
    name: "Tough", category: "Origin",
    desc: "Il massimo dei PF aumenta di 2 × il livello del personaggio (e di 2 a ogni livello successivo).",
    effects: [{ target: "maxHp", mode: "add", formula: "2*level" }],
  },
};

/** Look up a feat by name, ignoring parentheticals like "Magic Initiate (Cleric)". */
export function lookupFeat(name: string): FeatInfo | undefined {
  const key = name.toLowerCase().replace(/\(.*\)/, "").trim();
  return FEATS_2024[key];
}
