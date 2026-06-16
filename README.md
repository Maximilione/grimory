# Grimorio — Schede GDR

App mobile (PWA) per gestire schede personaggio **D&D 5e (2024)**. Installabile su
iOS e Android senza store né account sviluppatore: apri il link → "Aggiungi a Home".
Funziona offline. **I dati vivono sul dispositivo** (IndexedDB) + backup automatico
+ export/import JSON.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind v4** (tema arcano dark, mobile-first)
- **Dexie** (IndexedDB) — storage local-first reattivo
- **zustand** — store del lanciatore di dadi
- PWA: `app/manifest.ts` + `public/sw.js` (service worker offline)

Output build = 100% statico → deployabile su qualsiasi host statico.

## Comandi (Yarn)

```bash
yarn dev      # sviluppo (http://localhost:3000)
yarn build    # build produzione (statica)
yarn start    # serve la build
```

> ⚠️ Non lanciare `yarn build` mentre `yarn dev` gira sulla stessa cartella:
> condividono `.next` e si pestano i piedi (il dev server muore).

## Architettura

Tutto ciò che "scala con stat/livello" è **derivato**, mai salvato:

- `src/lib/types.ts` — modello dati `Character` (system-agnostic dove possibile)
- `src/lib/srd.ts` — dati 5e 2024: classi, skill, slot incantesimi, cantrip scaling
- `src/lib/rules.ts` — motore: modificatori, competenza, CD/attacco incantesimi,
  attacco armi, capacità di carico + costruzione delle variabili per le formule
- `src/lib/dice.ts` — parser/evaluator sicuro (no `eval`): aritmetica, variabili,
  funzioni (`floor/ceil/min/max…`) e dadi `NdM`. Tre modalità: tira / media / formula
- `src/lib/db.ts` — Dexie + factory personaggio + snapshot localStorage
- `src/lib/backup.ts` — export/import JSON

UI: `src/app/sheet/page.tsx` è la shell con sidebar a gruppi; ogni sezione è in
`src/components/sheet/`.

## Homebrew & scaling

Oggetti/abilità/attacchi/incantesimi possono usare **formule** valutate dal motore.
Variabili disponibili: `level`, `prof`/`pb`, `cantrip`, `mod.str…mod.cha`,
`save.str…`, `mod.spell`, `spellDc`, `spellAtk`, ogni punteggio (`str`, `dex`, …),
e le tue variabili custom (sezione **Homebrew**) richiamabili come `nome` o
`customVars.nome`.

Esempi: `1d8 + mod.str + prof` · `2d6 + mod.dex + ceil(level/2)` ·
`cantrip*1d10 + mod.spell` · `prof` (usi/riposo).

## Persistenza dei dati (importante)

I dati sono salvati in **IndexedDB**, legati all'**origine** (dominio + porta).
- In sviluppo la porta può cambiare → sembra "vuoto" su una porta diversa: normale.
- In produzione, su un URL fisso, i dati persistono tra sessioni e dopo l'install.
- Backup automatico mirror in `localStorage` (ultime 5 versioni) + **Esporta backup**
  per un file JSON portabile.

## Creazione guidata

Wizard in 2 fasi (`src/app/create/page.tsx` + `src/components/create/GuidedSetup.tsx`):
1. **Basi**: nome, classe, livello, razza/background, caratteristiche con **tira & assegna**
   (tira 6 valori 4d6-scarta-minore → drag-and-drop o tap sulle stat; max 2 tiri poi alert).
2. **Configura `<classe>`** (se hai scelto una classe) — tutto dall'API:
   - **Competenze di classe**: lista e numero giusti (parsati da `prof_skills` Open5e v1).
   - **Sottoclasse**: se il livello la concede (2024: liv. 3) — sottoclassi 2024 SRD + quelle
     classiche 2014 (archetypes v1) adattate, raggruppate per edizione.
   - **Caratteristiche**: tira & assegna, **Array standard** [15,14,13,12,10,8], o **🎲 Casuale**
     (classe + tiri auto-assegnati alle primarie).
   - **Razza/Stirpe** (Open5e v1, razze SRD core): imposta velocità, aggiunge i tratti
     razziali come privilegi (scurovisione ecc.), salva le lingue nelle note.
   - **Background**: i 4 nativi 2024 (v2 SRD) + i classici 2014 (v1) **adattati a 5.5** — il menù
     li raggruppa per edizione. 2024: competenze, talento, strumenti, **+2/+1** tra le abilità ammesse.
     2014 adattati: competenze + privilegio narrativo mantenuti, e un **+2/+1 in stile 2024** sulle
     abilità delle loro competenze (lo scegli tu).
   - **Equipaggiamento base** (opzionale): classe + background, scelte a/b + oggetti fissi.
     L'equip viene **classificato** (`classifyEquipment`): le armi finiscono in Armi (attacchi
     tirabili), l'armatura imposta la **CA** (+2 con scudo), il resto va in inventario.
   - I **privilegi di classe per ogni livello fino al tuo** vengono aggiunti automaticamente.

