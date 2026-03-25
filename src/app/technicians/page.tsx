"use client";

import { useMemo, useState } from "react";
import {
  createTechnician,
  deleteTechnician,
  updateTechnician,
  type Technician,
} from "@/lib/technicians";
import { useTechnicians } from "@/lib/useTechnicians";

export default function TechniciansPage() {
  const technicians = useTechnicians();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const sorted = useMemo(() => {
    return [...technicians].sort((a, b) => a.name.localeCompare(b.name));
  }, [technicians]);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTechnician(newName);
    setNewName("");
  };

  const startEdit = (t: Technician) => {
    setEditingId(t.id);
    setEditingName(t.name);
  };

  const onSaveEdit = (id: string) => {
    updateTechnician(id, editingName);
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-lg font-semibold text-zinc-900">Technicians</h1>
      <p className="text-sm text-zinc-600">Create, edit, and delete technicians for task assignment.</p>

      <form onSubmit={onCreate} className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-medium text-zinc-900">Add technician</div>
        <div className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Technician name"
            className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add
          </button>
        </div>
      </form>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white">
        {sorted.length === 0 ? (
          <div className="p-4 text-sm text-zinc-600">No technicians found.</div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {sorted.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                {editingId === t.id ? (
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                ) : (
                  <div className="text-sm font-medium text-zinc-900">{t.name}</div>
                )}

                <div className="flex items-center gap-2">
                  {editingId === t.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onSaveEdit(t.id)}
                        className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const ok = window.confirm(`Delete technician "${t.name}"?`);
                          if (!ok) return;
                          deleteTechnician(t.id);
                        }}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
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
  );
}

