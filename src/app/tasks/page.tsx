"use client";

import { useEffect, useMemo, useState } from "react";
import { useTasks } from "@/lib/useTasks";
import type { TaskStatus, TaskType } from "@/lib/taskTypes";
import Link from "next/link";
import TaskCard from "@/components/TaskCard";
import { Button, Card, CardContent, Badge, Select, Input } from "@/components/ui";
import { Plus, Search, SlidersHorizontal, ClipboardList } from "lucide-react";

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

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "preventive", label: "Preventive" },
    { value: "repair", label: "Repair" },
  ];

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track maintenance tasks</p>
        </div>
        <Link href="/tasks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<Search className="h-4 w-4" />}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tasks, assets, technicians..."
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                options={statusOptions}
              />
              <Select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as typeof taskType)}
                options={typeOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filtered.length} of {tasks.length} tasks
          </span>
        </div>
        <div className="flex gap-2">
          {status !== "all" && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => setStatus("all")}>
              Status: {status} ×
            </Badge>
          )}
          {taskType !== "all" && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => setTaskType("all")}>
              Type: {taskType} ×
            </Badge>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {q || status !== "all" || taskType !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first task"}
              </p>
              <Link href="/tasks/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filtered.map((t) => (
            <TaskCard key={t.id} task={t} showDue={true} nowMs={nowMs} />
          ))
        )}
      </div>
    </div>
  );
}

