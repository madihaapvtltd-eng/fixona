"use client";

import Link from "next/link";
import type { Task } from "@/lib/taskTypes";
import { Badge, Card } from "./ui";
import { Calendar, User, AlertCircle, Wrench, Building2 } from "lucide-react";

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

function getStatusBadgeVariant(status: Task["status"]) {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "warning";
    default:
      return "outline";
  }
}

function getTaskTypeBadgeVariant(type: Task["taskType"]) {
  return type === "preventive" ? "warning" : "default";
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
  const progressWidth = `${clamp(task.progressPercent ?? 0, 0, 100)}%`;
  const isOverdue = showDue && task.taskType === "preventive" && 
    typeof task.nextReminderAt === "number" &&
    typeof nowMs === "number" &&
    task.nextReminderAt <= nowMs;

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card hover className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{task.assetLabel}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{task.assignedTechnicianName}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant={getStatusBadgeVariant(task.status)}>
              {humanStatus(task.status)}
            </Badge>
            <Badge variant={getTaskTypeBadgeVariant(task.taskType)}>
              {task.taskType === "preventive" ? "Preventive" : "Repair"}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold">{task.progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                task.status === "completed" 
                  ? "bg-green-500" 
                  : task.status === "in_progress" 
                    ? "bg-blue-500" 
                    : "bg-zinc-400"
              }`} 
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        {/* Due Date / Latest Update */}
        {showDue && task.taskType === "preventive" && typeof task.nextReminderAt === "number" && (
          <div className={`mt-3 flex items-center gap-2 text-xs ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {isOverdue ? (
                <>
                  <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                  Overdue • {formatDate(task.nextReminderAt)}
                </>
              ) : (
                `Due ${formatDate(task.nextReminderAt)}`
              )}
            </span>
          </div>
        )}

        {showLatestText && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground mb-1">Latest update</div>
            <p className="text-sm text-foreground line-clamp-2">{task.latestUpdateText}</p>
            <div className="mt-2 text-xs text-muted-foreground">{formatDate(task.latestUpdateAt)}</div>
          </div>
        )}
      </Card>
    </Link>
  );
}

