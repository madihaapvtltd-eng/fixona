"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/taskTypes";
import { db } from "@/lib/firebaseClient";
import { doc, onSnapshot } from "firebase/firestore";

export function useTask(taskId?: string) {
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const ref = doc(db, "tasks", taskId);
    const unsub = onSnapshot(ref, (d) => {
      if (!d.exists()) {
        setTask(null);
        return;
      }
      setTask({ id: d.id, ...(d.data() as Omit<Task, "id">) });
    });

    return () => unsub();
  }, [taskId]);

  return task;
}

