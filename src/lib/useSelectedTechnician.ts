"use client";

import { useEffect, useState } from "react";
import { auth, onAuthReady } from "@/lib/firebaseClient";
import { TECHNICIANS, TECHNICIAN_STORAGE_KEY } from "@/lib/technicians";

function emailToUsername(email: string) {
  return email.split("@")[0].trim().toLowerCase();
}

export function useSelectedTechnicianId() {
  const [technicianId, setTechnicianId] = useState<string>(() => {
    const fallbackId = TECHNICIANS[0]?.id ?? "tech-1";

    // If there is already a logged-in user (persisted session), prefer it.
    const current = auth.currentUser;
    const email = current?.email;
    if (email) return emailToUsername(email);

    // Fallback for older sessions (before we switched to auth-based identity).
    if (typeof window === "undefined") return fallbackId;
    return window.localStorage.getItem(TECHNICIAN_STORAGE_KEY) ?? fallbackId;
  });

  useEffect(() => {
    const unsub = onAuthReady((user) => {
      const fallbackId = TECHNICIANS[0]?.id ?? "tech-1";
      const u = user as { email?: string } | null;
      // `user` can be null while auth is resolving; guard before reading properties.
      const isAnon = Boolean(u && (user as { isAnonymous?: boolean }).isAnonymous);
      if (!u || isAnon) {
        setTechnicianId(fallbackId);
        return;
      }
      const email = u.email;
      if (!email) return;

      const id = emailToUsername(email);
      setTechnicianId(id);
      if (typeof window !== "undefined") window.localStorage.setItem(TECHNICIAN_STORAGE_KEY, id);
    });
    return () => unsub();
  }, []);

  return technicianId;
}

