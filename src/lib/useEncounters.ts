"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { db, saveEncounter } from "./db";
import type { Encounter } from "./encounter";

/** Live list of all encounters, newest first. `undefined` while loading. */
export function useEncounters(): Encounter[] | undefined {
  return useLiveQuery(() => db.encounters.orderBy("updatedAt").reverse().toArray());
}

/** Live single encounter + an updater that persists. */
export function useEncounter(id: string | null) {
  const encounter = useLiveQuery(
    async () => (id ? (await db.encounters.get(id)) ?? null : null),
    [id],
  );

  const update = useCallback(
    async (mutator: (draft: Encounter) => void) => {
      if (!id) return;
      const current = await db.encounters.get(id);
      if (!current) return;
      mutator(current);
      await saveEncounter(current);
    },
    [id],
  );

  return { encounter, update };
}
