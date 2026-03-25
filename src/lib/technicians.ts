export type Technician = {
  id: string;
  name: string;
};

export const TECHNICIAN_STORAGE_KEY = "madihaa_selected_technician_v1";
export const TECHNICIANS_STORAGE_KEY = "madihaa_technicians_v1";
export const TECHNICIANS_CHANGED_EVENT = "madihaa-technicians-change";

import { db } from "@/lib/firebaseClient";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";

export async function createTechnician(name: string, opts?: { id?: string }) {
  const cleanName = name.trim();
  if (!cleanName) return;

  const id = (opts?.id ?? `tech-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 6)}`).trim();
  await setDoc(doc(db, "technicians", id), { name: cleanName });
}

export async function updateTechnician(id: string, name: string) {
  const cleanName = name.trim();
  if (!cleanName) return;
  await updateDoc(doc(db, "technicians", id), { name: cleanName });
}

export async function deleteTechnician(id: string) {
  await deleteDoc(doc(db, "technicians", id));
}

