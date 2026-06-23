# Grimorio — Schede GDR

App mobile (PWA) per gestire schede personaggio **D&D 5e (2024 / 5.5)**. Installabile su
iOS e Android senza store né account sviluppatore: apri il link → "Aggiungi a Home".
Funziona offline. **I dati vivono sul dispositivo** (IndexedDB) + backup automatico
+ export/import JSON.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind v4** — temi **chiaro (pergamena D&D) e scuro (grimorio)**, toggle persistente, titoli in
  font display Cinzel. Mobile-first.
- **Dexie** (IndexedDB) — storage local-first reattivo
- **zustand** — store del lanciatore di dadi
- PWA: `app/manifest.ts` + `public/sw.js` (service worker offline)

Output build = 100% statico → deployabile su qualsiasi host statico (Vercel/Netlify/…).
Serve un **URL fisso HTTPS** perché il party installi e i dati persistano.

## Deploy su GitHub Pages (gratis)

L'app è esportata staticamente (`output: 'export'`) e c'è un workflow GitHub Actions
(`.github/workflows/deploy.yml`) che builda e pubblica da solo. Il base path è automatico:
repo `tuonome.github.io` → root; repo di progetto → `/<nome-repo>/`.

1. Crea un repo su GitHub e fai push del progetto:
   ```bash
   git add -A && git commit -m "Grimorio"
   git branch -M main
   git remote add origin https://github.com/<TUONOME>/<REPO>.git
   git push -u origin main
   ```
2. Su GitHub: **Settings › Pages › Build and deployment › Source = GitHub Actions**.
3. Ogni push su `main` builda e pubblica. URL finale:
   - repo `tuonome.github.io` → `https://tuonome.github.io/`
   - repo `grimorio` → `https://tuonome.github.io/grimorio/`
4. Apri l'URL sul telefono → "Aggiungi a Home" (installa la PWA). HTTPS è automatico.

> Build manuale in locale: `yarn build` genera la cartella `out/` (per repo di progetto:
> `NEXT_PUBLIC_BASE_PATH=/<repo> yarn build`).

## Comandi (Yarn)

```bash
yarn dev      # sviluppo (http://localhost:3000)
yarn build    # build produzione (statica)
yarn start    # serve la build
```

> ⚠️ Non lanciare `yarn build` mentre `yarn dev` gira sulla stessa cartella:
> condividono `.next` e si pestano i piedi (il dev server muore).

## Architettura

Tutto ciò che "scala con stat/livello" è **derivato**, mai salvato.

**Core (`src/lib/`)**
- `types.ts` — modello dati `Character` (system-agnostic dove possibile)
- `srd.ts` — dati 5e 2024: classi, skill, slot incantesimi (anche multiclasse), cantrip
  scaling, condizioni + effetti, sfinimento, effetti noti dei privilegi
- `species2024.ts` — le 10 specie 2024 native (dal manuale 5.5), l'API non le ha
- `rules.ts` — motore: modificatori, competenza, CD/attacco incantesimi, attacco armi,
  CA derivata (effetti privilegi), capacità di carico, helper multiclasse, variabili formule
- `dice.ts` — parser/evaluator sicuro (no `eval`): aritmetica, variabili, funzioni
  (`floor/ceil/min/max…`), dadi `NdM`, raddoppio dadi al critico. Modalità: tira / media / formula
- `rollStore.ts` — store zustand dei tiri (d20 con vantaggio/svantaggio, crit/fumble, log)
- `srdApi.ts` — integrazione Open5e (autofill, feature di classe, sottoclassi, background,
  equip, ricerca manuale) — vedi sotto
- `db.ts` — Dexie + factory personaggio + snapshot localStorage
- `backup.ts` — export/import JSON

**UI** — `src/app/sheet/page.tsx` è la shell con sidebar a gruppi; le sezioni sono in
`src/components/sheet/`. `src/components/PixelArt.tsx` = libreria pixel-art SVG (sfondi).

### Sezioni della scheda (sidebar)
- **Scheda**: Panoramica · Caratteristiche · Abilità · Competenze & Lingue
- **Combattimento**: Attacchi · Armi
- **Risorse**: Incantesimi · Equipaggiamento · Tratti & Privilegi
- **Riferimento**: Manuale
- **Personalizza**: Homebrew · Impostazioni

## Persistenza dei dati (importante)

Dati in **IndexedDB**, legati all'**origine** (dominio + porta).
- In sviluppo la porta può cambiare → sembra "vuoto" su una porta diversa: normale.
- In produzione, su un URL fisso, i dati persistono tra sessioni e dopo l'install.
- Backup automatico mirror in `localStorage` (ultime 5 versioni) + **Esporta backup** (file JSON).

## Creazione guidata

