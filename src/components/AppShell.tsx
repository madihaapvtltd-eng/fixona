"use client";

import { useEffect, useMemo, useState } from "react";
import SideNav from "@/components/SideNav";
import BottomNav from "@/components/BottomNav";
import TechnicianSelect from "@/components/TechnicianSelect";
import { TECHNICIAN_STORAGE_KEY } from "@/lib/technicians";
import { useTechnicians } from "@/lib/useTechnicians";
import Image from "next/image";
import { ensureAnonymousAuth } from "@/lib/firebaseClient";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const technicians = useTechnicians();
  const defaultTechId =
    (typeof window !== "undefined" && window.localStorage.getItem(TECHNICIAN_STORAGE_KEY)) ||
    technicians[0]?.id ||
    "tech-1";
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(defaultTechId);
  const effectiveSelectedTechnicianId = useMemo(() => {
    if (technicians.some((t) => t.id === selectedTechnicianId)) return selectedTechnicianId;
    return technicians[0]?.id ?? selectedTechnicianId;
  }, [selectedTechnicianId, technicians]);

  const selectedTechnicianName = useMemo(() => {
    return technicians.find((t) => t.id === effectiveSelectedTechnicianId)?.name ?? "Technician";
  }, [effectiveSelectedTechnicianId, technicians]);

  useEffect(() => {
    void ensureAnonymousAuth();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-screen">
        <SideNav />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Image src="/images/logo.png" alt="MADMANREP" width={32} height={32} className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">MADMANREP</div>
                  <div className="truncate text-xs text-zinc-500">Maintenance & Repair • Local test</div>
                </div>
              </div>

              <TechnicianSelect selectedId={effectiveSelectedTechnicianId} onChange={setSelectedTechnicianId} />
            </div>
          </header>

          <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6" aria-label="Main content">
            {children}
            <div className="mt-8 text-xs text-zinc-400 md:hidden">
              Signed in as: <span className="font-medium">{selectedTechnicianName}</span>
            </div>
          </main>

          <BottomNav />
        </div>
      </div>
    </div>
  );
}

