"use client";

import { useEffect, useMemo, useState } from "react";
import SideNav from "@/components/SideNav";
import BottomNav from "@/components/BottomNav";
import { useTechnicians } from "@/lib/useTechnicians";
import Image from "next/image";
import { onAuthReady } from "@/lib/firebaseClient";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

function emailToUsername(email: string) {
  return email.split("@")[0].trim().toLowerCase();
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const technicians = useTechnicians();
  const router = useRouter();
  const pathname = usePathname();

  const [authReady, setAuthReady] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authIsAnonymous, setAuthIsAnonymous] = useState(false);

  const selectedTechnicianId = useMemo(() => {
    if (!authEmail) return null;
    return emailToUsername(authEmail);
  }, [authEmail]);

  const effectiveSelectedTechnicianId = useMemo(() => {
    if (selectedTechnicianId && technicians.some((t) => t.id === selectedTechnicianId)) return selectedTechnicianId;
    return null;
  }, [selectedTechnicianId, technicians]);

  const selectedTechnicianName = useMemo(() => {
    if (!effectiveSelectedTechnicianId) return "Technician";
    return technicians.find((t) => t.id === effectiveSelectedTechnicianId)?.name ?? "Technician";
  }, [effectiveSelectedTechnicianId, technicians]);

  useEffect(() => {
    const unsub = onAuthReady((user) => {
      if (!user) {
        setAuthEmail(null);
        setAuthIsAnonymous(false);
        setAuthReady(true);
        return;
      }

      const u = user as { email?: string } | null;
      setAuthEmail(u?.email ?? null);
      setAuthIsAnonymous(Boolean((user as { isAnonymous?: boolean }).isAnonymous));
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  const isPublicPath = pathname === "/" || pathname === "/login" || pathname === "/admin";
  useEffect(() => {
    if (!authReady) return;
    if (isPublicPath) return;
    if (!authEmail) {
      router.replace("/login");
      return;
    }
    if (authIsAnonymous) {
      router.replace("/login");
    }
  }, [authEmail, authIsAnonymous, authReady, isPublicPath, pathname, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <div className="flex min-h-screen">
        <SideNav />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Image src="/images/logo.png" alt="MADMANREP" width={32} height={32} className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">MADMANREP</div>
                  <div className="flex items-center gap-1 truncate text-xs text-indigo-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Maintenance & Repair
                  </div>
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <div className="text-xs text-zinc-500">Working as</div>
                <div className="truncate text-sm font-medium text-zinc-900">{selectedTechnicianName}</div>
              </div>
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

