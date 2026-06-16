"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload, ShieldCheck, DatabaseZap, Check, Loader2 } from "lucide-react";
import { exportAll, importFile } from "@/lib/backup";
import { prefetchSrd, srdCacheReady } from "@/lib/srdApi";

/** Manual export/import + offline SRD-data download. */
export function BackupBar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [srd, setSrd] = useState<"checking" | "ready" | "missing" | "downloading">("checking");

  useEffect(() => {
    srdCacheReady().then((ok) => setSrd(ok ? "ready" : "missing"));
  }, []);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importFile(await file.text(), "replace");
      setMsg(`Importati: ${res.added} nuovi, ${res.replaced} aggiornati.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Import fallito");
    }
    e.target.value = "";
  }

  async function downloadSrd() {
    setSrd("downloading");
    await prefetchSrd();
    setSrd((await srdCacheReady()) ? "ready" : "missing");
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-3">
        <ShieldCheck size={16} style={{ color: "var(--good)" }} />
        <span>Dati salvati sul dispositivo + backup automatico. Esporta per sicurezza extra.</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className="btn" onClick={() => exportAll()}>
          <Download size={16} /> Esporta backup
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Importa
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
      </div>
      {msg && <p className="text-sm mt-3" style={{ color: "var(--accent)" }}>{msg}</p>}

      {/* offline SRD data */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
        <div className="text-sm text-[var(--muted)] flex items-center gap-2 min-w-0">
          {srd === "ready" ? (
            <><Check size={16} style={{ color: "var(--good)" }} /> Dati manuale scaricati (offline pronto)</>
          ) : (
            <><DatabaseZap size={16} style={{ color: "var(--accent)" }} /> Dati manuale (armi, incantesimi, classi…)</>
          )}
        </div>
        {srd !== "ready" && (
          <button className="btn shrink-0" onClick={downloadSrd} disabled={srd === "downloading" || srd === "checking"}>
            {srd === "downloading" ? <><Loader2 size={15} className="animate-spin" /> Scarico…</> : "Scarica offline"}
          </button>
        )}
      </div>
    </div>
  );
}
