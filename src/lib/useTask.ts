"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/taskTypes";
import { db, ensureAnonymousAuth } from "@/lib/firebaseClient";
import { doc, onSnapshot } from "firebase/firestore";

export function useTask(taskId?: string) {
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const ref = doc(db, "tasks", taskId);
    let unsub: null | (() => void) = null;
    let alive = true;

    void ensureAnonymousAuth().finally(() => {
      if (!alive) return;

      unsub = onSnapshot(
        ref,
        (d) => {
          if (!d.exists()) {
            setTask(null);
            return;
          }
          setTask({ id: d.id, ...(d.data() as Omit<Task, "id">) });
        },
        (err) => {
          console.error("Firestore task snapshot error", err);
          setTask(null);
        },
      );
    });

    return () => {
      alive = false;
      unsub?.();
    };
  }, [taskId]);

  return task;
}

