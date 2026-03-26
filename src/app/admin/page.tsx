"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTechnicians } from "@/lib/useTechnicians";
import { createTechnician } from "@/lib/technicians";
import { addTaskLog, makeId, upsertTask } from "@/lib/taskStore";
import type { AssetType, Task, TaskLog, TaskStatus, TaskType } from "@/lib/taskTypes";
import { useSelectedTechnicianId } from "@/lib/useSelectedTechnician";
import { auth, onAuthReady } from "@/lib/firebaseClient";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Input, Select, Separator } from "@/components/ui";
import { Shield, Users, Plus, ClipboardList, LogOut, KeyRound, AlertCircle } from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminPage() {
  const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase().trim();
  const router = useRouter();
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string>("");

  const technicians = useTechnicians();
  const selectedTechnicianId = useSelectedTechnicianId();

  const selectedTechnicianName =
    technicians.find((t) => t.id === selectedTechnicianId)?.name ?? "Technician";

  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [userError, setUserError] = useState<string>("");

  const [quickTaskTitle, setQuickTaskTitle] = useState("Repair");
  const [assetType, setAssetType] = useState<AssetType>("shop");
  const [assetLabel, setAssetLabel] = useState("Shop 1");
  const [taskType, setTaskType] = useState<TaskType>("repair");
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<string>(selectedTechnicianId);
  const [loggedDate, setLoggedDate] = useState(ymd(new Date()));
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [status, setStatus] = useState<TaskStatus>("open");
  const [latestUpdateText, setLatestUpdateText] = useState("Initial admin entry.");

  const [quickTaskError, setQuickTaskError] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthReady((user) => {
      const u = user as { email?: string } | null;
      setAuthEmail(u?.email ?? null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = useMemo(() => {
    if (!ADMIN_EMAIL) return false;
    return (authEmail ?? "").toLowerCase() === ADMIN_EMAIL;
  }, [ADMIN_EMAIL, authEmail]);

  const shouldRedirect = !authLoading && !!authEmail && !isAdmin;
  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace("/dashboard");
  }, [router, shouldRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Enter email and password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setLoginPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    setLoginError("");
    await signOut(auth);
  };

  if (!ADMIN_EMAIL) {
    return (
      <div className="container mx-auto p-4 lg:p-6 max-w-5xl">
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Admin email not configured</h2>
            <p className="text-muted-foreground">Set NEXT_PUBLIC_ADMIN_EMAIL in your environment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 lg:p-6 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      </div>
    );
  }

  if (!authEmail || !isAdmin) {
    return (
      <div className="container mx-auto p-4 lg:p-6 max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-center">Admin Access</CardTitle>
            <CardDescription className="text-center">
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              <Input
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
              />
              {loginError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  {loginError}
                </div>
              )}
              <Button type="submit" className="w-full">
                <KeyRound className="h-4 w-4 mr-2" />
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
                type="submit"
                className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
              >
                Sign in as admin
              </button>
            </div>
          </form>

          <div className="mt-3 text-xs text-zinc-500">
            Admin email must match: <span className="font-medium">{ADMIN_EMAIL}</span>
          </div>
        </div>
      </div>
    );
  }

  const onAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");

    const username = newUserUsername.trim().toLowerCase();
    const password = newUserPassword;
    if (!username || !password) return;

    const domain = (process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN ?? "madmanrep.mv").trim().toLowerCase();
    const email = `${username}@${domain}`;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await createTechnician(username, { id: username });
      setNewUserUsername("");
      setNewUserPassword("");
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const onQuickCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickTaskError("");

    const now = Date.now();
    const id = makeId();

    const assignedTechnicianName =
      technicians.find((t) => t.id === assignedTechnicianId)?.name ?? selectedTechnicianName;

    const task: Task = {
      id,
      title: quickTaskTitle.trim() || "Untitled task",
      assetType,
      assetLabel: assetLabel.trim() || "Unknown asset",
      assetId: undefined,
      taskType,
      assignedTechnicianId,
      assignedTechnicianName,
      loggedDate,
      latestUpdateAt: now,
      latestUpdateText: latestUpdateText.trim() || "Updated",
      progressPercent: clamp(Math.round(progressPercent), 0, 100),
      status,
      createdAt: now,
      updatedAt: now,
    };

    const log: TaskLog = {
      id: makeId(),
      taskId: id,
      createdAt: now,
      createdByTechnicianId: selectedTechnicianId,
      createdByTechnicianName: selectedTechnicianName,
      type: "note",
      message: task.latestUpdateText,
      progressPercent: task.progressPercent,
    };

    try {
      await upsertTask(task);
      await addTaskLog(log);
      setQuickTaskTitle("Repair");
      setProgressPercent(0);
      setStatus("open");
      setLatestUpdateText("Initial admin entry.");
    } catch (err) {
      setQuickTaskError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-indigo-950">Admin Dashboard</h1>
          <p className="text-sm text-indigo-700/80">
            Admin can add staff users and create tasks.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tasks/new" className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600">
            + New Task
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-indigo-950">1) Add User</div>
          <form onSubmit={onAddUser} className="mt-3">
              <label className="text-xs text-zinc-600">Username</label>
            <input
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
                placeholder="e.g. tech11"
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
              <label className="mt-3 block text-xs text-zinc-600">Password</label>
              <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Set password for technician"
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            {userError ? <div className="mt-2 text-xs text-red-700">{userError}</div> : null}
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
              >
                Add user
              </button>
            </div>
          </form>
          <div className="mt-3 text-xs text-zinc-500">
            Current users: <span className="font-medium">{technicians.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-indigo-950">2) Quick Create Task</div>
          <form onSubmit={onQuickCreateTask} className="mt-3 grid gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-600">Title</label>
              <input
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-600">Task type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="repair">Repair</option>
                <option value="preventive">Preventive</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-600">Progress %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-600">Assigned technician</label>
              <select
                value={assignedTechnicianId}
                onChange={(e) => setAssignedTechnicianId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-600">Logged date</label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-600">Asset label</label>
              <input
                value={assetLabel}
                onChange={(e) => setAssetLabel(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-600">Asset type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="shop">Shop</option>
                <option value="chiller">Chiller</option>
                <option value="freezer">Freezer</option>
                <option value="guesthouse">Guest House</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-zinc-600">Latest update</label>
              <textarea
                value={latestUpdateText}
                onChange={(e) => setLatestUpdateText(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {quickTaskError ? <div className="text-xs text-red-700">{quickTaskError}</div> : null}

            <div className="flex justify-end">
              <button type="submit" className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600">
                Create task
              </button>
            </div>
          </form>
          <div className="mt-3 text-xs text-zinc-500">
            Tip: Use <Link href="/tasks/new" className="underline">New Task</Link> for preventive intervals + images.
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-indigo-950">Quick Links</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/admin/users" className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
            Users (admin)
          </Link>
          <Link href="/tasks" className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
            Tasks list
          </Link>
          <Link href="/assets" className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
            Assets list
          </Link>
          <Link href="/technicians" className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
            Manage users
          </Link>
        </div>
      </div>
    </div>
  );
}

