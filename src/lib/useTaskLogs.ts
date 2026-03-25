"use client";

import { useEffect, useState } from "react";
import type { TaskLog } from "@/lib/taskTypes";
import { db } from "@/lib/firebaseClient";
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

    const unsub = onSnapshot(q, (snap) => {
      const next: TaskLog[] = [];
      snap.forEach((doc) => next.push({ id: doc.id, ...(doc.data() as Omit<TaskLog, "id">) }));
      setLogs(next);
    });

    return () => unsub();
  }, [taskId]);

  return logs;
}

