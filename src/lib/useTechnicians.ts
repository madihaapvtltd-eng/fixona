"use client";

import { useEffect, useRef, useState } from "react";
import type { Technician } from "@/lib/technicians";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs, onSnapshot, orderBy, query, setDoc, doc } from "firebase/firestore";

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const didSeedRef = useRef(false);

  useEffect(() => {
    const q = query(collection(db, "technicians"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const next: Technician[] = [];
      snap.forEach((doc) => next.push({ id: doc.id, ...(doc.data() as Omit<Technician, "id">) }));
      setTechnicians(next);
    });

    return () => unsub();
  }, []);

  // If technicians collection is empty, seed 10 defaults (local dev).
  useEffect(() => {
    if (technicians.length > 0) return;
    if (didSeedRef.current) return;
    didSeedRef.current = true;

    const seed = async () => {
      const snap = await getDocs(collection(db, "technicians"));
      if (!snap.empty) return;

      for (let i = 1; i <= 10; i++) {
        const id = `tech-${i}`;
        await setDoc(doc(db, "technicians", id), { name: `Technician ${i}` });
      }
    };

    void seed();
  }, [technicians.length]);

  return technicians;
}

