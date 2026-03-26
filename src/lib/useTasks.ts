"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/taskTypes";
import { db, ensureAnonymousAuth } from "@/lib/firebaseClient";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("latestUpdateAt", "desc"));
    let unsub: null | (() => void) = null;
    let alive = true;

    void ensureAnonymousAuth().then(({ user, error }) => {
      if (!alive) return;
      if (error || !user) {
        console.error("Tasks hook auth failed:", error);
        setTasks([]);
        return;
      }

      unsub = onSnapshot(
        q,
        (snap) => {
          const next: Task[] = [];
          snap.forEach((doc) => {
            next.push({ id: doc.id, ...(doc.data() as Omit<Task, "id">) });
          });
          setTasks(next);
        },
        (err) => {
          console.error("Firestore tasks snapshot error", err);
          setTasks([]);
        },
      );
    });

    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  return tasks;
}

