"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthReady } from "@/lib/firebaseClient";
import { useTechnicians } from "@/lib/useTechnicians";
import { SideNav } from "./SideNav";
import { BottomNav } from "./BottomNav";
import { Wrench, Menu, X } from "lucide-react";
import { Button } from "./ui";

function emailToUsername(email: string) {
  return email.split("@")[0].trim().toLowerCase();
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const technicians = useTechnicians();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authIsAnonymous, setAuthIsAnonymous] = useState(false);

  const selectedTechnicianId = useMemo(() => {
    if (!authEmail) return null;
    return emailToUsername(authEmail);
  }, [authEmail]);

  const effectiveSelectedTechnicianId = useMemo(() => {
    if (selectedTechnicianId && technicians.some((t) => t.id === selectedTechnicianId)) {
      return selectedTechnicianId;
    }
    return null;
  }, [selectedTechnicianId, technicians]);

  const selectedTechnicianName = useMemo(() => {
    if (!effectiveSelectedTechnicianId) return "Guest";
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

  const isPublicPath = pathname === "/" || pathname === "/login" || pathname.startsWith("/admin");
  
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

  const isLoading = !authReady;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:border-r lg:border-border lg:bg-card">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">MADMANREP</div>
                <div className="text-xs text-muted-foreground">Maintenance</div>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
              <SideNav mobile={false} />
            </div>
            
            {/* User Card */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {selectedTechnicianName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedTechnicianName}</p>
                  <p className="text-xs text-muted-foreground">Technician</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64">
          {/* Header - Mobile */}
          <header className="sticky top-0 z-40 lg:hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">MADMANREP</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {selectedTechnicianName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div 
                className="fixed inset-0 bg-black/50 transition-opacity" 
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border animate-slide-up">
                <div className="flex h-14 items-center justify-between px-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    <span className="font-semibold">MADMANREP</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4">
                  <SideNav mobile={true} onNavigate={() => setMobileMenuOpen(false)} />
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen pb-20 lg:pb-0">
            {isLoading ? (
              <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                {children}
              </div>
            )}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

