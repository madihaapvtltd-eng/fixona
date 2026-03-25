"use client";

import { useEffect, useState } from "react";
import type { Technician } from "@/lib/technicians";
import { db } from "@/lib/firebaseClient";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  useEffect(() => {
    const q = query(collection(db, "technicians"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const next: Technician[] = [];
      snap.forEach((doc) => next.push({ id: doc.id, ...(doc.data() as Omit<Technician, "id">) }));
      setTechnicians(next);
    });

    return () => unsub();
  }, []);

  return technicians;
}

