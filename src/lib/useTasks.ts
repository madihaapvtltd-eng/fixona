"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/taskTypes";
import { db } from "@/lib/firebaseClient";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("latestUpdateAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const next: Task[] = [];
      snap.forEach((doc) => {
        next.push({ id: doc.id, ...(doc.data() as Omit<Task, "id">) });
      });
      setTasks(next);
    });
    return () => unsub();
  }, []);

  return tasks;
}