`fetchClassBuild` / `fetchClassFeatures` / `fetchRaces` / `fetchBackgrounds` in `src/lib/srdApi.ts`.

## Privilegi che modificano le statistiche

I privilegi/tratti possono avere **effetti** (`Feature.effects`) che il motore applica:
target CA / velocità / iniziativa / PF max, in modalità `add` (+) o `base` (= max, per la CA
senza armatura). La CA in Panoramica è derivata (include gli effetti). Effetti noti come
**Difesa senza Armatura** (Monaco → 10+Des+Sag, Barbaro → 10+Des+Cos) sono **auto-collegati**
in creazione/level-up (`featureEffects`); editor + preset nella sezione Tratti.

## Scelte dei privilegi (Expertise, ASI)

Privilegi che concedono una scelta vengono gestiti al level-up: **Expertise** apre un selettore
delle competenze da raddoppiare (→ esperto); **Aumento Caratteristiche/Talento** viene segnalato
ai livelli fissi. (Fix: prima Expertise veniva aggiunto senza farti scegliere.)

## Funzionalità di gioco

- **Tiri**: prove, TS, abilità, attacchi, danni. Dado sicuro (no `eval`), toast + **cronologia** (icona in basso a destra).
- **Vantaggio / svantaggio**: pillola sticky in basso a sinistra; tutti i d20 la rispettano (tiene alto/basso, crit/fumble sul dado tenuto).
- **Critico / fallimento**: nat 20 → burst oro "CRITICO!"; nat 1 → shake rosso "FALLIMENTO!". Rispetta `prefers-reduced-motion`.
- **Attacchi guidati**: prima il colpire, poi i danni si sbloccano; al crit i dadi danno raddoppiano (`critDice`). Sottosezione **Incantesimi rapidi**: cantrip/incantesimi con danno → tiro + danno diretti.
- **Stato combattimento** (Panoramica): tiri salvezza morte (3/3 + roll auto), condizioni 2024, **sfinimento** (−2×liv. ai d20 e CD, applicato in automatico nel motore), ispirazione, concentrazione + TS Costituzione.
- **Riposi**: breve = solo slot pact (warlock) + privilegi a riposo breve; lungo = PF pieni, slot, metà dadi vita, −1 sfinimento. Spesa dado vita per curare (tap su "Dadi Vita").
- **Level-up guidato + multiclasse**: scegli quale classe salire (o aggiungine una). PF medi, slot e dadi vita ricalcolati. I **privilegi di classe per livello** sono presi live da Open5e (SRD 2024) e aggiunti in Tratti; i livelli di **Aumento Caratteristiche / Talento** (es. 4/8/12/16/19, +Guerriero/Ladro) vengono segnalati. Slot incantesimi **multiclasse** (caster level combinato full + half/2 + third/3, pact warlock a parte).
- **Ricchezza**: monete (mp/mo/me/ma/mr) + 3 slot di sintonia (Equipaggiamento).
- **Competenze & Lingue** (sezione dedicata): armi, armature & scudi, strumenti, lingue —
  chip aggiungibili/rimovibili. Popolate in automatico da classe/razza/background in creazione.

## Autofill dal manuale (Open5e)

Sezioni Armi / Incantesimi / Equipaggiamento hanno un bottone **Manuale** che cerca
live su [Open5e](https://open5e.com) (free, CORS-open, **SRD 2024 / 5.2**) e
**precompila** la voce nella scheda (es. Longsword → 1d8 Slashing, proprietà incluse;
bonus colpire/danno poi calcolati dal motore). `src/lib/srdApi.ts`:

- Armi/Incantesimi: `GET v2/{weapons,spells}/?document__key=srd-2024` — l'API ignora
  `?search=`, quindi scarico il dataset (piccolo, fisso) una volta, lo **cache** in
  memoria e filtro per nome client-side (istantaneo dopo il primo fetch).
- Oggetti magici: `GET v1/magicitems/?search=` (pool grande, search server-side ok).
- Offline / API down → `catch` ritorna `[]`, fallback inserimento manuale. Nessuna
  dipendenza di rete per usare l'app.

## Roadmap

- Sync cloud opzionale (condivisione tra device del party) + dadi condivisi
- Altri sistemi GDR (il modello è già predisposto via `system`)
- Talenti da catalogo + applicazione ASI in-app (ora segnalati)
- Auto-pick incantesimi conosciuti/preparati per gli incantatori (ora manuale via Manuale)
# dnd-sheets
