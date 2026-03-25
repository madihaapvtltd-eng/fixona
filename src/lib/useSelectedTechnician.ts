"use client";

import { useEffect, useState } from "react";
import { TECHNICIANS, TECHNICIAN_STORAGE_KEY } from "@/lib/technicians";

export function useSelectedTechnicianId() {
  const [technicianId, setTechnicianId] = useState<string>(() => {
    const fallbackId = TECHNICIANS[0]?.id ?? "tech-1";
    if (typeof window === "undefined") return fallbackId;
    return window.localStorage.getItem(TECHNICIAN_STORAGE_KEY) ?? fallbackId;
  });

  useEffect(() => {
    const onChange = (event: Event) => {
      const e = event as CustomEvent<{ technicianId: string }>;
      if (e?.detail?.technicianId) setTechnicianId(e.detail.technicianId);
    };

    window.addEventListener("madihaa-technician-change", onChange as EventListener);
    return () => window.removeEventListener("madihaa-technician-change", onChange as EventListener);
  }, []);

  return technicianId;
}

