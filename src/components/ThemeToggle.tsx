"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/** Light/dark theme switch. Persists the explicit choice; the no-flash script
 * in the layout applies it (or the system preference) before first paint. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const cur = (document.documentElement.dataset.theme as "light" | "dark") || "dark";
    setTheme(cur);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className={`btn btn-ghost px-2.5 ${className}`}
      aria-label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
      title={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
