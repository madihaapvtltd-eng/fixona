"use client";

import { useEffect, useState } from "react";
import type { TaskLog } from "@/lib/taskTypes";
import { db, ensureAnonymousAuth } from "@/lib/firebaseClient";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

export function useTaskLogs(taskId?: string) {
  const [logs, setLogs] = useState<TaskLog[]>([]);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const q = query(
      collection(db, "taskLogs"),
      where("taskId", "==", taskId),
      orderBy("createdAt", "desc"),
    );

    let unsub: null | (() => void) = null;
    let alive = true;

    void ensureAnonymousAuth().then(({ user, error }) => {
      if (!alive) return;
      if (error || !user) {
        console.error("TaskLogs hook auth failed:", error);
        setLogs([]);
        return;
      }

      unsub = onSnapshot(
        q,
        (snap) => {
          const next: TaskLog[] = [];
          snap.forEach((doc) => next.push({ id: doc.id, ...(doc.data() as Omit<TaskLog, "id">) }));
          setLogs(next);
        },
        (err) => {
          console.error("Firestore taskLogs snapshot error", err);
          setLogs([]);
        },
      );
    });

    return () => {
      alive = false;
      unsub?.();
    };
  }, [taskId]);

  return logs;
}

