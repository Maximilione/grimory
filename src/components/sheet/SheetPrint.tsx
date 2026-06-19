"use client";

import type { Character } from "@/lib/types";
import { ABILITIES } from "@/lib/types";
import { ABILITY_NAMES, SKILLS, classByKey } from "@/lib/srd";
import { derive, getClasses } from "@/lib/rules";

const sign = (n: number) => `${n >= 0 ? "+" : ""}${n}`;

/** Print-only full character summary. Hidden on screen, laid out for A4 paper. */
export function SheetPrint({ c }: { c: Character }) {
  const d = derive(c);
  const classList = getClasses(c);
  const classLabel = classList.length
    ? classList.map((e) => `${classByKey(e.key)?.name ?? e.key} ${e.level}`).join(" / ")
    : c.className ?? "";

  return (
    <div className="print-sheet">
      <header className="ps-head">
        <h1>{c.name}</h1>
        <p>{[classLabel, c.race, c.background].filter(Boolean).join(" · ")} · Liv. {c.level}</p>
      </header>

      <section className="ps-stats">
        {ABILITIES.map((a) => (
          <div key={a} className="ps-stat">
            <span className="ps-stat-name">{ABILITY_NAMES[a]}</span>
            <span className="ps-stat-score">{c.abilities[a]}</span>
            <span className="ps-stat-mod">{sign(d.mods[a])}</span>
            <span className="ps-stat-save">TS {sign(d.saves[a].mod)}{d.saves[a].proficient ? "•" : ""}</span>
          </div>
        ))}
      </section>

      <section className="ps-combat">
        <Box label="CA" v={d.armorClass} />
        <Box label="PF" v={`${c.currentHp}/${d.maxHp}`} />
        <Box label="Velocità" v={`${d.speed} m`} />
        <Box label="Iniziativa" v={sign(d.initiative)} />
        <Box label="Competenza" v={sign(d.prof)} />
        <Box label="Perc. passiva" v={d.passivePerception} />
        {d.spellSaveDc != null && <Box label="CD incant." v={d.spellSaveDc} />}
        {d.spellAttack != null && <Box label="Attacco inc." v={sign(d.spellAttack)} />}
      </section>

      <div className="ps-cols">
        <section className="ps-block">
          <h2>Abilità</h2>
          <ul className="ps-skills">
            {Object.entries(SKILLS).map(([k, def]) => {
              const s = d.skills[k];
              return (
                <li key={k}>
                  <span>{s.tier === "expert" ? "◆" : s.tier === "prof" ? "•" : "○"} {def.label}</span>
                  <span>{sign(s.mod)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="ps-col-right">
          {(c.weapons?.length || c.attacks?.length) ? (
            <section className="ps-block">
              <h2>Attacchi</h2>
              <ul className="ps-list">
                {c.weapons?.map((w) => <li key={w.id}>{w.name} {w.damage ? `— ${w.damage}` : ""}</li>)}
                {c.attacks?.map((a) => <li key={a.id}>{a.name} {a.damage ? `— ${a.damage}` : ""}</li>)}
              </ul>
            </section>
          ) : null}

          {c.spells?.length ? (
            <section className="ps-block">
              <h2>Incantesimi</h2>
              <ul className="ps-list">
                {[...c.spells].sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((s) => (
                  <li key={s.id}>{s.level ? `L${s.level}` : "Tr"} · {s.name}{s.prepared ? " (prep.)" : ""}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {c.features?.length ? (
        <section className="ps-block">
          <h2>Tratti & Privilegi</h2>
          <ul className="ps-list ps-inline">{c.features.map((f) => <li key={f.id}>{f.name}</li>)}</ul>
        </section>
      ) : null}

      {c.inventory?.length ? (
        <section className="ps-block">
          <h2>Equipaggiamento</h2>
          <ul className="ps-list ps-inline">{c.inventory.map((i) => <li key={i.id}>{i.name}{i.qty && i.qty > 1 ? ` ×${i.qty}` : ""}</li>)}</ul>
        </section>
      ) : null}

      {(c.languages?.length || c.weaponProfs?.length || c.armorProfs?.length || c.toolProfs?.length) ? (
        <section className="ps-block">
          <h2>Competenze & Lingue</h2>
          {c.languages?.length ? <p><b>Lingue:</b> {c.languages.join(", ")}</p> : null}
          {c.weaponProfs?.length ? <p><b>Armi:</b> {c.weaponProfs.join(", ")}</p> : null}
          {c.armorProfs?.length ? <p><b>Armature:</b> {c.armorProfs.join(", ")}</p> : null}
          {c.toolProfs?.length ? <p><b>Strumenti:</b> {c.toolProfs.join(", ")}</p> : null}
        </section>
      ) : null}
    </div>
  );
}

function Box({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div className="ps-box">
      <span className="ps-box-v">{v}</span>
      <span className="ps-box-l">{label}</span>
    </div>
  );
}
