"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/** Cross-platform "install to home screen" helper. Android/desktop use the
 * native beforeinstallprompt; iOS Safari gets manual Share-sheet instructions. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari
        (window.navigator as unknown as { standalone?: boolean }).standalone === true,
    );
    setDismissed(sessionStorage.getItem("install-dismissed") === "1");
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (standalone || dismissed) return null;
  if (!deferred && !isIOS) return null; // nothing actionable to show

  const close = () => {
    setDismissed(true);
    sessionStorage.setItem("install-dismissed", "1");
  };

  return (
    <div className="card p-4 flex items-start gap-3" style={{ borderColor: "var(--accent-soft)" }}>
      <Download size={20} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
      <div className="flex-1 text-sm">
        <p className="font-semibold mb-1">Installa l&apos;app</p>
        {isIOS ? (
          <p className="text-[var(--muted)] leading-relaxed">
            Tocca <Share size={14} className="inline -mt-0.5" /> Condividi, poi{" "}
            <strong>&quot;Aggiungi a Home&quot;</strong>. Funziona offline e i dati restano sul dispositivo.
          </p>
        ) : (
          <button
            className="btn btn-accent mt-1"
            onClick={async () => {
              await deferred!.prompt();
              await deferred!.userChoice;
              setDeferred(null);
            }}
          >
            Aggiungi a Home
          </button>
        )}
      </div>
      <button onClick={close} className="text-[var(--muted)] p-1" aria-label="Chiudi">
        <X size={18} />
      </button>
    </div>
  );
}
