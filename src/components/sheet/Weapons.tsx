"use client";

import { useState } from "react";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { uid } from "@/lib/db";
import { weaponAttack } from "@/lib/rules";
import type { Ability, Weapon } from "@/lib/types";
import { ABILITY_NAMES } from "@/lib/srd";
import { searchWeapons, withId } from "@/lib/srdApi";
import { SectionHeader, ItemCard, Empty, RefLink, fmt, type SectionProps } from "./common";
import { SrdSearch } from "./SrdSearch";

export function Weapons({ character: c, update }: SectionProps) {
  const [search, setSearch] = useState(false);
  function add() {
    update((d) =>
      d.weapons.unshift({
        id: uid(),
        name: "Nuova arma",
        damage: "1d6",
        damageType: "taglienti",
        ability: "auto",
        proficient: true,
      }),
    );
  }
  function edit(id: string, patch: Partial<Weapon>) {
    update((d) => {
      const w = d.weapons.find((x) => x.id === id);
      if (w) Object.assign(w, patch);
    });
  }
  function remove(id: string) {
    update((d) => (d.weapons = d.weapons.filter((x) => x.id !== id)));
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Armi"
        desc="Bonus colpire e danno calcolati da caratteristica + competenza."
        action={
          <div className="flex gap-2">
            <button className="btn" onClick={() => setSearch(true)}>
              <BookOpen size={16} /> Manuale
            </button>
            <button className="btn btn-accent" onClick={add}>
              <Plus size={16} /> Arma
            </button>
          </div>
        }
      />
      {search && (
        <SrdSearch
          title="Armi — SRD 2024"
          fetcher={searchWeapons}
          onPick={(built) => update((d) => d.weapons.unshift(withId(built)))}
          onClose={() => setSearch(false)}
        />
      )}
      {c.weapons.length === 0 && <Empty>Nessuna arma. Aggiungine una.</Empty>}
      {c.weapons.map((w) => {
        const atk = weaponAttack(c, w);
        return (
          <ItemCard
            key={w.id}
            title={
              <span className="flex items-center gap-2">
                {w.name}
                {w.homebrew && <Tag>HB</Tag>}
              </span>
            }
            meta={`Colpire ${fmt(atk.toHit)} · Danno ${atk.damage} ${w.damageType}`}
          >
            <div className="grid grid-cols-2 gap-3">
              <L label="Nome">
                <input className="field" value={w.name} onChange={(e) => edit(w.id, { name: e.target.value })} />
              </L>
              <L label="Caratteristica">
                <select className="field" value={w.ability} onChange={(e) => edit(w.id, { ability: e.target.value as Ability | "auto" })}>
                  <option value="auto">Auto (finesse/distanza)</option>
                  {(["str", "dex", "con", "int", "wis", "cha"] as Ability[]).map((a) => (
                    <option key={a} value={a}>{ABILITY_NAMES[a]}</option>
                  ))}
                </select>
              </L>
              <L label="Dado danno">
                <input className="field" value={w.damage} onChange={(e) => edit(w.id, { damage: e.target.value })} placeholder="1d8" />
              </L>
              <L label="Tipo danno">
                <input className="field" value={w.damageType} onChange={(e) => edit(w.id, { damageType: e.target.value })} />
              </L>
              <L label="Bonus magico (colpire+danno)">
                <input type="number" className="field" value={w.magicBonus ?? 0} onChange={(e) => edit(w.id, { magicBonus: +e.target.value || 0 })} />
              </L>
              <L label="Bonus colpire (extra)">
                <input type="number" className="field" value={w.attackBonus ?? 0} onChange={(e) => edit(w.id, { attackBonus: +e.target.value || 0 })} placeholder="es. +2 arciere" />
              </L>
              <L label="Bonus danno (extra)">
                <input type="number" className="field" value={w.damageBonus ?? 0} onChange={(e) => edit(w.id, { damageBonus: +e.target.value || 0 })} placeholder="es. +2 duello" />
              </L>
              <L label="Gittata">
                <input className="field" value={w.range ?? ""} onChange={(e) => edit(w.id, { range: e.target.value })} placeholder="6/18 m" />
              </L>
              <L label="Munizioni (vuoto = non tracciate)">
                <input type="number" className="field" value={w.ammo ?? ""} onChange={(e) => edit(w.id, { ammo: e.target.value === "" ? undefined : Math.max(0, +e.target.value || 0) })} placeholder="es. 20" />
              </L>
              <L label="Proprietà (virgola)" full>
                <input
                  className="field"
                  value={(w.properties ?? []).join(", ")}
                  onChange={(e) => edit(w.id, { properties: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="finesse, leggera, lancio"
                />
              </L>
            </div>
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-[var(--accent)] size-4" checked={w.proficient} onChange={(e) => edit(w.id, { proficient: e.target.checked })} />
                Competente
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!w.homebrew} onChange={(e) => edit(w.id, { homebrew: e.target.checked })} />
                Homebrew
              </label>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
              <RefLink name={w.homebrew ? undefined : w.name} />
              <button className="btn btn-danger btn-ghost text-sm" onClick={() => remove(w.id)}>
                <Trash2 size={15} /> Elimina
              </button>
            </div>
          </ItemCard>
        );
      })}
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
      {children}
    </span>
  );
}

function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-1 block">{label}</span>
      {children}
    </label>
  );
}
