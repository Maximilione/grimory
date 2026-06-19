"use client";

import { useState } from "react";
import { Dices, User, Scroll, Coins, Beer, RefreshCw, Copy, Check } from "lucide-react";
import {
  randomName,
  randomNPC,
  randomHook,
  randomRumor,
  randomLoot,
  randomTavern,
  NAME_ANCESTRIES,
  type NPCResult,
  type LootResult,
} from "@/lib/generators";

/** Offline DM toolbox: NPC / name / hook / loot / tavern generators. */
export function Generators() {
  return (
    <div className="flex flex-col gap-4">
      <NPCGen />
      <NameGen />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HookGen />
        <LootGen />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RumorGen />
        <TavernGen />
      </div>
    </div>
  );
}

function Panel({ icon, title, children, onRoll }: { icon: React.ReactNode; title: string; children: React.ReactNode; onRoll: () => void }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold flex items-center gap-2">{icon} {title}</h2>
        <button className="btn btn-accent text-sm py-1.5" onClick={onRoll}><RefreshCw size={14} /> Genera</button>
      </div>
      {children}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn btn-ghost px-2 py-1 text-xs shrink-0"
      title="Copia"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); } catch {} }}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function NPCGen() {
  const [npc, setNpc] = useState<NPCResult | null>(null);
  const text = npc && `${npc.name} (${npc.race}) — ${npc.job}. ${npc.trait}; ${npc.quirk}. Vuole ${npc.wants}. Teme ${npc.fears}. Porta con sé ${npc.carries}.`;
  return (
    <Panel icon={<User size={17} />} title="PNG casuale" onRoll={() => setNpc(randomNPC())}>
      {!npc ? (
        <p className="text-sm text-[var(--muted)]">Genera un PNG completo con tratti, segreti e ganci.</p>
      ) : (
        <div className="flex items-start gap-2">
          <div className="text-sm flex-1 space-y-1">
            <p className="text-base"><span className="font-bold">{npc.name}</span> <span className="text-[var(--muted)]">· {npc.race} · {npc.job}</span></p>
            <Row k="Indole" v={`${npc.trait}; ${npc.quirk}`} />
            <Row k="Vuole" v={npc.wants} />
            <Row k="Teme" v={npc.fears} />
            <Row k="Porta" v={npc.carries} />
          </div>
          <CopyBtn text={text!} />
        </div>
      )}
    </Panel>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <p><span className="text-[var(--muted)] text-xs uppercase tracking-wide mr-1">{k}:</span>{v}</p>;
}

function NameGen() {
  const [anc, setAnc] = useState<string>(NAME_ANCESTRIES[0]);
  const [names, setNames] = useState<string[]>([]);
  return (
    <Panel icon={<Dices size={17} />} title="Nomi" onRoll={() => setNames(Array.from({ length: 6 }, () => randomName(anc)))}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select className="field" style={{ width: "auto" }} value={anc} onChange={(e) => setAnc(e.target.value)}>
          {NAME_ANCESTRIES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      {names.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
          {names.map((n, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 bg-[var(--surface-2)]">
              <span className="truncate">{n}</span><CopyBtn text={n} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function HookGen() {
  const [h, setH] = useState<string>("");
  return (
    <Panel icon={<Scroll size={17} />} title="Gancio di trama" onRoll={() => setH(randomHook())}>
      {h ? <div className="flex items-start gap-2"><p className="text-sm flex-1 italic">{h}</p><CopyBtn text={h} /></div> : <p className="text-sm text-[var(--muted)]">Un aggancio pronto da usare.</p>}
    </Panel>
  );
}

function RumorGen() {
  const [r, setR] = useState<string>("");
  return (
    <Panel icon={<Scroll size={17} />} title="Diceria" onRoll={() => setR(randomRumor())}>
      {r ? <div className="flex items-start gap-2"><p className="text-sm flex-1 italic">“{r}”</p><CopyBtn text={r} /></div> : <p className="text-sm text-[var(--muted)]">Voci da taverna.</p>}
    </Panel>
  );
}

function LootGen() {
  const [l, setL] = useState<LootResult | null>(null);
  const [tier, setTier] = useState<"minore" | "medio" | "maggiore">("medio");
  return (
    <Panel icon={<Coins size={17} />} title="Bottino" onRoll={() => setL(randomLoot(tier))}>
      <div className="flex gap-1 mb-3">
        {(["minore", "medio", "maggiore"] as const).map((t) => (
          <button key={t} className="btn text-xs py-1 flex-1 capitalize" style={tier === t ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : undefined} onClick={() => setTier(t)}>{t}</button>
        ))}
      </div>
      {l ? (
        <div className="text-sm space-y-1">
          <Row k="Monete" v={l.coins} />
          {l.gem && <Row k="Gemma" v={l.gem} />}
          {l.trinket && <Row k="Ninnolo" v={l.trinket} />}
        </div>
      ) : <p className="text-sm text-[var(--muted)]">Tesoro casuale per fascia.</p>}
    </Panel>
  );
}

function TavernGen() {
  const [t, setT] = useState<string>("");
  return (
    <Panel icon={<Beer size={17} />} title="Taverna" onRoll={() => setT(randomTavern())}>
      {t ? <p className="text-lg font-display">“{t}”</p> : <p className="text-sm text-[var(--muted)]">Un nome per la locanda.</p>}
    </Panel>
  );
}
