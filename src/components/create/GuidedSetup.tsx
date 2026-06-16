"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Sparkles, Backpack, GraduationCap, Users, BookMarked } from "lucide-react";
import { SKILLS, ABILITY_NAMES } from "@/lib/srd";
import type { Ability } from "@/lib/types";
import {
  fetchClassBuild,
  fetchRaces,
  fetchBackgrounds,
  type ClassBuild,
  type RaceInfo,
  type BackgroundInfo,
} from "@/lib/srdApi";

export interface GuidedResult {
  skills: string[];
  subclass?: string;
  equipItems: string[] | null;
  // race
  raceName?: string;
  raceSpeed?: number;
  raceTraits?: { name: string; desc: string }[];
  raceLanguages?: string;
  // background
  bgName?: string;
  bgSkills?: string[];
  bgFeat?: string;
  bgTool?: string;
  bgAbility?: { plus2?: Ability; plus1?: Ability };
  bgEquip?: string[];
  bgFeature?: { name: string; desc: string };
  bgLanguages?: string;
  // class proficiencies
  classArmor?: string[];
  classWeapons?: string[];
  classTools?: string[];
}

/**
 * Class + race + background guided setup. Pulls everything from the API:
 * class skills/subclass/features/equipment, race traits/speed/languages,
 * background skills/feat/tool/ability boosts/equipment. Builds a level-correct
 * character in one pass.
 */
