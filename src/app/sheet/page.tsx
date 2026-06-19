"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Menu,
  X,
  Home,
  LayoutGrid,
  Dices,
  Sparkles,
  Swords,
  Sword,
  ShieldCheck,
  ShieldHalf,
  Backpack,
  Wand2,
  ScrollText,
  FlaskConical,
  BookOpen,
  PawPrint,
  NotebookPen,
  Settings as SettingsIcon,
  ChevronRight,
} from "lucide-react";
import { useCharacter } from "@/lib/useCharacters";
import { classByKey } from "@/lib/srd";
import { getClasses } from "@/lib/rules";
import type { SectionProps } from "@/components/sheet/common";
import { Overview } from "@/components/sheet/Overview";
import { Abilities } from "@/components/sheet/Abilities";
import { Skills } from "@/components/sheet/Skills";
import { Proficiencies } from "@/components/sheet/Proficiencies";
import { Attacks } from "@/components/sheet/Attacks";
import { Weapons } from "@/components/sheet/Weapons";
import { Inventory } from "@/components/sheet/Inventory";
import { Spells } from "@/components/sheet/Spells";
import { Features } from "@/components/sheet/Features";
import { Homebrew } from "@/components/sheet/Homebrew";
import { Settings } from "@/components/sheet/Settings";
import { RollToast } from "@/components/sheet/RollToast";
import { CritFx } from "@/components/sheet/CritFx";
import { RollModeToggle } from "@/components/sheet/RollModeToggle";
import { RollLog } from "@/components/sheet/RollLog";
import { ManualBrowser } from "@/components/ManualBrowser";
import { Companions } from "@/components/sheet/Companions";
import { Defenses } from "@/components/sheet/Defenses";
import { Notes } from "@/components/sheet/Notes";
import { ThemeToggle } from "@/components/ThemeToggle";

type SectionKey =
  | "overview" | "abilities" | "skills" | "proficiencies"
  | "attacks" | "weapons" | "defenses"
  | "spells" | "inventory" | "features" | "companions"
  | "homebrew" | "manual" | "notes" | "settings";

const SECTIONS: Record<SectionKey, { label: string; icon: React.ReactNode; comp: React.FC<SectionProps> }> = {
  overview: { label: "Panoramica", icon: <LayoutGrid size={18} />, comp: Overview },
  abilities: { label: "Caratteristiche", icon: <Dices size={18} />, comp: Abilities },
  skills: { label: "Abilità", icon: <Sparkles size={18} />, comp: Skills },
  proficiencies: { label: "Competenze & Lingue", icon: <ShieldCheck size={18} />, comp: Proficiencies },
  attacks: { label: "Attacchi", icon: <Swords size={18} />, comp: Attacks },
  weapons: { label: "Armi", icon: <Sword size={18} />, comp: Weapons },
  defenses: { label: "Difese & Sensi", icon: <ShieldHalf size={18} />, comp: Defenses },
  spells: { label: "Incantesimi", icon: <Wand2 size={18} />, comp: Spells },
  inventory: { label: "Equipaggiamento", icon: <Backpack size={18} />, comp: Inventory },
  features: { label: "Tratti & Privilegi", icon: <ScrollText size={18} />, comp: Features },
  companions: { label: "Compagni", icon: <PawPrint size={18} />, comp: Companions },
  homebrew: { label: "Homebrew", icon: <FlaskConical size={18} />, comp: Homebrew },
  manual: { label: "Manuale", icon: <BookOpen size={18} />, comp: ManualBrowser as React.FC<SectionProps> },
  notes: { label: "Note & Diario", icon: <NotebookPen size={18} />, comp: Notes },
  settings: { label: "Impostazioni", icon: <SettingsIcon size={18} />, comp: Settings },
};

const GROUPS: { title: string; keys: SectionKey[] }[] = [
  { title: "Scheda", keys: ["overview", "abilities", "skills", "proficiencies"] },
  { title: "Combattimento", keys: ["attacks", "weapons", "defenses"] },
  { title: "Risorse", keys: ["spells", "inventory", "features", "companions"] },
  { title: "Riferimento", keys: ["manual"] },
  { title: "Personalizza", keys: ["notes", "homebrew", "settings"] },
];

export default function SheetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--muted)]">Caricamento…</div>}>
      <SheetInner />
    </Suspense>
  );
}

function SheetInner() {
  const params = useSearchParams();
  const id = params.get("c");
  const { character, update } = useCharacter(id);
  const [section, setSection] = useState<SectionKey>("overview");
  const [open, setOpen] = useState(false);

  if (id && character === undefined) {
    return <div className="p-6 text-[var(--muted)]">Caricamento scheda…</div>;
  }
  if (!character) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 mt-20">
        <p className="text-[var(--muted)]">Personaggio non trovato.</p>
        <Link href="/" className="btn btn-accent"><Home size={16} /> Torna alla lista</Link>
      </div>
    );
  }

  const Active = SECTIONS[section].comp;
  const classList = getClasses(character);
  const classLabel = classList.length
    ? classList.map((e) => `${classByKey(e.key)?.name ?? e.key} ${e.level}`).join(" / ")
    : character.className;
  const subtitle = [classLabel, `Liv. ${character.level}`].filter(Boolean).join(" · ");

  return (
    <div
      id="app-shake"
      className="md:pl-72"
      style={character.accent ? ({ ["--accent" as string]: character.accent } as React.CSSProperties) : undefined}
    >
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between pt-[max(1rem,env(safe-area-inset-top))]">
          <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">
            <Home size={16} /> Lista
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button className="md:hidden text-[var(--muted)]" onClick={() => setOpen(false)} aria-label="Chiudi menu">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="size-11 rounded-full grid place-items-center font-bold shrink-0 overflow-hidden" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            {character.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={character.avatar} alt="" className="size-full object-cover" />
            ) : (
              character.name.trim().charAt(0).toUpperCase() || "?"
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{character.name}</p>
            <p className="text-xs text-[var(--muted)] truncate">{subtitle || "—"}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] px-2 mb-1.5">{g.title}</p>
              {g.keys.map((k) => {
                const active = section === k;
                return (
                  <button
                    key={k}
                    onClick={() => { setSection(k); setOpen(false); }}
                    className="group w-full flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors relative hover:bg-[var(--surface-2)]"
                    style={{
                      background: active ? "var(--accent-soft)" : undefined,
                      color: active ? "var(--accent)" : "var(--text)",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full" style={{ background: "var(--accent)" }} />
                    )}
                    {SECTIONS[k].icon}
                    <span className="flex-1 text-left">{SECTIONS[k].label}</span>
                    {active && <ChevronRight size={15} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Backdrop (mobile) */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)] pt-[max(0px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 px-4 h-14">
          <button className="md:hidden text-[var(--text)]" onClick={() => setOpen(true)} aria-label="Apri menu">
            <Menu size={22} />
          </button>
          <h1 className="font-bold flex-1 truncate">{SECTIONS[section].label}</h1>
          <span className="text-sm text-[var(--muted)] truncate hidden sm:block">{character.name}</span>
        </div>
      </header>

      {/* Active section */}
      <main className="px-4 py-5 pb-32 mx-auto max-w-2xl">
        <Active character={character} update={update} />
      </main>

      <RollToast />
      <CritFx />
      <RollModeToggle />
      <RollLog />
    </div>
  );
}
