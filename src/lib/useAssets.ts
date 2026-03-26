"use client";

import { useEffect, useState } from "react";
import type { Asset } from "@/lib/assetTypes";
import { db, ensureAnonymousAuth } from "@/lib/firebaseClient";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const q = query(collection(db, "assets"), orderBy("updatedAt", "desc"));
    let unsub: null | (() => void) = null;
    let alive = true;

    void ensureAnonymousAuth().then(({ user, error }) => {
      if (!alive) return;
      if (error || !user) {
        console.error("Assets hook auth failed:", error);
        setAssets([]);
        return;
      }

      unsub = onSnapshot(
        q,
        (snap) => {
          const next: Asset[] = [];
          snap.forEach((doc) => {
            next.push({ id: doc.id, ...(doc.data() as Omit<Asset, "id">) });
          });
          setAssets(next);
        },
        (err) => {
          console.error("Firestore assets snapshot error", err);
          setAssets([]);
        },
      );
    });

    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  return assets;
}
