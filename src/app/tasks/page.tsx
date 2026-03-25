"use client";

import { useEffect, useMemo, useState } from "react";
import { useTasks } from "@/lib/useTasks";
import type { TaskStatus, TaskType } from "@/lib/taskTypes";
import Link from "next/link";
import TaskCard from "@/components/TaskCard";

export default function TasksPage() {
  const tasks = useTasks();
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [taskType, setTaskType] = useState<"all" | TaskType>("all");
  const [q, setQ] = useState("");
  const [nowMs, setNowMs] = useState<number>(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tasks
      .filter((t) => (status === "all" ? true : t.status === status))
      .filter((t) => (taskType === "all" ? true : t.taskType === taskType))
      .filter((t) => {
        if (!query) return true;
        return (
          t.title.toLowerCase().includes(query) ||
          t.assetLabel.toLowerCase().includes(query) ||
          t.assignedTechnicianName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.latestUpdateAt - a.latestUpdateAt);
  }, [tasks, status, taskType, q]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Tasks</h1>
          <p className="text-sm text-zinc-600">Create / edit / delete tasks and add updates.</p>
        </div>
        <Link
          href="/tasks/new"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + New
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div>
          <div className="text-xs text-zinc-600">Status</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <div className="text-xs text-zinc-600">Type</div>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as typeof taskType)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="all">All</option>
            <option value="preventive">Preventive</option>
            <option value="repair">Repair</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <div className="text-xs text-zinc-600">Search</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="title, asset, technician..."
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-zinc-600">No tasks match your filters.</div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {filtered.map((t) => (
              <div key={t.id} className="p-4">
                <TaskCard task={t} showDue={true} nowMs={nowMs} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

