"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Dices } from "lucide-react";
import { ABILITIES, type Ability, type AbilityScores, type Feature, type InventoryItem, type SkillProf, type Weapon, type Resource } from "@/lib/types";
import { classResources, featResources } from "@/lib/resources";
import { ABILITY_NAMES, CLASSES, classByKey, spellSlotsFor, featureEffects } from "@/lib/srd";
import { abilityMod } from "@/lib/rules";
import { evalFormula } from "@/lib/dice";
import { createCharacter, emptyAbilities, uid } from "@/lib/db";
import { fetchClassFeatures, classifyEquipment } from "@/lib/srdApi";
import { lookupFeat } from "@/lib/feats2024";
import { GuidedSetup, type GuidedResult } from "@/components/create/GuidedSetup";
import { PixelWatermark } from "@/components/PixelArt";

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [classKey, setClassKey] = useState("");
  const [level, setLevel] = useState(1);
  const [abilities, setAbilities] = useState<AbilityScores>(emptyAbilities());
  const [busy, setBusy] = useState(false);
  // roll-and-assign state
  const [pool, setPool] = useState<number[]>([]); // unassigned rolled values
  const [fromPool, setFromPool] = useState<Set<Ability>>(new Set());
  const [rollCount, setRollCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null); // selected pool index (mobile tap)
  const [phase, setPhase] = useState<"basics" | "guided">("basics");

  const cls = classByKey(classKey);

  function setAbility(a: Ability, v: number) {
    setAbilities((prev) => ({ ...prev, [a]: Math.max(1, Math.min(30, v || 0)) }));
    setFromPool((prev) => {
      const n = new Set(prev);
      n.delete(a); // manual edit detaches it from the pool bookkeeping
      return n;
    });
  }

  function rollPool() {
    if (rollCount >= 2) {
      alert("👀 Ehi, non fare il furbetto! Hai già tirato 2 volte. Tieni questi.");
      return;
    }
    const values = ABILITIES.map(() => {
      const r = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((x, y) => y - x);
      return r[0] + r[1] + r[2]; // 4d6 drop lowest
    }).sort((x, y) => y - x);
    setPool(values);
    setAbilities(emptyAbilities());
    setFromPool(new Set());
    setSelected(null);
    setRollCount((c) => c + 1);
  }

  function loadStandardArray() {
    setPool([15, 14, 13, 12, 10, 8]);
    setAbilities(emptyAbilities());
    setFromPool(new Set());
    setSelected(null);
  }

  /** Auto-assign a sorted value list to abilities, best scores to the class's primary. */
  function autoAssign(values: number[], primary: Ability[]) {
    const sorted = [...values].sort((x, y) => y - x);
    const order: Ability[] = [...primary, ...ABILITIES.filter((a) => !primary.includes(a))];
    const next = emptyAbilities();
    order.forEach((a, i) => { if (sorted[i] != null) next[a] = sorted[i]; });
    setAbilities(next);
    setFromPool(new Set(order.slice(0, sorted.length)));
    setPool([]);
    setSelected(null);
  }

  function randomize() {
    const NAMES = ["Thoran", "Lyra", "Brakka", "Eldwin", "Mirel", "Garrick", "Sylria", "Dorn", "Vesper", "Kael"];
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const cd = pick(CLASSES);
    setClassKey(cd.key);
    setName(pick(NAMES));
    // roll 4d6-drop-lowest x6, assign best to class primary
    const rolled = ABILITIES.map(() => {
      const r = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((x, y) => y - x);
      return r[0] + r[1] + r[2];
    });
    autoAssign(rolled, cd.primary);
    setRollCount(1);
  }

  /** Assign pool[poolIdx] to ability a; returns a's previous pooled value to the pool. */
  function assign(poolIdx: number, a: Ability) {
    if (poolIdx < 0 || poolIdx >= pool.length) return;
    const value = pool[poolIdx];
    setPool((prev) => {
      const next = prev.filter((_, i) => i !== poolIdx);
      if (fromPool.has(a)) next.push(abilities[a]); // give back the displaced value
      return next.sort((x, y) => y - x);
    });
    setAbilities((prev) => ({ ...prev, [a]: value }));
    setFromPool((prev) => new Set(prev).add(a));
    setSelected(null);
  }

  /** Tap an assigned box to send its value back to the pool. */
  function unassign(a: Ability) {
    if (!fromPool.has(a)) return;
    setPool((prev) => [...prev, abilities[a]].sort((x, y) => y - x));
    setAbilities((prev) => ({ ...prev, [a]: 10 }));
    setFromPool((prev) => {
      const n = new Set(prev);
      n.delete(a);
      return n;
    });
  }

  async function submit(guided?: GuidedResult) {
    setBusy(true);

    // apply background ability boosts (2024) before deriving HP
    const finalAbilities = { ...abilities };
    if (guided?.bgAbility?.plus2) finalAbilities[guided.bgAbility.plus2] += 2;
    if (guided?.bgAbility?.plus1) finalAbilities[guided.bgAbility.plus1] += 1;

    const conMod = abilityMod(finalAbilities.con);
    const hitDie = cls?.hitDie ?? 8;
    const perLevel = Math.floor(hitDie / 2) + 1 + conMod;
    const maxHp = Math.max(1, hitDie + conMod + (level - 1) * perLevel);

    const savingThrowProf: Partial<Record<Ability, boolean>> = {};
    cls?.savingThrows.forEach((a) => (savingThrowProf[a] = true));

    const slotsRaw = cls ? spellSlotsFor(cls.casterType, level) : {};
    const spellSlots: Record<number, { max: number; spent: number }> = {};
    for (const [lvl, max] of Object.entries(slotsRaw)) spellSlots[+lvl] = { max, spent: 0 };

    const features: Feature[] = [];
    const skills: SkillProf = {};
    const inventory: InventoryItem[] = [];
    const weapons: Weapon[] = [];
    const resources: Resource[] = cls ? classResources(cls.key) : [];
    const languages: string[] = [];
    const toolProfs: string[] = [];
    const armorProfs: string[] = [];
    const weaponProfs: string[] = [];
    const splitList = (s?: string) => (s ? s.split(/,|\band\b/i).map((x) => x.trim()).filter(Boolean) : []);
    let subclass: string | undefined;
    let speed = 9;
    let armorClass = 10;
    let raceName: string | undefined;
    let bgName: string | undefined;

    if (guided && cls) {
      // class: skills, subclass, features 1..level, equipment
      guided.skills.forEach((k) => (skills[k] = "prof"));
      subclass = guided.subclass;
      const featMap = await fetchClassFeatures(cls.key);
      const seen = new Set<string>();
      for (let l = 1; l <= level; l++) {
        for (const f of featMap[l] ?? []) {
          if (f.isASI || seen.has(f.name)) continue;
          seen.add(f.name);
          const effects = featureEffects(f.name, cls.key);
          features.push({ id: uid(), name: f.name, source: cls.name, description: f.desc, ...(effects.length ? { effects } : {}) });
        }
      }
      // subclass features (the subclass is its own SRD entry, features keyed by class level)
      if (subclass) {
        const subMap = await fetchClassFeatures(subclass);
        for (let l = 1; l <= level; l++) {
          for (const f of subMap[l] ?? []) {
            if (f.isASI || seen.has(f.name)) continue;
            seen.add(f.name);
            features.push({ id: uid(), name: f.name, source: `${cls.name} (${subclass})`, description: f.desc });
          }
        }
      }
      // resolve starting equipment into usable weapons / AC / inventory
      if (guided.equipItems?.length) {
        const cls2 = await classifyEquipment(guided.equipItems, abilityMod(finalAbilities.dex));
        cls2.weapons.forEach((w) => weapons.push({ ...w, id: uid() }));
        cls2.items.forEach((nm) => inventory.push({ id: uid(), name: nm, qty: 1 }));
        if (cls2.armorClass) armorClass = cls2.armorClass;
      }

      // class proficiencies
      armorProfs.push(...(guided.classArmor ?? []));
      weaponProfs.push(...(guided.classWeapons ?? []));
      toolProfs.push(...(guided.classTools ?? []));
      // race: speed, traits as features, languages
      if (guided.raceName) {
        raceName = guided.raceName;
        if (guided.raceSpeed) speed = guided.raceSpeed;
        (guided.raceTraits ?? []).forEach((t) =>
          features.push({ id: uid(), name: t.name, source: guided.raceName, description: t.desc }),
        );
        languages.push(...splitList(guided.raceLanguages));
      }
      // background: skills, feat, tool/language profs (abilities already applied above)
      if (guided.bgName) {
        bgName = guided.bgName;
        (guided.bgSkills ?? []).forEach((k) => (skills[k] = "prof"));
        if (guided.bgFeat) {
          const fi = lookupFeat(guided.bgFeat);
          features.push({
            id: uid(),
            name: guided.bgFeat,
            source: `Background: ${guided.bgName}`,
            description: fi?.desc,
            ref: guided.bgFeat,
            ...(fi?.effects ? { effects: fi.effects } : {}),
          });
          resources.push(...featResources(guided.bgFeat));
        }
        if (guided.bgFeature) features.push({ id: uid(), name: guided.bgFeature.name, source: `Background: ${guided.bgName}`, description: guided.bgFeature.desc, ref: guided.bgFeature.name });
        toolProfs.push(...splitList(guided.bgTool));
        languages.push(...splitList(guided.bgLanguages));
      }
    }

    // start at full HP including max-HP effects (e.g. Tough +2×liv)
    const hpFromEffects = features
      .flatMap((f) => f.effects ?? [])
      .filter((e) => e.target === "maxHp")
      .reduce((s, e) => {
        try { return s + evalFormula(e.formula, { level }); } catch { return s; }
      }, 0);

    const c = await createCharacter({
      name: name.trim() || "Senza nome",
      classKey: cls?.key,
      className: cls?.name,
      classes: cls ? [{ key: cls.key, subclass, level }] : [],
      subclass,
      level,
      race: raceName,
      background: bgName,
      speed,
      abilities: finalAbilities,
      skills,
      savingThrowProf,
      spellcastingAbility: cls?.spellcasting,
      spellSlots,
      features,
      weapons,
      inventory,
      resources,
      armorClass,
      languages: [...new Set(languages)],
      toolProfs: [...new Set(toolProfs)],
      armorProfs,
      weaponProfs,
      maxHp,
      currentHp: maxHp + hpFromEffects,
      hitDiceTotal: level,
      hitDiceSpent: 0,
    });
    router.replace(`/sheet?c=${c.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 py-3 mb-2">
        <Link href="/" className="btn btn-ghost px-2">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold flex-1">
          {phase === "guided" ? `Configura ${cls?.name}` : "Nuovo personaggio"}
        </h1>
        {phase === "basics" && (
          <button className="btn btn-ghost text-sm" onClick={randomize} title="Classe e caratteristiche casuali">
            <Dices size={15} /> Casuale
          </button>
        )}
      </div>

      {phase === "guided" && cls ? (
        <>
          <button className="btn btn-ghost text-sm mb-4 self-start" onClick={() => setPhase("basics")}>
            <ChevronLeft size={16} /> Modifica basi
          </button>
          <GuidedSetup
            classKey={cls.key}
            className={cls.name}
            level={level}
            busy={busy}
            onConfirm={(r) => submit(r)}
          />
        </>
      ) : (
      <div className="flex flex-col gap-5">
        <Field label="Nome">
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Thoran" autoFocus />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Classe">
            <select className="field" value={classKey} onChange={(e) => setClassKey(e.target.value)}>
              <option value="">—</option>
              {CLASSES.map((c) => (
                <option key={c.key} value={c.key}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Livello">
            <input
              type="number"
              inputMode="numeric"
              className="field"
              value={level}
              min={1}
              max={20}
              onChange={(e) => setLevel(Math.max(1, Math.min(20, +e.target.value || 1)))}
            />
          </Field>
        </div>

        {classKey && (
          <p className="text-xs text-[var(--muted)] -mt-2">
            Razza, background, competenze ed equip li scegli al passo successivo (dal manuale).
          </p>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Caratteristiche</span>
            <div className="flex gap-2">
              <button className="btn btn-ghost text-xs py-1" onClick={loadStandardArray} title="15 14 13 12 10 8">
                Array standard
              </button>
              <button className="btn btn-ghost text-xs py-1" onClick={rollPool}>
                <Dices size={14} />{" "}
                {rollCount === 0 ? "Tira (4d6)" : rollCount === 1 ? "Ritira (1 rimasto)" : "Ritira 🔒"}
              </button>
            </div>
          </div>

          {/* pool of rolled values: drag onto a stat, or tap to select then tap a stat */}
          {pool.length > 0 && (
            <div className="card p-3 mb-3">
              <p className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-2">
                Trascina (o tocca) un valore sulla caratteristica
              </p>
              <div className="flex flex-wrap gap-2">
                {pool.map((v, i) => (
                  <button
                    key={i}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                    onClick={() => setSelected(selected === i ? null : i)}
                    className="size-11 rounded-lg font-bold text-lg grid place-items-center cursor-grab active:cursor-grabbing"
                    style={{
                      background: selected === i ? "var(--accent)" : "var(--surface-2)",
                      color: selected === i ? "#1a1407" : "var(--text)",
                      border: `1px solid ${selected === i ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {ABILITIES.map((a) => {
              const mod = abilityMod(abilities[a]);
              const assigned = fromPool.has(a);
              const armed = selected !== null;
              return (
                <div
                  key={a}
                  className="stat-box transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const idx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                    if (!Number.isNaN(idx)) assign(idx, a);
                  }}
                  onClick={() => {
                    if (selected !== null) assign(selected, a);
                    else if (assigned) unassign(a);
                  }}
                  style={{
                    borderColor: armed ? "var(--accent)" : assigned ? "var(--accent-soft)" : "var(--border)",
                    cursor: armed || assigned ? "pointer" : "default",
                  }}
                >
                  <PixelWatermark name={a} opacity={0.12} />
                  <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{ABILITY_NAMES[a]}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="bg-transparent text-center text-2xl font-bold w-full outline-none"
                    value={abilities[a]}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setAbility(a, +e.target.value)}
                  />
                  <span className="text-xs" style={{ color: "var(--accent)" }}>
                    {mod >= 0 ? `+${mod}` : mod}
                  </span>
                </div>
              );
            })}
          </div>
          {pool.length > 0 && (
            <p className="text-[11px] text-[var(--muted)] mt-2">
              {pool.length} valori da assegnare. Tocca una stat assegnata per rimandare il valore al pool.
            </p>
          )}
        </div>

        {cls && (
          <p className="text-xs text-[var(--muted)]">
            Tiri salvezza competenti: {cls.savingThrows.map((s) => ABILITY_NAMES[s]).join(", ")}.
            {cls.spellcasting && ` Incantatore (${ABILITY_NAMES[cls.spellcasting]}).`} PF e slot
            calcolati in automatico — modificabili dopo.
          </p>
        )}
      </div>
      )}

      {phase === "basics" && (
        <div className="fixed inset-x-0 bottom-0 p-4 bg-[var(--bg)]/95 border-t border-[var(--border)] backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <button
              className="btn btn-accent w-full py-3"
              onClick={() => (cls ? setPhase("guided") : submit())}
              disabled={busy}
            >
              {busy ? "Creazione…" : cls ? "Continua → competenze & equip" : "Crea scheda"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--muted)] mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
