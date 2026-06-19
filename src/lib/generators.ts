// Offline random generators for DM improvisation — pure local tables, no API,
// so they work instantly and offline. Inspired by the classic NPC / name /
// rumor / loot generators, adapted to Italian fantasy flavor.

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function roll(n: number): number {
  return Math.floor(Math.random() * n) + 1;
}
export function pickMany<T>(arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

// ---- Names by ancestry ----------------------------------------------------

const NAMES: Record<string, { m: string[]; f: string[]; sur: string[] }> = {
  Umano: {
    m: ["Aldric", "Bram", "Corvin", "Darian", "Edrin", "Gareth", "Lucan", "Marek", "Roderic", "Thane", "Vance", "Willem"],
    f: ["Aria", "Brenna", "Cora", "Elspeth", "Lyra", "Mira", "Rowan", "Sabine", "Talia", "Vesna", "Yara", "Zelda"],
    sur: ["di Valforte", "Brennan", "Corvi", "del Lago", "Fabbri", "Mercanti", "Pietrabianca", "Ventoscuro", "delle Torri"],
  },
  Elfo: {
    m: ["Aelar", "Caelynn", "Erevan", "Fivren", "Heian", "Laucian", "Quarion", "Soveliss", "Thamior", "Varis"],
    f: ["Adrie", "Birel", "Caelynn", "Drusilia", "Felosial", "Ielenia", "Mialee", "Naivara", "Sariel", "Thia"],
    sur: ["Amakiir", "Galanodel", "Holimion", "Liadon", "Meliamne", "Nailo", "Siannodel", "Xiloscient"],
  },
  Nano: {
    m: ["Adrik", "Baern", "Brottor", "Dain", "Eberk", "Harbek", "Morgran", "Rurik", "Thoradin", "Vondal"],
    f: ["Amber", "Bardryn", "Dagnal", "Eldeth", "Gunnloda", "Hlin", "Kathra", "Mardred", "Riswynn", "Torgga"],
    sur: ["Barbaferro", "Forgiacuore", "Martelpietra", "Profondoscavo", "Rocciaforte", "Scudodoro"],
  },
  Halfling: {
    m: ["Alton", "Cade", "Eldon", "Garret", "Lyle", "Milo", "Osborn", "Roscoe", "Wellby"],
    f: ["Andry", "Cora", "Euphemia", "Jillian", "Lavinia", "Nedda", "Portia", "Seraphina", "Verna"],
    sur: ["Buonbarile", "Pancialieta", "Sottocolle", "Tealfoglia", "Verdebottiglia"],
  },
  Orco: {
    m: ["Dench", "Feng", "Gell", "Henk", "Krusk", "Mhurren", "Ront", "Shump", "Thokk"],
    f: ["Baggi", "Emen", "Engong", "Myev", "Neega", "Ovak", "Shautha", "Vola", "Yevelda"],
    sur: ["Spaccateschi", "Zannarossa", "Pugnoferro", "Mangiaossa"],
  },
  Tiefling: {
    m: ["Akmenos", "Damaia", "Kairon", "Leucis", "Melech", "Mordai", "Skamos", "Therai"],
    f: ["Bryseis", "Criella", "Damaia", "Ea", "Kallista", "Nemeia", "Orianna", "Rieta"],
    sur: ["(virtù) Speranza", "Lacrima", "Ombra", "Sussurro", "Cenere"],
  },
};
export const NAME_ANCESTRIES = Object.keys(NAMES);

export function randomName(ancestry?: string, sex?: "m" | "f"): string {
  const a = ancestry && NAMES[ancestry] ? ancestry : pick(NAME_ANCESTRIES);
  const t = NAMES[a];
  const s = sex ?? (Math.random() < 0.5 ? "m" : "f");
  return `${pick(t[s])} ${pick(t.sur)}`;
}

// ---- NPC -------------------------------------------------------------------

const NPC_RACES = ["umano", "mezzelfo", "elfo", "nano", "halfling", "mezzorco", "tiefling", "gnomo", "dragonide"];
const NPC_JOBS = ["locandiere", "fabbro", "guardia cittadina", "mercante girovago", "sacerdote", "ladro", "cacciatore", "scriba", "guaritrice", "menestrello", "contadino", "becchino", "alchimista", "pescatore", "cartografo", "domatore di bestie"];
const NPC_TRAITS = ["nervoso e sospettoso", "gioviale e chiacchierone", "freddo e calcolatore", "ingenuo e curioso", "arrogante", "stanco del mondo", "pio fino al fanatismo", "avido ma codardo", "leale e schietto", "ironico e tagliente", "malinconico", "iperattivo"];
const NPC_QUIRKS = ["parla in terza persona", "tossisce di continuo", "colleziona denti", "non guarda mai negli occhi", "ride a sproposito", "cita proverbi inventati", "ha un tic alla mano", "profuma di incenso", "porta sempre un gatto", "balbetta sui nomi propri"];
const NPC_WANTS = ["saldare un vecchio debito", "vendicare un fratello", "trovare una reliquia perduta", "fuggire dalla città prima dell'alba", "proteggere un segreto di famiglia", "diventare ricco a ogni costo", "espiare una colpa", "trovare l'amore perduto", "rovesciare il signore locale", "solo sopravvivere all'inverno"];
const NPC_FEARS = ["il fuoco", "l'acqua profonda", "essere dimenticato", "i non-morti", "la propria ombra", "gli spazi chiusi", "il sangue", "la magia", "l'altezza", "la verità su sé stesso"];
const NPC_POSSESS = ["un anello inciso senza valore apparente", "una mappa strappata a metà", "un coltello sbeccato ma ben tenuto", "una lettera mai spedita", "una moneta di un regno caduto", "un ciondolo con un ritratto", "un libro proibito", "una chiave senza serratura nota", "una fiala di liquido torbido"];

export interface NPCResult {
  name: string;
  race: string;
  job: string;
  trait: string;
  quirk: string;
  wants: string;
  fears: string;
  carries: string;
}
export function randomNPC(): NPCResult {
  return {
    name: randomName(),
    race: pick(NPC_RACES),
    job: pick(NPC_JOBS),
    trait: pick(NPC_TRAITS),
    quirk: pick(NPC_QUIRKS),
    wants: pick(NPC_WANTS),
    fears: pick(NPC_FEARS),
    carries: pick(NPC_POSSESS),
  };
}

// ---- Plot hooks / rumors ---------------------------------------------------

const HOOK_A = ["Una bambina", "Un vecchio mendicante", "Il capo delle guardie", "Una nobildonna velata", "Un mercante terrorizzato", "Un monaco silenzioso", "Lo strozzino del porto", "Una locandiera"];
const HOOK_B = ["offre una borsa d'oro", "supplica in lacrime", "lascia un biglietto anonimo", "promette un favore reale", "minaccia velatamente", "paga in gemme grezze"];
const HOOK_C = ["per ritrovare una figlia scomparsa nelle fogne", "per scortare un carico che nessuno deve aprire", "per indagare su morti che sembrano suicidi", "per recuperare un anello da una tomba sigillata", "per dare la caccia a una bestia che ruba solo bambini", "per consegnare una lettera a un morto", "per scoprire chi avvelena il pozzo", "per fermare campane che suonano da sole a mezzanotte"];

export function randomHook(): string {
  return `${pick(HOOK_A)} ${pick(HOOK_B)} ${pick(HOOK_C)}.`;
}

const RUMORS = [
  "Dicono che sotto la vecchia cappella ci sia una scala che non finisce mai.",
  "Il fabbro non dorme più da quando ha forgiato quella spada.",
  "Tre carovane sono sparite sullo stesso tratto di strada, sempre di luna nuova.",
  "La figlia del borgomastro è tornata… ma parla una lingua che nessuno conosce.",
  "C'è un prezzo sulla testa di chi indossa un mantello verde in città.",
  "Le acque del fiume sono salate da una settimana, e nessuno sa perché.",
  "Un drago è stato visto, ma volava all'indietro.",
  "Chi entra nella foresta di notte torna senza la propria ombra.",
];
export function randomRumor(): string {
  return pick(RUMORS);
}

// ---- Loot ------------------------------------------------------------------

const LOOT_TRINKETS = ["un dado d'osso che cade sempre sul 7", "una chiave di ottone calda al tatto", "un fazzoletto ricamato con un nome cancellato", "una bussola che punta verso il basso", "un occhio di vetro che a volte ammicca", "un mazzo di carte con una sola figura ripetuta", "una candela che non si consuma mai", "un guscio che sussurra il mare"];
const LOOT_GEMS = ["3 ametiste (50 mo)", "un'opale di fuoco (200 mo)", "una manciata di perle d'acqua dolce (10×10 mo)", "un diamante grezzo (300 mo)", "quarzo affumicato (25 mo)", "una corniola incisa (60 mo)"];

export interface LootResult {
  coins: string;
  gem?: string;
  trinket?: string;
}
export function randomLoot(tier: "minore" | "medio" | "maggiore"): LootResult {
  if (tier === "minore") return { coins: `${roll(6) + roll(6)} ma, ${roll(20)} ag`, trinket: Math.random() < 0.5 ? pick(LOOT_TRINKETS) : undefined };
  if (tier === "medio") return { coins: `${(roll(6) + 2) * 10} mo`, gem: Math.random() < 0.6 ? pick(LOOT_GEMS) : undefined, trinket: Math.random() < 0.4 ? pick(LOOT_TRINKETS) : undefined };
  return { coins: `${(roll(6) + roll(6)) * 50} mo`, gem: pick(LOOT_GEMS), trinket: Math.random() < 0.6 ? pick(LOOT_TRINKETS) : undefined };
}

// ---- Tavern ----------------------------------------------------------------

const TAV_A = ["Il Drago", "La Sirena", "Il Boccale", "La Volpe", "Il Corvo", "Lo Scudo", "La Rosa", "Il Grifone", "Il Cinghiale", "La Luna"];
const TAV_B = ["Dorato", "Ubriaco", "Storto", "Spezzato", "Ridente", "Insanguinato", "Addormentato", "Affamato", "Danzante", "Solitario"];
export function randomTavern(): string {
  return `${pick(TAV_A)} ${pick(TAV_B)}`;
}
