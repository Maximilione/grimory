"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Heart,
  Shield,
  ChevronRight,
  MoreVertical,
  Copy,
  Trash2,
  BookOpen,
} from "lucide-react";
import { useCharacters } from "@/lib/useCharacters";
import { deleteCharacter, duplicateCharacter } from "@/lib/db";
import { classByKey } from "@/lib/srd";
import { getClasses } from "@/lib/rules";
import { InstallPrompt } from "@/components/InstallPrompt";
import { BackupBar } from "@/components/BackupBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Character } from "@/lib/types";

export default function Home() {
  const characters = useCharacters();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--accent)" }}>
            Grimorio
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">Schede personaggio · D&amp;D 5e (2024)</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mb-5">
        <InstallPrompt />
      </div>

      <div className="flex gap-2 mb-6">
        <Link href="/create" className="btn btn-accent flex-1 text-base py-3">
          <Plus size={18} /> Crea personaggio
        </Link>
        <Link href="/manual" className="btn py-3" title="Manuale">
          <BookOpen size={18} /> Manuale
        </Link>
      </div>

      {characters === undefined ? (
        <p className="text-[var(--muted)] text-sm">Caricamento…</p>
      ) : characters.length === 0 ? (
        <div className="card p-8 text-center text-[var(--muted)] mb-6">
          <p className="mb-1">Nessun personaggio ancora.</p>
          <p className="text-sm">Crea il tuo primo eroe per iniziare.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 mb-8">
          {characters.map((c) => (
            <CharacterCard key={c.id} c={c} />
          ))}
        </ul>
      )}

      <BackupBar />
    </main>
  );
}

function CharacterCard({ c }: { c: Character }) {
  const [menu, setMenu] = useState(false);
  const classList = getClasses(c);
  const cls = classList.length
    ? classList.map((e) => `${classByKey(e.key)?.name ?? e.key} ${e.level}`).join(" / ")
    : c.className;
  const subtitle = [cls, `Liv. ${c.level}`, c.race]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="card overflow-hidden">
      <div className="flex items-center">
        <Link href={`/sheet?c=${c.id}`} className="flex-1 flex items-center gap-3 p-4 min-w-0">
          <div
            className="size-11 rounded-full grid place-items-center font-bold text-lg shrink-0 overflow-hidden"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {c.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatar} alt="" className="size-full object-cover" />
            ) : (
              c.name.trim().charAt(0).toUpperCase() || "?"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{c.name}</p>
            <p className="text-sm text-[var(--muted)] truncate">{subtitle || "—"}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--muted)] shrink-0">
            <span className="flex items-center gap-1">
              <Heart size={14} style={{ color: "var(--ember)" }} />
              {c.currentHp}
            </span>
            <span className="flex items-center gap-1">
              <Shield size={14} />
              {c.armorClass}
            </span>
            <ChevronRight size={18} />
          </div>
        </Link>
        <button
          className="px-3 self-stretch text-[var(--muted)]"
          onClick={() => setMenu((m) => !m)}
          aria-label="Azioni"
        >
          <MoreVertical size={18} />
        </button>
      </div>
      {menu && (
        <div className="flex gap-2 px-4 pb-3 pt-1 border-t border-[var(--border)]">
          <button
            className="btn btn-ghost text-sm"
            onClick={async () => {
              await duplicateCharacter(c.id);
              setMenu(false);
            }}
          >
            <Copy size={15} /> Duplica
          </button>
          <button
            className="btn btn-danger btn-ghost text-sm"
            onClick={async () => {
              if (confirm(`Eliminare "${c.name}"? Azione irreversibile.`)) {
                await deleteCharacter(c.id);
              }
            }}
          >
            <Trash2 size={15} /> Elimina
          </button>
        </div>
      )}
    </li>
  );
}