Wizard in 2 fasi (`src/app/create/page.tsx` + `src/components/create/GuidedSetup.tsx`):

1. **Basi**: nome, classe, livello + caratteristiche con **tira & assegna** (6 valori
   4d6-scarta-minore → drag-and-drop o tap sulle stat; **max 2 tiri** poi alert). In alternativa
   **Array standard** [15,14,13,12,10,8] o **🎲 Casuale** (classe + tiri auto-assegnati alle primarie).
2. **Configura `<classe>`** (se hai scelto una classe):
   - **Competenze di classe**: lista e numero giusti (Open5e v1 `prof_skills`).
   - **Sottoclasse**: se il livello la concede (2024: liv. 3) — 2024 SRD + classiche 2014
     (archetypes v1) adattate, raggruppate per edizione.
   - **Razza/Stirpe** — **specie 2024 native** (`species2024.ts`): velocità + tratti come privilegi.
     Le specie 2024 non danno bonus caratteristica (vengono dal background, come da regole).
   - **Background**: **16 nativi 2024** (`backgrounds2024.ts`, dal manuale) + classici 2014 (v1)
     **adattati a 5.5**, raggruppati per edizione. Competenze, talento/privilegio, strumenti,
     lingue e **+2/+1** 2024 (lo scegli tu).
   - **Equipaggiamento base** (opzionale): classe + background, scelte a/b + fissi. **Classificato**
     (`classifyEquipment`): armi → sezione Armi (tirabili), armatura → **CA** (+2 scudo), resto → inventario.
   - I **privilegi di classe e di sottoclasse per ogni livello fino al tuo** vengono aggiunti in automatico.

Al **level-up** che concede la sottoclasse (di solito liv. 3) compare un **selettore sottoclasse**
(2024 + archetypi 2014); scegliendola vengono aggiunte le sue feature. Le feature di sottoclasse ai
livelli successivi si aggiungono da sole. Il **Colpo senz'armi** del Monaco usa il dado arti marziali
(1d6→1d12 per livello) e il migliore tra Forza/Destrezza.

## Funzionalità di gioco

- **Tiri**: prove, TS, abilità, attacchi, danni. Dado sicuro (no `eval`), toast + **cronologia**.
- **Vantaggio / svantaggio**: pillola sticky; tutti i d20 la rispettano (tiene alto/basso,
  crit/fumble sul dado tenuto).
- **Critico / fallimento**: nat 20 → burst oro "CRITICO!"; nat 1 → shake rosso "FALLIMENTO!".
  Rispetta `prefers-reduced-motion`.
- **Attacchi guidati**: prima il colpire, poi i danni si sbloccano; al crit i dadi raddoppiano.
  **Colpo senz'armi** sempre presente. Sottosezione **Incantesimi rapidi** (cantrip/incantesimi con danno).
- **Stato combattimento** (Panoramica): TS morte (3/3 + roll, **+1 fallimento auto** se subisci danni a 0 PF),
  condizioni 2024, **sfinimento** (−2×liv. ai d20 e CD), ispirazione, concentrazione.
  **Concentrazione auto**: cade a 0 PF; reminder TS Costituzione quando subisci danni.
- **Punteggi passivi**: Percezione, Indagare, Intuizione. **Magia del Patto** (warlock) tracciata a parte.
- **CD/attacco incantesimi per caratteristica** (multiclasse con caster misti) + conteggio preparati.
- **Munizioni** per arma (frecce/dardi) con contatore in Attacchi.
- **Modificatori attacco custom** per arma: bonus magico (colpire+danno), **bonus colpire** e **bonus danno**
  separati (stili di combattimento, situazionali). Le azioni personalizzate usano formule complete.
- **Personalizzazione**: ritratto/avatar (Impostazioni), colore accento, **Compagni** (mini-schede famigli/
  evocazioni con PF **e attacchi tirabili**), **Note & Diario**.
- **Difese & Sensi** (sezione): resistenze / immunità / vulnerabilità / immunità a condizioni / sensi
  (chip) + **velocità multiple** (volo/nuoto/scalata/scavo).
- **Bonus fini**: bonus extra per singola abilità e tiro salvezza (oggetti), **Tuttofare** (mezza
  competenza), soglie di **ingombro** (ingombrato/sovraccarico), **ispirazione multipla** (contatore).
