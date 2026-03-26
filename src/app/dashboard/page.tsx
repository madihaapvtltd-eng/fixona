"use client";

import { useEffect, useMemo, useState } from "react";
import { useTasks } from "@/lib/useTasks";
import Link from "next/link";
import TaskCard from "@/components/TaskCard";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui";
import { Plus, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react";

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
    <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your maintenance tasks</p>
        </div>
        <Link href="/tasks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Tasks</p>
                <p className="text-3xl font-bold mt-1">{stats.open}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Circle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-1">{stats.inProgress}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-1">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preventive Due */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Preventive Due
                </CardTitle>
                <CardDescription>Tasks requiring attention</CardDescription>
              </div>
              <Badge variant="outline">{duePreventiveTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {duePreventiveTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                <p>No preventive tasks due</p>
                <p className="text-sm mt-1">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {duePreventiveTasks.map((t) => (
                  <TaskCard key={t.id} task={t} showDue={true} nowMs={nowMs} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Updates */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Latest Updates
                </CardTitle>
                <CardDescription>Recently modified tasks</CardDescription>
              </div>
              <Badge variant="outline">{recent.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Circle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No tasks yet</p>
                <Link href="/tasks/new">
                  <Button variant="outline" className="mt-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((t) => (
                  <TaskCard key={t.id} task={t} showLatestText={true} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

