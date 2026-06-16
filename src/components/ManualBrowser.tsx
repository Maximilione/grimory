"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, BookOpen, ChevronDown } from "lucide-react";
import { CONDITIONS, CONDITION_DESC, ABILITY_NAMES } from "@/lib/srd";
import { SPECIES_2024 } from "@/lib/species2024";
import { FEATS_2024, GENERAL_FEATS } from "@/lib/feats2024";
import { manualSearch, type ManualEntry } from "@/lib/srdApi";

type Cat = "all" | ManualEntry["category"];
const CATS: { key: Cat; label: string }[] = [
  { key: "all", label: "Tutto" },
  { key: "spell", label: "Incantesimi" },
  { key: "monster", label: "Mostri" },
  { key: "item", label: "Oggetti" },
  { key: "rule", label: "Regole" },
];

/** Always-available manual reference: live Open5e search + offline 2024 quick-ref. */
export function ManualBrowser() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("all");
  const [hits, setHits] = useState<ManualEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      setTouched(false);
      return;
    }
    setLoading(true);
    setTouched(true);
    const my = ++seq.current;
    const t = setTimeout(async () => {
      const res = await manualSearch(q, cat);
      if (my === seq.current) {
        setHits(res);
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, cat]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen size={20} style={{ color: "var(--accent)" }} /> Manuale
        </h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Consulta incantesimi, mostri, oggetti e regole (SRD 5.2) + riferimento rapido offline.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input className="field pl-9" placeholder="Cerca nel manuale…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2 -mt-1">
        {CATS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className="text-sm px-3 py-1.5 rounded-full border"
            style={{
              borderColor: cat === c.key ? "var(--accent)" : "var(--border)",
              background: cat === c.key ? "var(--accent-soft)" : "transparent",
              color: cat === c.key ? "var(--accent)" : "var(--muted)",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* search results */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-[var(--muted)] text-sm">
          <Loader2 size={16} className="animate-spin" /> Cerco…
        </div>
      )}
      {!loading && touched && hits.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)] py-6">Nessun risultato (o sei offline).</p>
      )}
      {!loading && hits.length > 0 && (
        <div className="flex flex-col gap-2">
          {hits.map((h) => (
            <Entry key={h.key} name={h.name} type={h.type} desc={h.desc} />
          ))}
        </div>
      )}

      {/* offline quick reference (only when not searching) */}
      {!q.trim() && (
        <div className="flex flex-col gap-3">
          <Group title="Condizioni (2024)">
            {Object.entries(CONDITIONS).map(([key, label]) => (
              <Entry key={key} name={label} type="Condizione" desc={CONDITION_DESC[key] ?? ""} />
            ))}
            <Entry
              name="Sfinimento"
              type="Condizione · livelli 1-6"
              desc="Subisci una penalità ai tiri D20 e alla CD dei tuoi incantesimi pari a 2 × il livello di sfinimento. A 6 muori. Un riposo lungo riduce il livello di 1."
            />
          </Group>
          <Group title="Specie (2024)">
            {SPECIES_2024.map((s) => (
              <Entry
                key={s.key}
                name={s.name}
                type={`Specie · velocità ${s.speed} m`}
                desc={s.traits.map((t) => `• ${t.name}: ${t.desc}`).join("\n")}
              />
            ))}
          </Group>
          <Group title="Talenti (2024)">
            {[...Object.values(FEATS_2024), ...GENERAL_FEATS].map((f) => (
              <Entry key={`${f.category}-${f.name}`} name={f.name} type={`Talento · ${f.category}`} desc={f.desc} />
            ))}
          </Group>
          <Group title="Caratteristiche">
            {Object.values(ABILITY_NAMES).map((n) => (
              <span key={n} className="text-sm text-[var(--muted)] mr-3">{n}</span>
            ))}
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button className="w-full flex items-center justify-between p-3" onClick={() => setOpen((o) => !o)}>
        <span className="font-semibold">{title}</span>
        <ChevronDown size={18} className="transition-transform" style={{ transform: open ? "rotate(180deg)" : "" }} />
      </button>
      {open && <div className="px-3 pb-3 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

function Entry({ name, type, desc }: { name: string; type: string; desc: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button className="w-full text-left p-3" onClick={() => setOpen((o) => !o)}>
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-[var(--muted)]">{type}</p>
      </button>
      {open && desc && (
        <p className="px-3 pb-3 text-sm text-[var(--muted)] whitespace-pre-line leading-relaxed border-t border-[var(--border)] pt-2">
          {desc}
        </p>
      )}
    </div>
  );
}
