"use client";

import { useMemo } from "react";
import { TECHNICIAN_STORAGE_KEY, type Technician } from "@/lib/technicians";
import { useTechnicians } from "@/lib/useTechnicians";

export default function TechnicianSelect({
  selectedId,
  onChange,
}: {
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const technicians = useTechnicians();

  const handleChange = (value: string) => {
    onChange(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TECHNICIAN_STORAGE_KEY, value);
      window.dispatchEvent(
        new CustomEvent("madihaa-technician-change", { detail: { technicianId: value } }),
      );
    }
  };

  const selected: Technician | undefined = useMemo(
    () => technicians.find((t) => t.id === selectedId),
    [selectedId, technicians],
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-600">Working as</span>
      <select
        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
        value={selected?.id ?? technicians[0]?.id}
        onChange={(e) => handleChange(e.target.value)}
      >
        {technicians.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

