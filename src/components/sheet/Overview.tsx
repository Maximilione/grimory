"use client";

import { useState } from "react";
import { Heart, Shield, Footprints, Zap, Plus, Minus, Moon, Coffee, ChevronsUp, Dices } from "lucide-react";
import { ABILITIES } from "@/lib/types";
import { ABILITY_NAMES, classByKey } from "@/lib/srd";
import { abilityMod, derive, getClasses } from "@/lib/rules";
import { useRoll } from "@/lib/rollStore";
import { fmt, type SectionProps } from "./common";
import { CombatState } from "./CombatState";
import { Resources } from "./Resources";
import { LevelUpModal } from "./LevelUpModal";
import { PixelWatermark } from "@/components/PixelArt";

export function Overview({ character: c, update }: SectionProps) {
  const d = derive(c);
  const rollD20 = useRoll((s) => s.rollD20);
  const roll = useRoll((s) => s.roll);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  // hit-die healing uses the die of the class with the most levels (best effort)
  const cls = getClasses(c).slice().sort((a, b) => b.level - a.level)[0]
    ? classByKey(getClasses(c).slice().sort((a, b) => b.level - a.level)[0].key)
    : classByKey(c.classKey);

  function hp(delta: number) {
    update((draft) => {
      let dmg = -delta;
      if (dmg > 0 && draft.tempHp > 0) {
        const fromTemp = Math.min(draft.tempHp, dmg);
        draft.tempHp -= fromTemp;
        dmg -= fromTemp;
      }
      draft.currentHp = Math.max(0, Math.min(draft.maxHp, draft.currentHp - dmg));
    });
  }

  function shortRest() {
    update((draft) => {
      // Only pact-magic (warlock) slots and short-rest features recharge.
      if (classByKey(draft.classKey)?.casterType === "pact") {
        const slots = draft.spellSlots ?? {};
        for (const k of Object.keys(slots)) slots[+k].spent = 0;
      }
      draft.features.forEach((f) => {
        if (f.uses && f.uses.recharge === "short") f.uses.spent = 0;
      });
      draft.resources?.forEach((r) => {
        if (r.recharge === "short") r.spent = 0;
      });
    });
  }
  function longRest() {
    update((draft) => {
      draft.currentHp = draft.maxHp;
      draft.tempHp = 0;
      // long rest restores up to half of total hit dice (5e), min 1
      const total = draft.hitDiceTotal ?? draft.level;
      const recovered = Math.max(1, Math.floor(total / 2));
      draft.hitDiceSpent = Math.max(0, (draft.hitDiceSpent ?? 0) - recovered);
      const slots = draft.spellSlots ?? {};
      for (const k of Object.keys(slots)) slots[+k].spent = 0;
      draft.features.forEach((f) => {
        if (f.uses) f.uses.spent = 0;
      });
      draft.resources?.forEach((r) => (r.spent = 0)); // both short & long recharge
      draft.exhaustion = Math.max(0, (draft.exhaustion ?? 0) - 1); // 2024: -1 level on long rest
    });
  }

  function spendHitDie() {
    const total = c.hitDiceTotal ?? c.level;
    const remaining = total - (c.hitDiceSpent ?? 0);
    if (remaining <= 0 || c.currentHp >= c.maxHp) return;
    const die = cls?.hitDie ?? 8;
    const conMod = abilityMod(c.abilities.con);
    const r = roll("Dado vita (cura)", `1d${die} + ${conMod}`);
    if (!r) return;
    update((draft) => {
      draft.hitDiceSpent = (draft.hitDiceSpent ?? 0) + 1;
      draft.currentHp = Math.min(draft.maxHp, draft.currentHp + Math.max(1, r.total));
    });
  }


  return (
    <div className="flex flex-col gap-4">
      {/* HP block */}
      <div className="card p-4 relative overflow-hidden isolate">
        <PixelWatermark name="hp" color="var(--ember)" opacity={0.12} />
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 font-semibold">
            <Heart size={18} style={{ color: "var(--ember)" }} /> Punti Ferita
          </span>
          <span className="text-sm text-[var(--muted)]">
            {c.currentHp} / {d.maxHp}
            {c.tempHp > 0 && <span style={{ color: "var(--accent)" }}> +{c.tempHp}</span>}
          </span>
        </div>
        <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${d.maxHp ? (c.currentHp / d.maxHp) * 100 : 0}%`,
              background: "var(--ember)",
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-danger" onClick={() => hp(-1)}>
            <Minus size={16} /> Danno
          </button>
          <button className="btn" onClick={() => hp(1)} style={{ color: "var(--good)" }}>
            <Plus size={16} /> Cura
          </button>
        </div>
        <div className="flex gap-2 mt-3 text-sm">
          <NumStat label="Temp PF" value={c.tempHp} onChange={(v) => update((d) => (d.tempHp = Math.max(0, v)))} />
          <NumStat label="PF max" value={c.maxHp} onChange={(v) => update((d) => (d.maxHp = Math.max(1, v)))} />
        </div>
      </div>

      {/* combat quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-box justify-center">
          <PixelWatermark name="ac" />
          <span className="text-[11px] uppercase tracking-wide text-[var(--muted)] flex items-center gap-1">
            <Shield size={12} /> CA
          </span>
          <span className="text-2xl font-bold">{d.armorClass}</span>
        </div>
        <div className="stat-box justify-center">
          <PixelWatermark name="speed" />
          <span className="text-[11px] uppercase tracking-wide text-[var(--muted)] flex items-center gap-1">
            <Footprints size={12} /> Velocità
          </span>
          <span className="text-2xl font-bold">{d.speed}</span>
        </div>
        <button className="stat-box justify-center" onClick={() => rollD20("Iniziativa", d.initiative)}>
          <PixelWatermark name="init" />
          <span className="text-[11px] uppercase tracking-wide text-[var(--muted)] flex items-center gap-1">
            <Zap size={12} /> Iniziativa
          </span>
          <span className="text-2xl font-bold flex items-center gap-1" style={{ color: "var(--accent)" }}>
            <Dices size={15} />{fmt(d.initiative)}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <MiniStat label="Competenza" value={fmt(d.prof)} />
        <MiniStat label="Perc. passiva" value={String(d.passivePerception)} />
        <button className="stat-box py-2.5" onClick={spendHitDie} title="Spendi un dado vita per curare">
          <PixelWatermark name="dice" opacity={0.1} />
          <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Dadi Vita</span>
          <span className="text-lg font-bold flex items-center gap-1" style={{ color: "var(--accent)" }}>
            <Heart size={13} />{(c.hitDiceTotal ?? c.level) - (c.hitDiceSpent ?? 0)}/{c.hitDiceTotal ?? c.level}
          </span>
        </button>
      </div>

      {d.spellSaveDc !== undefined && (
        <div className="grid grid-cols-2 gap-3 text-center">
          <MiniStat label="CD Tiro Salvezza" value={String(d.spellSaveDc)} art="spell" />
          <MiniStat label="Tiro Incantesimo" value={fmt(d.spellAttack!)} art="spell" />
        </div>
      )}

      {/* ability mods quick row */}
      <div className="grid grid-cols-6 gap-2">
        {ABILITIES.map((a) => (
          <div key={a} className="stat-box py-2">
            <PixelWatermark name={a} opacity={0.1} />
            <span className="text-[10px] uppercase text-[var(--muted)]">{a}</span>
            <span className="text-lg font-bold">{fmt(d.mods[a])}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="btn" onClick={shortRest}>
          <Coffee size={16} /> Riposo breve
        </button>
        <button className="btn btn-accent" onClick={longRest}>
          <Moon size={16} /> Riposo lungo
        </button>
      </div>

      <button className="btn" onClick={() => setLevelUpOpen(true)} disabled={c.level >= 20}>
        <ChevronsUp size={16} style={{ color: "var(--accent)" }} /> Sali di livello {c.level >= 20 ? "(max)" : `(liv. ${c.level})`}
      </button>

      <Resources character={c} update={update} />

      <CombatState character={c} update={update} />

      {levelUpOpen && <LevelUpModal character={c} update={update} onClose={() => setLevelUpOpen(false)} />}
    </div>
  );
}

function NumStat({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex-1">
      <span className="block text-[11px] uppercase tracking-wide text-[var(--muted)] mb-1">{label}</span>
      <input type="number" inputMode="numeric" className="field text-center" value={value} onChange={(e) => onChange(+e.target.value || 0)} />
    </label>
  );
}

function MiniStat({ label, value, art }: { label: string; value: string; art?: string }) {
  return (
    <div className="stat-box py-2.5">
      {art && <PixelWatermark name={art} opacity={0.1} />}
      <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</span>
      <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>{value}</span>
    </div>
  );
}
