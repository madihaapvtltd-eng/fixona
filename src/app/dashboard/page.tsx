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
          <p className="text-sm text-zinc-600">Local test mode: no user login required.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/tasks/new"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            + New Task
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm text-zinc-600">Open</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{stats.open}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm text-zinc-600">In progress</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{stats.inProgress}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm text-zinc-600">Completed</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{stats.completed}</div>
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

