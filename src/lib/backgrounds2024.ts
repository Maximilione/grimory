import type { BackgroundInfo } from "./srdApi";

/**
 * The 16 official 2024 backgrounds (PHB / SRD 5.2), transcribed from the manual.
 * The public API exposes only 4, so these are bundled locally as the 2024 set.
 * abilityOptions = the three listed scores (the +2/+1 picker chooses among them).
 * equipment = Option A item names (gold omitted; the user can edit).
 */
export const BACKGROUNDS_2024: BackgroundInfo[] = [
  {
    key: "bg2024-acolyte", name: "Acolyte", edition: "2024",
    abilityOptions: ["int", "wis", "cha"], feat: "Magic Initiate (Cleric)",
    skills: ["insight", "religion"], toolProf: "Strumenti da Calligrafo",
    equipment: ["Calligrapher's Supplies", "Book (prayers)", "Holy Symbol", "Parchment (10)", "Robe"],
  },
  {
    key: "bg2024-artisan", name: "Artisan", edition: "2024",
    abilityOptions: ["str", "dex", "int"], feat: "Crafter",
    skills: ["investigation", "persuasion"], toolProf: "Strumenti da Artigiano (a scelta)",
    equipment: ["Artisan's Tools", "Pouch", "Pouch", "Traveler's Clothes"],
  },
  {
    key: "bg2024-charlatan", name: "Charlatan", edition: "2024",
    abilityOptions: ["dex", "con", "cha"], feat: "Skilled",
    skills: ["deception", "sleightOfHand"], toolProf: "Kit da Falsario",
    equipment: ["Forgery Kit", "Costume", "Fine Clothes"],
  },
  {
    key: "bg2024-criminal", name: "Criminal", edition: "2024",
    abilityOptions: ["dex", "con", "int"], feat: "Alert",
    skills: ["sleightOfHand", "stealth"], toolProf: "Arnesi da Scasso",
    equipment: ["Dagger", "Dagger", "Thieves' Tools", "Crowbar", "Pouch", "Pouch", "Traveler's Clothes"],
  },
  {
    key: "bg2024-entertainer", name: "Entertainer", edition: "2024",
    abilityOptions: ["str", "dex", "cha"], feat: "Musician",
    skills: ["acrobatics", "performance"], toolProf: "Strumento Musicale (a scelta)",
    equipment: ["Musical Instrument", "Costume", "Costume", "Mirror", "Perfume", "Traveler's Clothes"],
  },
  {
    key: "bg2024-farmer", name: "Farmer", edition: "2024",
    abilityOptions: ["str", "con", "wis"], feat: "Tough",
    skills: ["animalHandling", "nature"], toolProf: "Strumenti da Carpentiere",
    equipment: ["Sickle", "Carpenter's Tools", "Healer's Kit", "Iron Pot", "Shovel", "Traveler's Clothes"],
  },
  {
    key: "bg2024-guard", name: "Guard", edition: "2024",
    abilityOptions: ["str", "int", "wis"], feat: "Alert",
    skills: ["athletics", "perception"], toolProf: "Set da Gioco (a scelta)",
    equipment: ["Spear", "Light Crossbow", "20 Bolts", "Gaming Set", "Hooded Lantern", "Manacles", "Quiver", "Traveler's Clothes"],
  },
  {
    key: "bg2024-guide", name: "Guide", edition: "2024",
    abilityOptions: ["dex", "con", "wis"], feat: "Magic Initiate (Druid)",
    skills: ["stealth", "survival"], toolProf: "Strumenti da Cartografo",
    equipment: ["Shortbow", "20 Arrows", "Cartographer's Tools", "Bedroll", "Quiver", "Tent", "Traveler's Clothes"],
  },
  {
    key: "bg2024-hermit", name: "Hermit", edition: "2024",
    abilityOptions: ["con", "wis", "cha"], feat: "Healer",
    skills: ["medicine", "religion"], toolProf: "Kit da Erborista",
    equipment: ["Quarterstaff", "Herbalism Kit", "Bedroll", "Book (philosophy)", "Lamp", "Oil", "Traveler's Clothes"],
  },
  {
    key: "bg2024-merchant", name: "Merchant", edition: "2024",
    abilityOptions: ["con", "int", "cha"], feat: "Lucky",
    skills: ["animalHandling", "persuasion"], toolProf: "Strumenti da Navigatore",
    equipment: ["Navigator's Tools", "Pouch", "Pouch", "Traveler's Clothes"],
  },
  {
    key: "bg2024-noble", name: "Noble", edition: "2024",
    abilityOptions: ["str", "int", "cha"], feat: "Skilled",
    skills: ["history", "persuasion"], toolProf: "Set da Gioco (a scelta)",
    equipment: ["Gaming Set", "Fine Clothes", "Perfume"],
  },
  {
    key: "bg2024-sage", name: "Sage", edition: "2024",
    abilityOptions: ["con", "int", "wis"], feat: "Magic Initiate (Wizard)",
    skills: ["arcana", "history"], toolProf: "Strumenti da Calligrafo",
    equipment: ["Quarterstaff", "Calligrapher's Supplies", "Book (history)", "Parchment (8)", "Robe"],
  },
  {
    key: "bg2024-sailor", name: "Sailor", edition: "2024",
    abilityOptions: ["str", "dex", "wis"], feat: "Tavern Brawler",
    skills: ["acrobatics", "perception"], toolProf: "Strumenti da Navigatore",
    equipment: ["Dagger", "Navigator's Tools", "Rope", "Traveler's Clothes"],
  },
  {
    key: "bg2024-scribe", name: "Scribe", edition: "2024",
    abilityOptions: ["dex", "int", "wis"], feat: "Skilled",
    skills: ["investigation", "perception"], toolProf: "Strumenti da Calligrafo",
    equipment: ["Calligrapher's Supplies", "Fine Clothes", "Lamp", "Oil", "Parchment (12)"],
  },
  {
    key: "bg2024-soldier", name: "Soldier", edition: "2024",
    abilityOptions: ["str", "dex", "con"], feat: "Savage Attacker",
    skills: ["athletics", "intimidation"], toolProf: "Set da Gioco (a scelta)",
    equipment: ["Spear", "Shortbow", "20 Arrows", "Gaming Set", "Healer's Kit", "Quiver", "Traveler's Clothes"],
  },
  {
    key: "bg2024-wayfarer", name: "Wayfarer", edition: "2024",
    abilityOptions: ["dex", "wis", "cha"], feat: "Lucky",
    skills: ["insight", "stealth"], toolProf: "Arnesi da Scasso",
    equipment: ["Dagger", "Dagger", "Thieves' Tools", "Gaming Set", "Bedroll", "Pouch", "Pouch", "Traveler's Clothes"],
  },
];