export function GuidedSetup({
  classKey,
  className,
  level,
  busy,
  onConfirm,
}: {
  classKey: string;
  className: string;
  level: number;
  busy: boolean;
  onConfirm: (r: GuidedResult) => void;
}) {
  const [build, setBuild] = useState<ClassBuild | null>(null);
  const [races, setRaces] = useState<RaceInfo[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundInfo[]>([]);

  const [skills, setSkills] = useState<string[]>([]);
  const [subclass, setSubclass] = useState("");
  const [takeEquip, setTakeEquip] = useState(true);
  const [equipChoice, setEquipChoice] = useState<number[]>([]);
  const [raceKey, setRaceKey] = useState("");
  const [bgKey, setBgKey] = useState("");
  const [plus2, setPlus2] = useState<Ability | "">("");
  const [plus1, setPlus1] = useState<Ability | "">("");

  useEffect(() => {
    let live = true;
    fetchClassBuild(classKey).then((b) => {
      if (!live) return;
      setBuild(b);
      setEquipChoice(b.equipment.map(() => 0));
    });
    fetchRaces().then((r) => live && setRaces(r));
    fetchBackgrounds().then((b) => live && setBackgrounds(b));
    return () => {
      live = false;
    };
  }, [classKey]);

  if (!build) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-[var(--muted)] text-sm">
        <Loader2 size={16} className="animate-spin" /> Carico le basi di {className} dal manuale…
      </div>
    );
  }

  const canPickMore = skills.length < build.skillChoose;
  const showSubclass = level >= build.subclassLevel && build.subclasses.length > 0;
  const race = races.find((r) => r.key === raceKey);
  const bg = backgrounds.find((b) => b.key === bgKey);

  function toggleSkill(key: string) {
    setSkills((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : canPickMore ? [...prev, key] : prev,
    );
  }

  function confirm() {
    const classEquip = takeEquip
      ? build!.equipment.map((line, i) => line.options[equipChoice[i] ?? 0]).filter(Boolean)
      : [];
    const bgEquip = takeEquip ? bg?.equipment ?? [] : [];
    onConfirm({
      skills,
      subclass: subclass || undefined,
      equipItems: takeEquip ? [...classEquip, ...bgEquip] : null,
      raceName: race?.name,
      raceSpeed: race?.speed,
      raceTraits: race?.traits,
      raceLanguages: race?.languages,
      bgName: bg?.name,
      bgSkills: bg?.skills,
      bgFeat: bg?.feat,
      bgTool: bg?.toolProf,
      bgAbility: bg ? { plus2: (plus2 || undefined) as Ability, plus1: (plus1 || undefined) as Ability } : undefined,
      bgEquip,
      bgFeature: bg?.feature,
      bgLanguages: bg?.languages,
      classArmor: build!.armorProfs,
      classWeapons: build!.weaponProfs,
      classTools: build!.toolProfs,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* class skills */}
      <Block icon={<Sparkles size={15} />} title={`Competenze di classe (${skills.length}/${build.skillChoose})`}>
        <p className="text-xs text-[var(--muted)] mb-2">Scegli {build.skillChoose} competenze.</p>
        <Chips
          options={build.skillOptions.map((k) => ({ key: k, label: SKILLS[k]?.label ?? k }))}
          isOn={(k) => skills.includes(k)}
          isDisabled={(k) => !skills.includes(k) && !canPickMore}
          onToggle={toggleSkill}
        />
      </Block>

      {/* subclass */}
      {showSubclass && (
        <Block icon={<GraduationCap size={15} />} title={`Sottoclasse (liv. ${build.subclassLevel})`}>
          <select className="field" value={subclass} onChange={(e) => setSubclass(e.target.value)}>
            <option value="">— scegli —</option>
            <optgroup label="2024 (SRD 5.5)">
              {build.subclasses.filter((s) => s.edition === "2024").map((s) => (
                <option key={s.key} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
            {build.subclasses.some((s) => s.edition === "2014") && (
              <optgroup label="2014 classiche (adattate)">
                {build.subclasses.filter((s) => s.edition === "2014").map((s) => (
                  <option key={s.key} value={s.name}>{s.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </Block>
      )}

      {/* race */}
      <Block icon={<Users size={15} />} title="Razza / Stirpe">
        <select className="field" value={raceKey} onChange={(e) => setRaceKey(e.target.value)}>
          <option value="">— scegli —</option>
          {races.map((r) => (
            <option key={r.key} value={r.key}>{r.name}</option>
          ))}
        </select>
        {race && (
          <div className="mt-2 text-xs text-[var(--muted)]">
            <p>Velocità {race.speed} m · {race.traits.length} tratti razziali aggiunti.</p>
            {race.traits.length > 0 && (
              <p className="mt-1">{race.traits.map((t) => t.name).join(" · ")}</p>
            )}
          </div>
        )}
      </Block>

      {/* background */}
      <Block icon={<BookMarked size={15} />} title="Background">
        <select className="field" value={bgKey} onChange={(e) => { setBgKey(e.target.value); setPlus2(""); setPlus1(""); }}>
          <option value="">— scegli —</option>
          <optgroup label="2024 (SRD 5.5)">
            {backgrounds.filter((b) => b.edition === "2024").map((b) => (
              <option key={b.key} value={b.key}>{b.name}</option>
            ))}
          </optgroup>
          <optgroup label="2014 classici (adattati a 5.5)">
            {backgrounds.filter((b) => b.edition === "2014").map((b) => (
              <option key={b.key} value={b.key}>{b.name}</option>
            ))}
          </optgroup>
        </select>
        {bg && (
          <div className="mt-2 flex flex-col gap-2 text-xs text-[var(--muted)]">
            {bg.edition === "2014" && (
              <p style={{ color: "var(--accent)" }}>Background 2014 adattato a 5.5: scegli tu i +2/+1.</p>
            )}
            <p>
              Competenze: {bg.skills.map((k) => SKILLS[k]?.label ?? k).join(", ") || "—"}
              {bg.feat && ` · Talento: ${bg.feat}`}
              {bg.toolProf && ` · Strumenti: ${bg.toolProf}`}
            </p>
            {bg.feature && <p>Privilegio: <span className="text-[var(--text)]">{bg.feature.name}</span></p>}
            {bg.languages && <p>Lingue: {bg.languages}</p>}
            {bg.abilityOptions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span>Aumenti (2024):</span>
                <label className="flex items-center gap-1">
                  +2
                  <select className="field py-1 px-2 w-auto text-xs" value={plus2} onChange={(e) => setPlus2(e.target.value as Ability)}>
                    <option value="">—</option>
                    {bg.abilityOptions.map((a) => (
                      <option key={a} value={a}>{ABILITY_NAMES[a as Ability]}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  +1
                  <select className="field py-1 px-2 w-auto text-xs" value={plus1} onChange={(e) => setPlus1(e.target.value as Ability)}>
                    <option value="">—</option>
                    {bg.abilityOptions.filter((a) => a !== plus2).map((a) => (
                      <option key={a} value={a}>{ABILITY_NAMES[a as Ability]}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        )}
      </Block>

      {/* equipment */}
      {(build.equipment.length > 0 || (bg?.equipment.length ?? 0) > 0) && (
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-2">
            <input type="checkbox" className="accent-[var(--accent)] size-4" checked={takeEquip} onChange={(e) => setTakeEquip(e.target.checked)} />
            <Backpack size={15} style={{ color: "var(--accent)" }} /> Equipaggiamento base (classe + background)
          </label>
          {takeEquip && (
            <div className="flex flex-col gap-2 pl-1">
              {build.equipment.map((line, i) =>
                line.options.length > 1 ? (
                  <div key={i} className="flex flex-wrap gap-2 items-center">
                    {line.options.map((opt, j) => (
                      <button
                        key={j}
                        onClick={() => setEquipChoice((prev) => prev.map((v, k) => (k === i ? j : v)))}
                        className="text-sm px-3 py-1.5 rounded-lg border"
                        style={{
                          borderColor: equipChoice[i] === j ? "var(--accent)" : "var(--border)",
                          background: equipChoice[i] === j ? "var(--accent-soft)" : "transparent",
                          color: equipChoice[i] === j ? "var(--accent)" : "var(--text)",
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p key={i} className="text-sm text-[var(--muted)] flex items-center gap-2">
                    <Check size={14} style={{ color: "var(--good)" }} /> {line.options[0]}
                  </p>
                ),
              )}
              {bg?.equipment.map((e, i) => (
                <p key={`bg${i}`} className="text-sm text-[var(--muted)] flex items-center gap-2">
                  <Check size={14} style={{ color: "var(--good)" }} /> {e} <span className="opacity-60">(background)</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <button className="btn btn-accent py-3" onClick={confirm} disabled={busy}>
        {busy ? "Creazione…" : "Crea scheda"}
      </button>
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2">
        <span style={{ color: "var(--accent)" }}>{icon}</span> {title}
      </p>
      {children}
    </div>
  );
}

function Chips({
  options,
  isOn,
  isDisabled,
  onToggle,
}: {
  options: { key: string; label: string }[];
  isOn: (k: string) => boolean;
  isDisabled: (k: string) => boolean;
  onToggle: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = isOn(o.key);
        return (
          <button
            key={o.key}
            onClick={() => onToggle(o.key)}
            disabled={isDisabled(o.key)}
            className="text-sm px-3 py-1.5 rounded-full border transition-colors disabled:opacity-35"
            style={{
              borderColor: on ? "var(--accent)" : "var(--border)",
              background: on ? "var(--accent-soft)" : "transparent",
              color: on ? "var(--accent)" : "var(--text)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
