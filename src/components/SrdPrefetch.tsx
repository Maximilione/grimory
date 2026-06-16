"use client";

import { useEffect } from "react";
import { prefetchSrd } from "@/lib/srdApi";

let started = false;

/** Warms the common SRD datasets into the persistent cache, once, in the
 * background after load. Silent: failures (offline) are ignored. */
export function SrdPrefetch() {
  useEffect(() => {
    if (started) return;
    started = true;
    const run = () => prefetchSrd().catch(() => {});
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(run);
    else setTimeout(run, 1500);
  }, []);
  return null;
}
