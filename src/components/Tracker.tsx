"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, Minus, Trash2, Dices, ChevronRight, ChevronLeft, RotateCcw,
  Users, Skull, Shield, Heart, BookOpen, Swords, UserPlus,
} from "lucide-react";
import { useEncounters, useEncounter } from "@/lib/useEncounters";
import { useCharacters } from "@/lib/useCharacters";
import { saveEncounter, deleteEncounter } from "@/lib/db";
import { newEncounter, newCombatant, initiativeOrder, type Combatant } from "@/lib/encounter";
import { derive } from "@/lib/rules";
import { CONDITIONS } from "@/lib/srd";

const d20 = () => Math.floor(Math.random() * 20) + 1;

export function Tracker() {
  const encounters = useEncounters();
  const [activeId, setActiveId] = useState<string | null>(null);
  // default to newest encounter
  const id = activeId ?? encounters?.[0]?.id ?? null;
  const { encounter, update } = useEncounter(id);

  async function create() {
    const e = newEncounter();
    await saveEncounter(e);
    setActiveId(e.id);
  }

  if (encounters === undefined) return <p className="text-[var(--muted)] text-sm">Caricamento…</p>;

  if (!encounters.length || !encounter) {
    return (
      <div className="flex flex-col gap-3">
        {encounters.length > 0 && <EncounterTabs encounters={encounters} activeId={id} onPick={setActiveId} onNew={create} />}
        <div className="card p-8 text-center text-[var(--muted)]">
          <Swords size={28} className="mx-auto mb-2 opacity-60" />
          <p className="mb-3">Nessuno scontro attivo.</p>
          <button className="btn btn-accent mx-auto" onClick={create}><Plus size={16} /> Nuovo scontro</button>
        </div>
      </div>
    );
  }

  return <ActiveEncounter encounter={encounter} update={update} encounters={encounters} onPick={setActiveId} onNew={create} />;
}

function EncounterTabs({ encounters, activeId, onPick, onNew }: { encounters: NonNullable<ReturnType<typeof useEncounters>>; activeId: string | null; onPick: (id: string | null) => void; onNew: () => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {encounters.map((e) => (
        <button key={e.id} onClick={() => onPick(e.id)} className="btn text-sm py-1.5 shrink-0" style={e.id === activeId ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : undefined}>
          {e.name} <span className="opacity-60">·{e.combatants.length}</span>
        </button>
      ))}
      <button className="btn btn-ghost text-sm py-1.5 shrink-0" onClick={onNew}><Plus size={14} /></button>
    </div>
  );
}

