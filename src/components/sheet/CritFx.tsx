"use client";

import { useEffect, useRef, useState } from "react";
import { useRoll } from "@/lib/rollStore";

/**
 * Full-screen flourish when a d20 roll is a natural 20 (gold burst + sparks)
 * or a natural 1 (red shake + vignette). Driven by the latest roll entry;
 * each entry fires once. Purely decorative, pointer-events: none.
 */
export function CritFx() {
  const last = useRoll((s) => s.last);
  const [fx, setFx] = useState<null | "crit" | "fumble">(null);
  const lastId = useRef(0);

  useEffect(() => {
    if (!last || last.id === lastId.current) return;
    lastId.current = last.id;
    if (last.crit) setFx("crit");
    else if (last.fumble) setFx("fumble");
    else return;
    const t = setTimeout(() => setFx(null), 1150);
    return () => clearTimeout(t);
  }, [last]);

  // also nudge the whole document on fumble for a tactile shake
  useEffect(() => {
    if (fx !== "fumble") return;
    const root = document.getElementById("app-shake");
    root?.classList.add("fx-shake");
    const t = setTimeout(() => root?.classList.remove("fx-shake"), 520);
    return () => clearTimeout(t);
  }, [fx]);

  if (!fx) return null;

  if (fx === "fumble") {
    return (
      <div className="fx-overlay">
        <div className="fx-fumble-bg" />
        <span className="fx-text fx-fumble-text text-5xl">FALLIMENTO</span>
      </div>
    );
  }

  // crit: gold burst + radial sparks
  const sparks = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 120 + (i % 3) * 40;
    return { dx: `${Math.cos(angle) * dist}px`, dy: `${Math.sin(angle) * dist}px`, delay: (i % 5) * 0.03 };
  });

  return (
    <div className="fx-overlay">
      <div className="fx-crit-bg" />
      <div className="relative grid place-items-center">
        {sparks.map((s, i) => (
          <span
            key={i}
            className="fx-spark"
            style={{ ["--dx" as string]: s.dx, ["--dy" as string]: s.dy, animationDelay: `${s.delay}s` }}
          />
        ))}
        <span className="fx-text fx-crit-text text-6xl">CRITICO!</span>
      </div>
    </div>
  );
}
