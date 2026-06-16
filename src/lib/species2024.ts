import type { RaceInfo } from "./srdApi";

/**
 * D&D 2024 (SRD 5.2 / PHB) species, transcribed from the manual. The public
 * Open5e API has no 2024 species endpoint, so these are bundled locally as the
 * primary source. 2024 species grant NO ability score bonuses (those come from
 * the background) — so only speed, size and traits are modeled here.
 * Trait descriptions are short mechanical summaries (paraphrased).
 */
export const SPECIES_2024: RaceInfo[] = [
  {
    key: "aasimar",
    name: "Aasimar",
    speed: 9,
    traits: [
      { name: "Resistenza Celestiale", desc: "Resistenza ai danni necrotici e radianti." },
      { name: "Scurovisione", desc: "Scurovisione entro 18 metri." },
      { name: "Mani Risananti", desc: "Azione magica: tocchi una creatura e tiri un numero di d4 pari al bonus di competenza; recupera quei PF. 1 volta per riposo lungo." },
      { name: "Portatore di Luce", desc: "Conosci il trucchetto Luce (caratteristica da incantatore: Carisma)." },
      { name: "Rivelazione Celestiale", desc: "Dal livello 5, come azione bonus puoi trasformarti (necrotico/radiante/volo) per 1 minuto." },
    ],
  },
  {
    key: "dragonborn",
    name: "Dragonborn",
    speed: 9,
    traits: [
      { name: "Ascendenza Draconica", desc: "Scegli un tipo di drago: determina il danno dell'Arma a Soffio e la Resistenza." },
      { name: "Arma a Soffio", desc: "Con l'azione di Attacco, sostituisci un attacco con un soffio (cono 4,5 m o linea 9 m): TS Destrezza CD 8+Cos+comp, 1d10 (sale a 2/3/4d10 ai liv. 5/11/17). Usi pari al bonus di competenza per riposo lungo." },
      { name: "Resistenza ai Danni", desc: "Resistenza al tipo di danno della tua ascendenza draconica." },
      { name: "Scurovisione", desc: "Scurovisione entro 18 metri." },
      { name: "Ali Draconiche", desc: "Dal livello 5, come azione bonus puoi far spuntare ali e ottenere velocità di volo pari alla tua velocità." },
    ],
  },
  {
    key: "dwarf",
    name: "Nano",
    speed: 9,
    traits: [
      { name: "Scurovisione", desc: "Scurovisione entro 36 metri." },
      { name: "Resilienza Nanica", desc: "Resistenza al veleno e vantaggio ai TS per evitare/terminare la condizione Avvelenato." },
      { name: "Robustezza Nanica", desc: "Il massimo dei PF aumenta di 1, e di 1 ancora a ogni livello." },
      { name: "Conoscenza della Pietra", desc: "Azione bonus: ottieni Senso Sismico entro 18 m per 10 minuti (su superficie di pietra). Usi pari al bonus di competenza per riposo lungo." },
    ],
  },
  {
    key: "elf",
    name: "Elfo",
    speed: 9,
    traits: [
      { name: "Lignaggio Elfico", desc: "Scegli Drow / Alto Elfo / Elfo dei Boschi: concede un trucchetto e incantesimi ai livelli 3 e 5; la velocità dell'Elfo dei Boschi sale a 10,5 m al liv. 3." },
      { name: "Ascendenza Fatata", desc: "Vantaggio ai TS per evitare/terminare la condizione Affascinato." },
      { name: "Sensi Acuti", desc: "Competenza in una tra Percezione, Intuizione o Sopravvivenza." },
      { name: "Trance", desc: "Non dormi; un riposo lungo ti richiede 4 ore di meditazione." },
      { name: "Scurovisione", desc: "Scurovisione entro 18 metri." },
    ],
  },
  {
    key: "gnome",
    name: "Gnomo",
    speed: 9,
    traits: [
      { name: "Astuzia Gnomica", desc: "Vantaggio ai tiri salvezza su Intelligenza, Saggezza e Carisma." },
      { name: "Lignaggio Gnomico", desc: "Scegli Gnomo delle Foreste (Illusione Minore + parli con piccole bestie) o Gnomo delle Rocce (Riparare/Prestidigitazione + congegni meccanici)." },
      { name: "Scurovisione", desc: "Scurovisione entro 18 metri." },
    ],
  },
  {
    key: "goliath",
    name: "Golia",
    speed: 11,
    traits: [
      { name: "Ascendenza dei Giganti", desc: "Scegli un beneficio (Nuvola/Fuoco/Gelo/Collina/Pietra/Tempesta): effetto utilizzabile un numero di volte pari al bonus di competenza per riposo lungo." },
      { name: "Corporatura Possente", desc: "Vantaggio ai TS contro l'essere Prono; conti come una taglia più grande per capacità di carico e trascinamento." },
      { name: "Forma Larga", desc: "Dal livello 5, come azione bonus puoi diventare Grande per 10 minuti (1 volta per riposo breve/lungo)." },
    ],
  },
  {
    key: "halfling",
    name: "Halfling",
    speed: 9,
    traits: [
      { name: "Coraggioso", desc: "Vantaggio ai TS per evitare/terminare la condizione Spaventato." },
      { name: "Agilità Halfling", desc: "Puoi attraversare lo spazio di creature di taglia più grande." },
      { name: "Fortuna", desc: "Quando ottieni 1 naturale su un tiro per colpire, prova o tiro salvezza con d20, ritira il dado (usa il nuovo risultato)." },
      { name: "Furtività Naturale", desc: "Puoi nasconderti anche se coperto solo da una creatura di taglia più grande." },
    ],
  },
  {
    key: "human",
    name: "Umano",
    speed: 9,
    traits: [
      { name: "Intraprendente", desc: "Ottieni Ispirazione Eroica ogni volta che finisci un riposo lungo." },
      { name: "Abile", desc: "Competenza in un'abilità a tua scelta." },
      { name: "Versatile", desc: "Ottieni un talento d'Origine a tua scelta." },
    ],
  },
  {
    key: "orc",
    name: "Orco",
    speed: 9,
    traits: [
      { name: "Scatto d'Adrenalina", desc: "Azione bonus: compi l'azione Scatto e ottieni PF temporanei pari al bonus di competenza. Usi pari al bonus di competenza per riposo breve/lungo." },
      { name: "Resistenza Implacabile", desc: "Quando scenderesti a 0 PF (ma non sei ucciso sul colpo) scendi a 1. 1 volta per riposo lungo." },
      { name: "Scurovisione", desc: "Scurovisione entro 36 metri." },
    ],
  },
  {
    key: "tiefling",
    name: "Tiefling",
    speed: 9,
    traits: [
      { name: "Eredità Infernale", desc: "Scegli un lignaggio (Abissale/Ctonio/Infernale): concede resistenza a un tipo di danno e trucchetto + incantesimi ai livelli 3 e 5." },
      { name: "Presenza Ultraterrena", desc: "Conosci il trucchetto Taumaturgia (caratteristica da incantatore a scelta: Int/Sag/Car)." },
      { name: "Scurovisione", desc: "Scurovisione entro 18 metri." },
    ],
  },
];