function ActiveEncounter({ encounter: e, update, encounters, onPick, onNew }: {
  encounter: NonNullable<ReturnType<typeof useEncounter>["encounter"]>;
  update: ReturnType<typeof useEncounter>["update"];
  encounters: NonNullable<ReturnType<typeof useEncounters>>;
  onPick: (id: string | null) => void;
  onNew: () => void;
}) {
  const characters = useCharacters();
  const [addPC, setAddPC] = useState(false);
  const order = initiativeOrder(e.combatants);
  const current = e.started ? order[e.turnIndex % Math.max(1, order.length)] : null;

  function mut(fn: (d: typeof e) => void) { update(fn); }
  function mutC(cid: string, fn: (c: Combatant) => void) {
    update((d) => { const c = d.combatants.find((x) => x.id === cid); if (c) fn(c); });
  }

  function addCharacter(charId: string) {
    const c = characters?.find((x) => x.id === charId);
    if (!c) return;
    const d = derive(c);
    update((draft) => {
      draft.combatants.push(newCombatant({
        name: c.name, isPC: true, charId: c.id,
        ac: d.armorClass, maxHp: d.maxHp, currentHp: c.currentHp ?? d.maxHp,
        initiativeMod: d.initiative,
      }));
    });
    setAddPC(false);
  }

  function rollAll(force: boolean) {
    update((draft) => {
      for (const c of draft.combatants) {
        if (force || c.initiative === null) c.initiative = d20() + c.initiativeMod;
      }
    });
  }
  function rollOne(cid: string) { mutC(cid, (c) => (c.initiative = d20() + c.initiativeMod)); }

  function start() {
    update((draft) => {
      for (const c of draft.combatants) if (c.initiative === null) c.initiative = d20() + c.initiativeMod;
      draft.started = true; draft.round = 1; draft.turnIndex = 0;
    });
  }
  function nextTurn() {
    update((draft) => {
      const n = draft.combatants.length;
      if (!n) return;
      draft.turnIndex += 1;
      if (draft.turnIndex >= n) { draft.turnIndex = 0; draft.round += 1; }
    });
  }
  function prevTurn() {
    update((draft) => {
      const n = draft.combatants.length;
      if (!n) return;
      draft.turnIndex -= 1;
      if (draft.turnIndex < 0) { draft.turnIndex = n - 1; draft.round = Math.max(1, draft.round - 1); }
    });
  }
  function reset() {
    update((draft) => { draft.started = false; draft.round = 1; draft.turnIndex = 0; for (const c of draft.combatants) c.initiative = null; });
  }

  return (
    <div className="flex flex-col gap-3">
      <EncounterTabs encounters={encounters} activeId={e.id} onPick={onPick} onNew={onNew} />

      {/* title + delete */}
      <div className="flex items-center gap-2">
        <input className="field font-display text-lg" value={e.name} onChange={(ev) => mut((d) => (d.name = ev.target.value))} />
        <button className="btn btn-danger btn-ghost px-2.5 shrink-0" title="Elimina scontro" onClick={async () => { if (confirm(`Eliminare "${e.name}"?`)) { await deleteEncounter(e.id); onPick(null); } }}><Trash2 size={16} /></button>
      </div>

      {/* combat state bar */}
      {e.started ? (
        <div className="card p-3 flex items-center justify-between gap-2" style={{ borderColor: "var(--accent)" }}>
          <button className="btn px-2.5" onClick={prevTurn}><ChevronLeft size={16} /></button>
          <div className="text-center min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Round {e.round}</p>
            <p className="font-display font-bold truncate">{current ? current.name : "—"}</p>
          </div>
          <button className="btn btn-accent px-2.5" onClick={nextTurn}>Turno <ChevronRight size={16} /></button>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-accent" onClick={start} disabled={!e.combatants.length}><Dices size={16} /> Inizia (tira iniziativa)</button>
          <button className="btn" onClick={() => rollAll(true)} disabled={!e.combatants.length}><Dices size={16} /> Ritira tutti</button>
        </div>
      )}
      {e.started && (
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-ghost text-sm" onClick={reset}><RotateCcw size={14} /> Reset iniziativa</button>
        </div>
      )}

      {/* add controls */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <button className="btn text-sm" onClick={() => setAddPC((p) => !p)} disabled={!characters?.length}><Users size={15} /> Aggiungi PG</button>
          {addPC && characters && (
            <div className="absolute z-20 mt-1 w-52 card p-1 max-h-60 overflow-y-auto">
              {characters.length === 0 && <p className="text-xs text-[var(--muted)] p-2">Nessun PG.</p>}
              {characters.map((c) => (
                <button key={c.id} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[var(--surface-2)] flex items-center gap-2" onClick={() => addCharacter(c.id)}>
                  <UserPlus size={13} /> {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Link href="/bestiary" className="btn text-sm"><BookOpen size={15} /> Mostri</Link>
        <button className="btn text-sm" onClick={() => update((d) => d.combatants.push(newCombatant({ name: "Nemico", ac: 12, maxHp: 10, currentHp: 10 })))}><Plus size={15} /> Personalizzato</button>
      </div>

      {/* combatant list */}
      {e.combatants.length === 0 && <div className="card p-6 text-center text-[var(--muted)] text-sm">Aggiungi PG e mostri per iniziare.</div>}
      <div className="flex flex-col gap-2">
        {order.map((c) => (
          <CombatantRow key={c.id} c={c} isCurrent={current?.id === c.id} mut={(fn) => mutC(c.id, fn)} remove={() => mut((d) => (d.combatants = d.combatants.filter((x) => x.id !== c.id)))} rollOne={() => rollOne(c.id)} />
        ))}
      </div>
    </div>
  );
}

function CombatantRow({ c, isCurrent, mut, remove, rollOne }: {
  c: Combatant; isCurrent: boolean; mut: (fn: (c: Combatant) => void) => void; remove: () => void; rollOne: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dead = c.currentHp <= 0;
  const hpPct = c.maxHp ? Math.max(0, Math.min(100, (c.currentHp / c.maxHp) * 100)) : 0;

  function hp(delta: number) { mut((x) => { x.currentHp = Math.max(-99, Math.min(x.maxHp, x.currentHp + delta)); }); }

  return (
    <div className="card p-3" style={isCurrent ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" } : dead ? { opacity: 0.55 } : undefined}>
      <div className="flex items-center gap-2.5">
        {/* initiative */}
        <button className="size-11 rounded-xl grid place-items-center shrink-0 font-bold text-lg" style={{ background: "var(--surface-2)" }} title="Tira iniziativa" onClick={rollOne}>
          {c.initiative ?? <Dices size={16} className="text-[var(--muted)]" />}
        </button>
        {/* name + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate flex items-center gap-1.5">
            {dead && <Skull size={13} style={{ color: "var(--ember)" }} />}
            {c.isPC && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>PG</span>}
            <span className="truncate">{c.name}</span>
          </p>
          <p className="text-xs text-[var(--muted)] flex items-center gap-2">
            <span className="flex items-center gap-0.5"><Shield size={11} /> {c.ac}</span>
            {c.cr && <span>GS {c.cr}</span>}
            {c.conditions.length > 0 && <span className="truncate" style={{ color: "var(--ember)" }}>{c.conditions.map((k) => CONDITIONS[k] ?? k).join(", ")}</span>}
          </p>
        </div>
        {/* hp control */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="btn btn-danger px-2 py-1.5" onClick={() => hp(-1)} aria-label="Danno"><Minus size={13} /></button>
          <button className="text-center leading-tight" onClick={() => setOpen((o) => !o)}>
            <span className="font-bold text-sm flex items-center gap-0.5"><Heart size={11} style={{ color: "var(--ember)" }} />{c.currentHp}</span>
            <span className="text-[10px] text-[var(--muted)]">/{c.maxHp}{c.tempHp ? ` +${c.tempHp}` : ""}</span>
          </button>
          <button className="btn px-2 py-1.5" onClick={() => hp(1)} aria-label="Cura"><Plus size={13} /></button>
        </div>
      </div>

      {/* HP bar */}
      <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden mt-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${hpPct}%`, background: hpPct > 50 ? "var(--good)" : hpPct > 20 ? "var(--accent)" : "var(--ember)" }} />
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <Field label="Iniz."><input type="number" className="field px-1 py-1 text-center text-sm" value={c.initiative ?? ""} onChange={(e) => mut((x) => (x.initiative = e.target.value === "" ? null : +e.target.value))} /></Field>
            <Field label="CA"><input type="number" className="field px-1 py-1 text-center text-sm" value={c.ac} onChange={(e) => mut((x) => (x.ac = +e.target.value || 0))} /></Field>
            <Field label="PF"><input type="number" className="field px-1 py-1 text-center text-sm" value={c.currentHp} onChange={(e) => mut((x) => (x.currentHp = +e.target.value || 0))} /></Field>
            <Field label="PF max"><input type="number" className="field px-1 py-1 text-center text-sm" value={c.maxHp} onChange={(e) => mut((x) => (x.maxHp = Math.max(1, +e.target.value || 1)))} /></Field>
            <Field label="PF temp"><input type="number" className="field px-1 py-1 text-center text-sm" value={c.tempHp} onChange={(e) => mut((x) => (x.tempHp = +e.target.value || 0))} /></Field>
            <Field label="Nome" full><input className="field px-2 py-1 text-sm" value={c.name} onChange={(e) => mut((x) => (x.name = e.target.value))} /></Field>
          </div>
          {/* conditions */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-1.5">Condizioni</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CONDITIONS).map(([k, label]) => {
                const on = c.conditions.includes(k);
                return (
                  <button key={k} onClick={() => mut((x) => { x.conditions = on ? x.conditions.filter((y) => y !== k) : [...x.conditions, k]; })}
                    className="text-xs px-2 py-1 rounded-lg border" style={on ? { background: "var(--ember-soft)", color: "var(--ember)", borderColor: "var(--ember)" } : { borderColor: "var(--border)", color: "var(--muted)" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <button className="btn btn-danger btn-ghost text-sm" onClick={remove}><Trash2 size={14} /> Rimuovi</button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-4" : ""}`}>
      <span className="text-[10px] uppercase tracking-wide text-[var(--muted)] mb-0.5 block">{label}</span>
      {children}
    </label>
  );
}