- **Gestione**: PE opzionali, oggetti in **sintonia** nominati (3 slot), flag **rituale/concentrazione**
  sugli incantesimi (tag C/R, presi anche dall'API).
- **Riposi**: breve = slot pact (warlock) + privilegi a riposo breve; lungo = PF pieni, slot,
  metà dadi vita, −1 sfinimento. Spesa dado vita per curare.
- **Level-up + multiclasse**: scegli quale classe salire (o aggiungine una). PF medi, slot/dadi vita
  ricalcolati. Privilegi per livello presi da Open5e (2024). **ASI/Talento** segnalato ai livelli fissi;
  **Expertise** apre il selettore delle competenze da raddoppiare. Slot incantesimi multiclasse
  (full + half/2 + third/3, pact a parte).
- **Incantesimi**: slot per livello (multiclasse), preparati, danno con scaling. Due modi per aggiungere:
  **Lista classe** (sfoglia la lista della tua classe filtrata per livello/nome, `fetchClassSpells`) e
  **Manuale** (ricerca su tutto l'SRD 2024). I dati spell sono cachati/offline. Quick-cast in Attacchi.
- **Risorse** (Panoramica): contatori per Punti Focus, Punti Stregoneria, Ira, Ispirazione Bardica,
  Incanalare Divinità, Forma Selvatica, Azione Impetuosa, Punti Fortuna (Lucky)… max con **formula
  scalante** (`level`/`prof`/`max(1,mod.cha)`), pip o contatore, spendi/recupera, recupero a riposo
  breve/lungo. **Auto-aggiunte** in base a classe/talento in creazione e level-up; + preset e custom.
- **Ricchezza**: monete (mp/mo/me/ma/mr) + 3 slot di sintonia.
- **Competenze & Lingue** (sezione dedicata): armi, armature & scudi, strumenti, lingue —
  chip editabili, popolate da classe/razza/background in creazione.
- **Pixel art**: sfondi pixel-art SVG (offline) dietro caratteristiche, PF, CA, velocità,
  iniziativa, stat incantesimi (`src/components/PixelArt.tsx`).

## Homebrew & scaling

Oggetti/abilità/attacchi/incantesimi e **effetti dei privilegi** usano **formule** valutate dal motore.
Variabili: `level`, `prof`/`pb`, `cantrip`, `exhaustion`, `mod.str…mod.cha`, `save.str…`,
`mod.spell`, `spellDc`, `spellAtk`, ogni punteggio, e le tue variabili custom (`nome` / `customVars.nome`).

Esempi: `1d8 + mod.str + prof` · `2d6 + mod.dex + ceil(level/2)` · `cantrip*1d10 + mod.spell`.

Nella sezione **Homebrew** puoi gestire le **risorse** custom, un **modificatore PF massimi** (anche
negativo) e gli **override delle formule di calcolo**: sostituisci la formula di CA, iniziativa, PF max,
velocità, CD/attacco incantesimi, punteggi passivi e capacità di carico (vuoto = standard; mostra il
valore attuale). Le formule usano le stesse variabili (`level`, `prof`, `mod.*`, `mod.spell`, `cantrip`…).

**Effetti privilegi** (`Feature.effects`, sezione Tratti): target CA / velocità / iniziativa / PF max,
modo `add` (+) o `base` (= max, per la CA senza armatura). La CA in Panoramica è derivata. Anteprima
live del valore + preset (Difesa senza Armatura Monaco/Barbaro auto-collegata). Quando l'API non dà
la formula meccanica, la imposti a mano.

## Integrazione Open5e (`srdApi.ts`)

[Open5e](https://open5e.com) — free, CORS-open, **SRD 2024 / 5.2**:
- **Autofill** (bottoni "Manuale" in Armi/Incantesimi/Equip): precompila la voce nella scheda.
- **Feature di classe** per livello (`v2/classes?document__key=srd-2024`), sottoclassi, background,
  competenze, equipaggiamento.
- L'API v2 ignora `?search=` → scarico il dataset (piccolo, fisso) una volta, **cache** in memoria,
  filtro per nome client-side.
- Offline / API giù → fallback inserimento manuale. Nessuna dipendenza di rete per usare l'app.

### Cache persistente + prefetch

I dataset SRD sono fissi → vengono **persistiti in IndexedDB** (tabella `srdCache`, Dexie v2): scaricati
una volta, sopravvivono al reload, funzionano offline e **azzerano le chiamate API ripetute** (Open5e è
lento). `fetchAll` legge prima la cache persistente, poi la memoria, poi la rete (e ripersiste).
`SrdPrefetch` (montato nel layout) scarica in background all'avvio i dataset più usati (armi, armature,
incantesimi, classi, background — ~500 voci totali). In **Backup** c'è "Scarica offline" + stato della cache.

> Razze 2024 e gran parte delle condizioni/specie sono **locali** (l'endpoint 2024 manca o è incompleto);
> background/sottoclassi classici sono dati 2014 **etichettati "adattati a 5.5"**.

## Manuale (consultazione)

Sezione sempre disponibile (`src/components/ManualBrowser.tsx`) — sidebar **Riferimento › Manuale**,
bottone **Manuale** in home, rotta `/manual`:
- **Ricerca live** Open5e con filtro categoria: incantesimi (2024), mostri, oggetti magici, regole.
  Risultati espandibili con descrizione.
- **Riferimento rapido offline**: condizioni 2024 (con effetti), sfinimento, specie 2024 (tratti),
  caratteristiche.

## Strumenti DM (rotte globali, dalla home)

Strumenti non legati a un singolo PG, raggiungibili dalla griglia in home:

- **Combattimento / tracker iniziativa** (`/tracker`, `Tracker.tsx`, tabella Dexie `encounters`):
  scontri multipli, aggiungi i PG del party (CA/PF/iniziativa derivati) + mostri dal bestiario +
  combattenti custom. Tira iniziativa per tutti, ordine automatico, round + turno corrente
  evidenziato (avanti/indietro), PF con barra colorata, PF temp, condizioni, morte a 0 PF (teschio).
  Persistito: uno scontro sopravvive a reload e chiusura app.
- **Bestiario** (`/bestiary`, `Bestiary.tsx`): set mostri SRD (Open5e v1, ~330) scaricato una volta e
  **in cache offline**. Ricerca per nome/tipo, stat block completo (caratteristiche, sensi, tratti,
  azioni, reazioni, leggendarie). Bottoni **→ Incontro** (aggiunge al tracker, etichetta duplicati
  "Goblin 2") e **→ Compagno** di un PG (attacchi parsati da `+X to hit (NdM)`).
- **Generatori offline** (`/tools`, `generators.ts` + `Generators.tsx`): tabelle locali, istantanee,
  zero API — PNG completo (tratto/quirk/desiderio/paura/possedimento), nomi per stirpe, ganci di
  trama, dicerie, bottino per fascia, nomi di taverna. Tutto copiabile.

## Dadi liberi (dice pad globale)

FAB fluttuante (`DicePad.tsx`, montato nel layout) su tutte le pagine **tranne** scheda/tracker (che
hanno già il sistema dadi). Pannello con risultato grande, quantità+modificatore, griglia d4–d100 e
campo formula libera (`2d6 + 1d4 + 3`). Passa per `useRoll` (stesso motore dadi).

## Descrizioni incantesimi nella scheda

Gli incantesimi presi dal Manuale/Lista classe salvano già la descrizione (`mapSpell`). In scheda la
card mostra il **testo completo leggibile** (espandi la card). Per incantesimi aggiunti a mano senza
testo c'è **Carica descrizione** → `fetchSpellDetail(name)` cerca nello SRD in cache e riempie
descrizione + scuola/tempo/gittata/durata/concentrazione/rituale mancanti.

## Stampa / PDF scheda

Bottone stampante nell'header della scheda → `window.print()`. `SheetPrint.tsx` rende una scheda
A4 completa di sola stampa (nascosta a schermo via `.print-sheet`/`@media print` in `globals.css`,
con `.screen-only` che nasconde la UV interattiva): identità, caratteristiche+mod+TS, riquadri combattimento,
abilità, attacchi, incantesimi, tratti, equipaggiamento, competenze. Salvabile come PDF dal dialogo di stampa.

## Talenti (`feats2024.ts`)

Dal manuale: **10 Talenti d'Origine** + **36 Talenti General** (liv. 4+), con descrizione e, dove
serve, **effetti auto-applicati** (Tough → PF +2×liv, Alert → iniziativa +competenza, Speedy → velocità +3).
- Quando un **background** concede un talento (`lookupFeat`), il privilegio ottiene descrizione + effetti
  (a creazione parti già a PF pieni).
- Ai **livelli di ASI** il level-up apre un picker: **+2/+1 caratteristica** *oppure* un **Talento General**
  (aggiunge il privilegio con effetti + il suo +1 alla caratteristica scelta).
- Tutti consultabili nel **Manuale** (accordion "Talenti"), offline.

CA e velocità mostrate in Panoramica sono **derivate** (includono gli effetti); le basi si editano in Impostazioni.

## Stato 5.5 (2024)

Matematica e struttura = **5.5**. Voci native 2024: motore, specie, armi (weapon mastery),
background nativi, condizioni, sfinimento, slot. Voci da dati 2014 **riadattati** (l'API non ha
i dati 2024): background/sottoclassi classici. Tutto resta editabile a mano.

Manuale 5.5 completo (PDF dell'utente) usato per trascrivere le specie 2024 in `species2024.ts`.

## Roadmap

- Sync cloud opzionale (condivisione tra device del party) + dadi condivisi
- Tutti i 16 background 2024 + talenti come dati locali (dal manuale)
- Auto-pick incantesimi conosciuti/preparati per gli incantatori
- Altri sistemi GDR (il modello è già predisposto via `system`)
