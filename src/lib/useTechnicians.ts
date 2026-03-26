"use client";

import { useEffect, useState } from "react";
import type { Technician } from "@/lib/technicians";
import { db, ensureAnonymousAuth } from "@/lib/firebaseClient";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  useEffect(() => {
    const q = query(collection(db, "technicians"), orderBy("name", "asc"));
    let unsub: null | (() => void) = null;
    let alive = true;

    void ensureAnonymousAuth().then(({ user, error }) => {
      if (!alive) return;
      if (error || !user) {
        console.error("Technicians hook auth failed:", error);
        setTechnicians([]);
        return;
      }

      unsub = onSnapshot(
        q,
        (snap) => {
          const next: Technician[] = [];
          snap.forEach((doc) => next.push({ id: doc.id, ...(doc.data() as Omit<Technician, "id">) }));
          setTechnicians(next);
        },
        (err) => {
          console.error("Firestore technicians snapshot error", err);
          setTechnicians([]);
        },
      );
    });

    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  return technicians;
}

