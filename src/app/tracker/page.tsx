"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Tracker } from "@/components/Tracker";
import { RollToast } from "@/components/sheet/RollToast";

export default function TrackerPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 py-3 mb-2">
        <Link href="/" className="btn btn-ghost px-2">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold font-display">Combattimento</h1>
      </div>
      <Tracker />
      <RollToast />
    </main>
  );
}
