"use client";

import { useState } from "react";
import { Plus, Trash2, BookOpen, Wand2, FileDown, Loader2 } from "lucide-react";
import { uid } from "@/lib/db";
import { derive, getClasses, pactMagic } from "@/lib/rules";
import { classByKey } from "@/lib/srd";
import type { Spell } from "@/lib/types";
import { searchSpells, fetchSpellDetail, withId } from "@/lib/srdApi";
import { ClassSpellPicker } from "./ClassSpellPicker";
import {
  SectionHeader,
  ItemCard,
  Empty,
  ExprRollButton,
  FormulaField,
  type SectionProps,
} from "./common";
import { SrdSearch } from "./SrdSearch";
import { Tag } from "./Weapons";

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Spells({ character: c, update }: SectionProps) {
  const d = derive(c);
  const [search, setSearch] = useState(false);
  const [classList, setClassList] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Fill description + missing meta for a spell by looking it up by name in the SRD cache.
  async function loadDesc(s: Spell) {
    setLoadingId(s.id);
    const det = await fetchSpellDetail(s.name);
    if (det) {
      update((draft) => {
        const sp = draft.spells.find((x) => x.id === s.id);
        if (!sp) return;
        if (det.description) sp.description = det.description;
        if (!sp.school && det.school) sp.school = det.school;
        if (!sp.castingTime && det.castingTime) sp.castingTime = det.castingTime;
        if (!sp.range && det.range) sp.range = det.range;
        if (!sp.duration && det.duration) sp.duration = det.duration;
        if (!sp.components && det.components) sp.components = det.components;
        if (det.concentration) sp.concentration = det.concentration;
        if (det.ritual) sp.ritual = det.ritual;
      });
    }
    setLoadingId(null);
  }
  // caster classes the character has (for the class spell-list picker)
  const casterKeys = getClasses(c).map((e) => e.key).filter((k) => classByKey(k)?.spellcasting);
  const casterLabel = casterKeys.map((k) => classByKey(k)?.name ?? k).join(" / ");

  function add(level: number) {
    update((draft) =>
      draft.spells.unshift({
        id: uid(),
        name: level === 0 ? "Nuovo trucchetto" : "Nuovo incantesimo",
        level,
        prepared: true,
      }),
    );
  }
  function edit(id: string, patch: Partial<Spell>) {
    update((draft) => {
      const s = draft.spells.find((x) => x.id === id);
      if (s) Object.assign(s, patch);
    });
  }
  function remove(id: string) {
    update((draft) => (draft.spells = draft.spells.filter((x) => x.id !== id)));
  }
  function toggleSlot(level: number, index: number) {
    update((draft) => {
      const slot = (draft.spellSlots ??= {})[level];
      if (!slot) return;
      // clicking pip i: if filled => expend up to i+1; logic: set spent so pip toggles
      slot.spent = slot.spent > index ? index : index + 1;
    });
  }
  function setSlotMax(level: number, max: number) {
    update((draft) => {
      draft.spellSlots ??= {};
      if (max <= 0) delete draft.spellSlots[level];
      else draft.spellSlots[level] = { max, spent: Math.min(draft.spellSlots[level]?.spent ?? 0, max) };
    });
  }

  const byLevel = (lvl: number) => c.spells.filter((s) => s.level === lvl);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Incantesimi"
        desc={
          d.spellcasters.length === 0
            ? "Imposta la caratteristica da incantatore nelle Impostazioni."
            : d.spellcasters.length === 1
              ? `CD ${d.spellcasters[0].dc} · Attacco ${d.spellcasters[0].attack >= 0 ? "+" : ""}${d.spellcasters[0].attack}`
              : d.spellcasters.map((s) => `${s.ability.toUpperCase()} CD ${s.dc}/${s.attack >= 0 ? "+" : ""}${s.attack}`).join(" · ")
        }
        action={
          <div className="flex gap-2">
            {casterKeys.length > 0 && (
              <button className="btn" onClick={() => setClassList(true)}>
                <Wand2 size={16} /> Lista classe
              </button>
            )}
            <button className="btn" onClick={() => setSearch(true)}>
              <BookOpen size={16} /> Manuale
            </button>
          </div>
        }
      />
      {search && (
        <SrdSearch
          title="Incantesimi — SRD 2024"
          fetcher={searchSpells}
          onPick={(built) => update((d) => d.spells.unshift(withId(built)))}
          onClose={() => setSearch(false)}
        />
      )}
      {classList && (
        <ClassSpellPicker
          classKeys={casterKeys}
          classLabel={casterLabel}
          onPick={(built) => update((d) => d.spells.unshift(withId(built)))}
          onClose={() => setClassList(false)}
        />
      )}

      {casterKeys.length > 0 && (() => {
        const prepared = c.spells.filter((s) => s.level > 0 && s.prepared).length;
        const cantrips = c.spells.filter((s) => s.level === 0).length;
        return (
          <p className="text-xs text-[var(--muted)] -mt-2">
            Trucchetti: {cantrips} · Incantesimi preparati: <strong style={{ color: "var(--accent)" }}>{prepared}</strong>
          </p>
        );
      })()}

      {(() => {
        const pact = pactMagic(c);
        if (!pact) return null;
        const spent = c.pactSpent ?? 0;
        return (
          <div className="card p-3 flex items-center justify-between" style={{ borderColor: "var(--accent-soft)" }}>
            <div>
              <p className="text-sm font-bold">Magia del Patto</p>
              <p className="text-[11px] text-[var(--muted)]">slot di livello {pact.slotLevel} · riposo breve</p>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pact.max }, (_, i) => {
                const filled = i >= spent;
                return (
                  <button
                    key={i}
                    className="size-4 rounded-full border"
                    style={{ borderColor: "var(--accent)", background: filled ? "var(--accent)" : "transparent" }}
                    onClick={() => update((d) => (d.pactSpent = spent > i ? i : i + 1))}
                    aria-label={`pact ${i + 1}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })()}

      {LEVELS.map((lvl) => {
        const spells = byLevel(lvl);
        const slot = c.spellSlots?.[lvl];
        if (lvl > 0 && spells.length === 0 && !slot) return null;
        return (
          <div key={lvl} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {lvl === 0 ? "Trucchetti" : `Livello ${lvl}`}
              </span>
              <div className="flex items-center gap-2">
                {lvl > 0 && (
                  <SlotControl
                    slot={slot}
                    onPip={(i) => toggleSlot(lvl, i)}
                    onSetMax={(m) => setSlotMax(lvl, m)}
                  />
                )}
                <button className="btn btn-ghost text-sm py-1" onClick={() => add(lvl)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
            {spells.length === 0 && lvl === 0 && <Empty>Nessun trucchetto.</Empty>}
            {spells.map((s) => (
              <ItemCard
                key={s.id}
                title={
                  <span className="flex items-center gap-2">
                    <span style={{ opacity: s.prepared ? 1 : 0.5 }}>{s.name}</span>
                    {s.concentration && <Tag>C</Tag>}
                    {s.ritual && <Tag>R</Tag>}
                    {s.homebrew && <Tag>HB</Tag>}
                  </span>
                }
                meta={[s.school, s.castingTime, s.range].filter(Boolean).join(" · ") || undefined}
                right={
                  s.damage ? (
                    <ExprRollButton label={`${s.name} — danno`} expr={s.damage} character={c}>
                      danno
                    </ExprRollButton>
                  ) : undefined
                }
              >
                {/* readable description (full text) + on-demand load */}
                {s.description ? (
                  <p className="text-sm text-[var(--muted)] whitespace-pre-line leading-relaxed mb-3">{s.description}</p>
                ) : (
                  <button
                    className="btn btn-ghost text-sm mb-3"
                    disabled={loadingId === s.id}
                    onClick={() => loadDesc(s)}
                  >
                    {loadingId === s.id ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                    Carica descrizione
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <L label="Nome" full>
                    <input className="field" value={s.name} onChange={(e) => edit(s.id, { name: e.target.value })} />
                  </L>
                  <L label="Scuola">
                    <input className="field" value={s.school ?? ""} onChange={(e) => edit(s.id, { school: e.target.value })} />
                  </L>
                  <L label="Tempo lancio">
                    <input className="field" value={s.castingTime ?? ""} onChange={(e) => edit(s.id, { castingTime: e.target.value })} />
                  </L>
                  <L label="Gittata">
                    <input className="field" value={s.range ?? ""} onChange={(e) => edit(s.id, { range: e.target.value })} />
                  </L>
                  <L label="Durata">
                    <input className="field" value={s.duration ?? ""} onChange={(e) => edit(s.id, { duration: e.target.value })} />
                  </L>
                  <L label="Danno (formula, usa 'cantrip' per scaling)" full>
                    <FormulaField
                      value={s.damage ?? ""}
                      onChange={(v) => edit(s.id, { damage: v })}
                      character={c}
                      allowDice
                      placeholder={lvl === 0 ? "cantrip*1d10 + mod.spell" : "8d6"}
                    />
                  </L>
                  <L label="Descrizione" full>
                    <textarea className="field" rows={3} value={s.description ?? ""} onChange={(e) => edit(s.id, { description: e.target.value })} />
                  </L>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!s.prepared} onChange={(e) => edit(s.id, { prepared: e.target.checked })} />
                      Preparato
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!s.concentration} onChange={(e) => edit(s.id, { concentration: e.target.checked })} />
                      Conc.
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!s.ritual} onChange={(e) => edit(s.id, { ritual: e.target.checked })} />
                      Rituale
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-[var(--accent)] size-4" checked={!!s.homebrew} onChange={(e) => edit(s.id, { homebrew: e.target.checked })} />
                      HB
                    </label>
                  </div>
                  <button className="btn btn-danger btn-ghost text-sm" onClick={() => remove(s.id)}>
                    <Trash2 size={15} /> Elimina
                  </button>
                </div>
              </ItemCard>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SlotControl({
  slot,
  onPip,
  onSetMax,
}: {
  slot?: { max: number; spent: number };
  onPip: (i: number) => void;
  onSetMax: (m: number) => void;
}) {
  const max = slot?.max ?? 0;
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i >= (slot?.spent ?? 0);
        return (
          <button
            key={i}
            className="size-4 rounded-full border"
            aria-label={`slot ${i + 1}`}
            style={{
              borderColor: "var(--accent)",
              background: filled ? "var(--accent)" : "transparent",
            }}
            onClick={() => onPip(i)}
          />
        );
      })}
      <input
        type="number"
        className="field w-12 px-1 py-1 text-center text-xs"
        value={max}
        min={0}
        onChange={(e) => onSetMax(Math.max(0, +e.target.value || 0))}
        aria-label="slot max"
      />
    </div>
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
