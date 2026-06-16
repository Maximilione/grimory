"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, BookOpen, Loader2 } from "lucide-react";
import type { SearchHit } from "@/lib/srdApi";

/**
 * Live SRD search modal. Generic over the built type: caller passes the
 * fetcher and an onPick that receives the precompiled partial. Debounced,
 * cancels stale requests, degrades to "nessun risultato / offline" cleanly.
 */
export function SrdSearch<T>({
  title,
  fetcher,
  onPick,
  onClose,
}: {
  title: string;
  fetcher: (q: string) => Promise<SearchHit<T>[]>;
  onPick: (built: T) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    setLoading(true);
    setTouched(true);
    const my = ++seq.current;
    const t = setTimeout(async () => {
      const res = await fetcher(q);
      if (my === seq.current) {
        setHits(res);
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, fetcher]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={onClose}>
      <div
        className="mt-auto md:mt-[10vh] md:mx-auto md:max-w-lg w-full card rounded-b-none md:rounded-b-[var(--radius)] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2 p-3 border-b border-[var(--border)]">
          <BookOpen size={18} style={{ color: "var(--accent)" }} />
          <span className="font-semibold flex-1">{title}</span>
          <button onClick={onClose} className="text-[var(--muted)] p-1" aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>
        <div className="p-3 border-b border-[var(--border)]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="field pl-9"
              placeholder="Cerca nel manuale (SRD 2024)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-[var(--muted)] text-sm">
              <Loader2 size={16} className="animate-spin" /> Cerco…
            </div>
          )}
          {!loading && touched && hits.length === 0 && q.trim() && (
            <p className="text-center text-sm text-[var(--muted)] py-8">
              Nessun risultato (o sei offline). Puoi inserirlo a mano.
            </p>
          )}
          {!loading &&
            hits.map((h) => (
              <button
                key={h.key}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                onClick={() => {
                  onPick(h.build());
                  onClose();
                }}
              >
                <p className="font-medium">{h.name}</p>
                <p className="text-xs text-[var(--muted)]">{h.subtitle}</p>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
