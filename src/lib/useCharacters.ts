"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { db, saveCharacter } from "./db";
import type { Character } from "./types";

/** Live list of all characters, newest first. `undefined` while loading. */
export function useCharacters(): Character[] | undefined {
  return useLiveQuery(() =>
    db.characters.orderBy("updatedAt").reverse().toArray(),
  );
}

/** Live single character + an updater that persists + auto-backs-up. */
export function useCharacter(id: string | null) {
  const character = useLiveQuery(
    () => (id ? db.characters.get(id) : undefined),
    [id],
  );

  const update = useCallback(
    async (mutator: (draft: Character) => void) => {
      if (!id) return;
      const current = await db.characters.get(id);
      if (!current) return;
      mutator(current);
      await saveCharacter(current);
    },
    [id],
  );

  return { character, update };
}
