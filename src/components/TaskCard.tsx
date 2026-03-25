"use client";

import Link from "next/link";
import type { Task } from "@/lib/taskTypes";

function humanStatus(status: Task["status"]) {
  if (status === "in_progress") return "In Progress";
  if (status === "open") return "Open";
  return "Completed";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString();
}

export default function TaskCard({
  task,
  nowMs,
  showDue = false,
  showLatestText = false,
}: {
  task: Task;
  nowMs?: number;
  showDue?: boolean;
  showLatestText?: boolean;
}) {
  const statusStyle =
    task.status === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : task.status === "in_progress"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-zinc-100 text-zinc-700 border-zinc-200";

  const progressWidth = `${clamp(task.progressPercent ?? 0, 0, 100)}%`;

  let dueLabel: string | null = null;
  if (showDue && task.taskType === "preventive" && typeof task.nextReminderAt === "number") {
    const next = task.nextReminderAt;
    const labelDate = formatDate(next);
    if (typeof nowMs === "number" && next <= nowMs) dueLabel = `Overdue • ${labelDate}`;
    else dueLabel = `Due • ${labelDate}`;
  }

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900">{task.title}</div>
          <div className="mt-1 text-xs text-zinc-600">
            {task.assetType.toUpperCase()} • {task.assetLabel}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Assigned: {task.assignedTechnicianName}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`rounded-full border px-3 py-1 text-[11px] font-medium ${statusStyle}`}>
            {humanStatus(task.status)}
          </div>
          {showDue && dueLabel ? (
            <div className="text-[11px] text-zinc-500">{dueLabel}</div>
          ) : (
            <div className="text-[11px] text-zinc-400">{/* spacing */}</div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-medium text-zinc-600">Progress</div>
          <div className="text-[11px] text-zinc-500">{task.progressPercent}%</div>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-zinc-200">
          <div className="h-2 rounded-full bg-zinc-900" style={{ width: progressWidth }} />
        </div>
      </div>

      {showLatestText ? (
        <div className="mt-3 text-xs text-zinc-700">
          <div className="text-[11px] text-zinc-500">Latest update</div>
          <div className="mt-1 line-clamp-2">{task.latestUpdateText}</div>
          <div className="mt-2 text-[11px] text-zinc-400">{formatDate(task.latestUpdateAt)}</div>
        </div>
      ) : null}
    </Link>
  );
}

