"use client";

import { useRef, useState } from "react";
import { Download, Upload, ShieldCheck } from "lucide-react";
import { exportAll, importFile } from "@/lib/backup";

/** Manual export/import controls. The reassurance line that data is safe. */
export function BackupBar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
    </div>
  );
}
