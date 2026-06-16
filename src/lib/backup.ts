// Export / import of the whole collection as a JSON file. This is the user's
// portable, manual safety net on top of IndexedDB + the localStorage mirror.

import { db, snapshotBackup, newCharacter } from "./db";
import type { Character } from "./types";

interface BackupFile {
  app: "dnd-sheets";
  version: 1;
  exportedAt: number;
  characters: Character[];
}

export async function exportAll(): Promise<void> {
  const characters = await db.characters.toArray();
  const payload: BackupFile = {
    app: "dnd-sheets",
    version: 1,
    exportedAt: Date.now(),
    characters,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date(payload.exportedAt).toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `dnd-sheets-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  added: number;
  replaced: number;
}

/**
 * Import a backup file. Existing characters with the same id are replaced;
 * `mode: "merge-copy"` instead imports everything as new copies (safe import).
 */
export async function importFile(
  text: string,
  mode: "replace" | "merge-copy" = "replace",
): Promise<ImportResult> {
  const parsed = JSON.parse(text);
  const list: Character[] = Array.isArray(parsed) ? parsed : parsed.characters;
  if (!Array.isArray(list)) throw new Error("File non valido: nessun personaggio trovato");

  let added = 0;
  let replaced = 0;
  for (const raw of list) {
    if (mode === "merge-copy") {
      await db.characters.put(newCharacter({ ...raw, name: `${raw.name} (import)` }));
      added++;
    } else {
      const exists = await db.characters.get(raw.id);
      await db.characters.put(raw);
      exists ? replaced++ : added++;
    }
  }
  await snapshotBackup();
  return { added, replaced };
}
