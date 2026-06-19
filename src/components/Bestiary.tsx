"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Swords, PawPrint, Plus, Loader2, Check } from "lucide-react";
import { fetchMonsters, monsterToCombatant, monsterToCompanion, type Monster } from "@/lib/srdApi";
import { useCharacters } from "@/lib/useCharacters";
import { useEncounters } from "@/lib/useEncounters";
import { db, saveEncounter, saveCharacter } from "@/lib/db";
import { newEncounter, newCombatant } from "@/lib/encounter";

const ABIL_LABEL: Record<string, string> = { str: "FOR", dex: "DES", con: "COS", int: "INT", wis: "SAG", cha: "CAR" };
const mod = (s: number) => { const m = Math.floor((s - 10) / 2); return `${m >= 0 ? "+" : ""}${m}`; };

export function Bestiary() {
  const [all, setAll] = useState<Monster[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [flash, setFlash] = useState<string>("");
  const characters = useCharacters();
  const encounters = useEncounters();

  useEffect(() => { fetchMonsters().then(setAll); }, []);

  const filtered = useMemo(() => {
    if (!all) return [];
    const t = q.trim().toLowerCase();
    const list = t ? all.filter((m) => m.name.toLowerCase().includes(t) || m.type.toLowerCase().includes(t)) : all;
    return t ? list : list.slice(0, 80);
  }, [all, q]);

  function toast(msg: string) { setFlash(msg); setTimeout(() => setFlash(""), 1800); }

  async function addToEncounter(m: Monster) {
    let enc = encounters?.[0] ?? null;
    if (!enc) { enc = newEncounter(); }
    // count duplicates → label "Goblin 2"
    const base = m.name;
    const n = enc.combatants.filter((c) => c.name === base || c.name.startsWith(base + " ")).length;
    enc.combatants.push(newCombatant({ ...monsterToCombatant(m), name: n ? `${base} ${n + 1}` : base }));
    await saveEncounter(enc);
    toast(`${m.name} → ${enc.name}`);
  }

  async function addAsCompanion(m: Monster, charId: string) {
    const c = await db.characters.get(charId);
    if (!c) return;
    c.companions = [...(c.companions ?? []), monsterToCompanion(m)];
    await saveCharacter(c);
    const who = c.name;
    toast(`${m.name} → compagno di ${who}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-[var(--bg)]/90 backdrop-blur">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input className="field pl-9" placeholder="Cerca mostro (nome o tipo)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {all === null && (
        <div className="card p-6 text-center text-[var(--muted)] flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Scarico il bestiario…
        </div>
      )}
      {all !== null && filtered.length === 0 && <div className="card p-6 text-center text-[var(--muted)]">Nessun mostro.</div>}
      {all !== null && !q && <p className="text-xs text-[var(--muted)]">Primi 80 di {all.length}. Cerca per vederli tutti.</p>}

      {filtered.map((m) => (
        <div key={m.slug} className="card overflow-hidden">
          <button className="w-full text-left p-3 flex items-center gap-3" onClick={() => setOpen(open === m.slug ? null : m.slug)}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{m.name}</p>
              <p className="text-xs text-[var(--muted)] truncate">{m.size} {m.type} · GS {m.cr} · CA {m.ac} · PF {m.hp}</p>
            </div>
          </button>
          {open === m.slug && <StatBlock m={m} characters={characters} onEncounter={() => addToEncounter(m)} onCompanion={(id) => addAsCompanion(m, id)} />}
        </div>
      ))}

      {flash && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg" style={{ background: "var(--accent)", color: "#1a1407" }}>
          <Check size={15} /> {flash}
        </div>
      )}
    </div>
  );
}

function StatBlock({ m, characters, onEncounter, onCompanion }: {
  m: Monster;
  characters: ReturnType<typeof useCharacters>;
  onEncounter: () => void;
  onCompanion: (charId: string) => void;
}) {
  const [pickChar, setPickChar] = useState(false);
  return (
    <div className="px-3 pb-3 pt-1 border-t border-[var(--border)] text-sm space-y-2">
      <div className="flex flex-wrap gap-2 py-1">
        <button className="btn btn-accent text-sm py-1.5" onClick={onEncounter}><Swords size={14} /> Incontro</button>
        <div className="relative">
          <button className="btn text-sm py-1.5" onClick={() => setPickChar((p) => !p)} disabled={!characters?.length}><PawPrint size={14} /> Compagno</button>
          {pickChar && characters && characters.length > 0 && (
            <div className="absolute z-20 mt-1 w-48 card p-1 max-h-56 overflow-y-auto">
              {characters.map((c) => (
                <button key={c.id} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[var(--surface-2)]" onClick={() => { onCompanion(c.id); setPickChar(false); }}>
                  <Plus size={13} className="inline mr-1" />{c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[var(--muted)] italic text-xs">{m.alignment}{m.acDesc ? ` · CA ${m.ac} (${m.acDesc})` : ""} · Velocità {m.speed}{m.hitDice ? ` · PF ${m.hp} (${m.hitDice})` : ""}</p>

      <div className="grid grid-cols-6 gap-1 text-center">
        {(["str", "dex", "con", "int", "wis", "cha"] as const).map((a) => (
          <div key={a} className="rounded-lg bg-[var(--surface-2)] py-1">
            <div className="text-[10px] text-[var(--muted)]">{ABIL_LABEL[a]}</div>
            <div className="font-bold text-xs">{m.abilities[a]}</div>
            <div className="text-[10px]" style={{ color: "var(--accent)" }}>{mod(m.abilities[a])}</div>
          </div>
        ))}
      </div>

      <Meta label="Sensi" v={m.senses} />
      <Meta label="Abilità" v={m.skills} />
      <Meta label="Linguaggi" v={m.languages} />
      <Meta label="Resistenze" v={m.resistances} />
      <Meta label="Immunità" v={m.immunities} />
      <Meta label="Imm. condizioni" v={m.conditionImmunities} />
      <Meta label="Vulnerabilità" v={m.vulnerabilities} />

      <Section title="Tratti" items={m.traits} />
      <Section title="Azioni" items={m.actions} />
      <Section title="Reazioni" items={m.reactions} />
      <Section title="Azioni leggendarie" items={m.legendary} />
    </div>
  );
}

function Meta({ label, v }: { label: string; v?: string }) {
  if (!v) return null;
  return <p><span className="text-[var(--muted)] text-xs uppercase tracking-wide mr-1">{label}:</span>{v}</p>;
}
function Section({ title, items }: { title: string; items: { name: string; desc: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="pt-1">
      <p className="font-display font-bold text-xs uppercase tracking-wide text-[var(--accent)] mb-1">{title}</p>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <p key={i} className="text-xs leading-relaxed"><span className="font-semibold">{it.name}.</span> {it.desc}</p>
        ))}
      </div>
    </div>
  );
}
