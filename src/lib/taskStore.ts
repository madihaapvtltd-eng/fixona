"use client";

import type { Task, TaskLog } from "@/lib/taskTypes";
import { db } from "@/lib/firebaseClient";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";

export function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).randomUUID() as string;
  }
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export async function deleteTask(taskId: string) {
  await deleteDoc(doc(db, "tasks", taskId));

  const q = query(collection(db, "taskLogs"), where("taskId", "==", taskId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function upsertTask(task: Task) {
  // Firestore does NOT allow `undefined` values in document fields.
  // Remove any keys whose value is `undefined` before writing.
  const sanitized: Task = Object.fromEntries(
    Object.entries(task).filter(([, v]) => v !== undefined),
  ) as Task;

  await setDoc(doc(db, "tasks", task.id), sanitized);
}

export async function addTaskLog(log: TaskLog) {
  // Firestore does NOT allow `undefined` values in document fields.
  const sanitized: TaskLog = Object.fromEntries(
    Object.entries(log).filter(([, v]) => v !== undefined),
  ) as TaskLog;

  await setDoc(doc(db, "taskLogs", log.id), sanitized);
}

