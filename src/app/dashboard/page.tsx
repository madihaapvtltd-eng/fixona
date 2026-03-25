"use client";

import { useEffect, useMemo, useState } from "react";
import { useTasks } from "@/lib/useTasks";
import Link from "next/link";
import TaskCard from "@/components/TaskCard";

export default function DashboardPage() {
  const tasks = useTasks();
  const [nowMs, setNowMs] = useState<number>(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status === "open").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { open, inProgress, completed, total: tasks.length };
  }, [tasks]);

  const duePreventiveTasks = useMemo(() => {
    return tasks
      .filter((t) => t.taskType === "preventive" && t.status !== "completed")
      .filter((t) => typeof t.nextReminderAt === "number" && t.nextReminderAt <= nowMs)
      .sort((a, b) => (a.nextReminderAt ?? 0) - (b.nextReminderAt ?? 0))
      .slice(0, 8);
  }, [tasks, nowMs]);

  const recent = useMemo(() => {
    return [...tasks].sort((a, b) => b.latestUpdateAt - a.latestUpdateAt).slice(0, 8);
  }, [tasks]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-600">Your maintenance overview.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/tasks/new"
            className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600"
          >
            + New Task
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-indigo-700">Open</div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-3xl font-semibold text-indigo-950">{stats.open}</div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">In progress</div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12a8 8 0 1 0 16 0" />
                <path d="M12 4v8l5 3" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-3xl font-semibold text-blue-950">{stats.inProgress}</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-emerald-700">Completed</div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-3xl font-semibold text-emerald-950">{stats.completed}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Preventive due</div>
              <div className="text-xs text-zinc-600">Overdue reminders (based on next reminder date)</div>
            </div>
            <div className="text-xs text-zinc-500">{duePreventiveTasks.length} due</div>
          </div>

          {duePreventiveTasks.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-600">No preventive tasks due yet. Create one from “New Task”.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {duePreventiveTasks.map((t) => (
                <TaskCard key={t.id} task={t} showDue={true} nowMs={nowMs} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold text-zinc-900">Latest updates</div>
          <div className="mt-2 space-y-2">
            {recent.length === 0 ? (
              <div className="text-sm text-zinc-600">No tasks yet. Create your first task.</div>
            ) : (
              recent.map((t) => <TaskCard key={t.id} task={t} showLatestText={true} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

