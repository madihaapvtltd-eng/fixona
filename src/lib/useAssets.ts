"use client";

import { useEffect, useState } from "react";
import type { Asset } from "@/lib/assetTypes";
import { db } from "@/lib/firebaseClient";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const q = query(collection(db, "assets"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const next: Asset[] = [];
      snap.forEach((doc) => {
        next.push({ id: doc.id, ...(doc.data() as Omit<Asset, "id">) });
      });
      setAssets(next);
    });
    return () => unsub();
  }, []);

  return assets;
}

