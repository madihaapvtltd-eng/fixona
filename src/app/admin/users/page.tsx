"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTechnicians } from "@/lib/useTechnicians";
import { createTechnician, deleteTechnician, updateTechnician } from "@/lib/technicians";

function normalizeUsername(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "");
}

export default function AdminUsersPage() {
  const technicians = useTechnicians();
  const sorted = useMemo(() => {
    return [...technicians].sort((a, b) => a.id.localeCompare(b.id));
  }, [technicians]);

  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = normalizeUsername(newUsername);
    const name = newDisplayName.trim() || id;
    if (!id) return;
    await createTechnician(name, { id });
    setNewUsername("");
    setNewDisplayName("");
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-indigo-950">Users</h1>
          <p className="text-sm text-indigo-700/80">Admin-only user directory (technicians).</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
            ← Back to Admin
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-indigo-950">Add user</div>
          <form onSubmit={onCreate} className="mt-3 grid gap-3">
            <div>
              <label className="text-xs text-zinc-600">Username</label>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. tech11"
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="mt-1 text-[11px] text-zinc-500">Used for login and task assignment.</div>
            </div>
            <div>
              <label className="text-xs text-zinc-600">Display name</label>
              <input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="e.g. Arun"
                className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600">
                Add user
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-indigo-100 p-4">
            <div className="text-sm font-semibold text-indigo-950">Current users</div>
            <div className="text-xs text-zinc-500">{sorted.length}</div>
          </div>
          {sorted.length === 0 ? (
            <div className="p-4 text-sm text-zinc-600">No users yet.</div>
          ) : (
            <div className="divide-y divide-indigo-100">
              {sorted.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">{t.name}</div>
                    <div className="truncate text-xs text-zinc-500">@{t.id}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === t.id ? (
                      <>
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-9 w-44 rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await updateTechnician(t.id, editingName);
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-600"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(t.id);
                            setEditingName(t.name);
                          }}
                          className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = window.confirm(`Delete user "${t.name}" (@${t.id})?`);
                            if (!ok) return;
                            await deleteTechnician(t.id);
                          }}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

