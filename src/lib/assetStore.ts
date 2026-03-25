"use client";

import type { Asset } from "@/lib/assetTypes";
import { makeId } from "@/lib/taskStore";
import { db } from "@/lib/firebaseClient";
import { collection, deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";

export function createAsset(input: Omit<Asset, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const asset: Asset = { ...input, id: makeId(), createdAt: now, updatedAt: now };
  void setDoc(doc(collection(db, "assets"), asset.id), asset);
  return asset;
}

export function updateAsset(id: string, patch: Partial<Omit<Asset, "id" | "createdAt">>) {
  const now = Date.now();
  const next = { ...patch, updatedAt: now } satisfies Partial<Asset>;
  void updateDoc(doc(db, "assets", id), next);
}

export function deleteAsset(id: string) {
  void deleteDoc(doc(db, "assets", id));
}

export function updateAssetLastServiced(assetId: string, serviceDate: string) {
  if (!assetId || !serviceDate) return;
  updateAsset(assetId, { lastServicedDate: serviceDate });
}

