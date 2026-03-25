"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { AssetType, Task, TaskLog, TaskStatus } from "@/lib/taskTypes";
import { useAssets } from "@/lib/useAssets";
import { useTask } from "@/lib/useTask";
import { useTaskLogs } from "@/lib/useTaskLogs";
import { useTechnicians } from "@/lib/useTechnicians";
import { useSelectedTechnicianId } from "@/lib/useSelectedTechnician";
import { addTaskLog, deleteTask, makeId, upsertTask } from "@/lib/taskStore";
import { updateAssetLastServiced } from "@/lib/assetStore";
import { assertSmallImage } from "@/lib/imageUtils";
import { uploadToCloudinaryUnsigned } from "@/lib/cloudinary";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseYmdToMs(ymdStr: string) {
  return new Date(`${ymdStr}T00:00:00`).getTime();
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

function mapAssetKindToAssetType(kind: string): AssetType {
  if (kind === "guesthouse") return "guesthouse";
  if (kind === "chiller") return "chiller";
  if (kind === "freezer" || kind === "refrigerator") return "freezer";
  return "shop";
}

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();

  const assets = useAssets();
  const technicians = useTechnicians();
  const selectedTechnicianId = useSelectedTechnicianId();
  const selectedTechnicianName = useMemo(() => {
    return technicians.find((t) => t.id === selectedTechnicianId)?.name ?? "Technician";
  }, [selectedTechnicianId, technicians]);

  const taskId = params.taskId;
  const task = useTask(taskId);
  const logs = useTaskLogs(taskId);

  if (!taskId) return <div className="text-sm text-zinc-600">Missing task id.</div>;

  if (!task) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold text-zinc-900">Task not found</div>
          <div className="mt-2 text-sm text-zinc-600">It may have been deleted.</div>
          <div className="mt-4">
            <Link href="/tasks" className="text-sm font-medium text-zinc-900 underline">
              ← Back to tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TaskEditor
      task={task}
      logs={logs}
      assets={assets}
      technicians={technicians}
      selectedTechnicianId={selectedTechnicianId}
      selectedTechnicianName={selectedTechnicianName}
      onDelete={async () => {
        await deleteTask(task.id);
        router.push("/tasks");
      }}
    />
  );
}

function TaskEditor({
  task,
  logs,
  assets,
  technicians,
  selectedTechnicianId,
  selectedTechnicianName,
  onDelete,
}: {
  task: Task;
  logs: TaskLog[];
  assets: ReturnType<typeof useAssets>;
  technicians: ReturnType<typeof useTechnicians>;
  selectedTechnicianId: string;
  selectedTechnicianName: string;
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();

  const todayYmd = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [editTitle, setEditTitle] = useState(task.title);
  const [editAssetId, setEditAssetId] = useState<string>(task.assetId ?? "");
  const [editAssetType, setEditAssetType] = useState<AssetType>(task.assetType);
  const [editAssetLabel, setEditAssetLabel] = useState(task.assetLabel);
  const [editAssignedTechnicianId, setEditAssignedTechnicianId] = useState<string>(task.assignedTechnicianId);
  const [editLoggedDate, setEditLoggedDate] = useState(task.loggedDate ?? todayYmd);
  const [editProgressPercent, setEditProgressPercent] = useState<number>(task.progressPercent ?? 0);
  const [editStatus, setEditStatus] = useState<TaskStatus>(task.status);
  const [editLatestUpdateText, setEditLatestUpdateText] = useState(task.latestUpdateText ?? "");
  const [preventiveIntervalDays, setPreventiveIntervalDays] = useState<number>(task.preventiveIntervalDays ?? 30);

  const [imageError, setImageError] = useState<string>("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const assignedTechnicianName = useMemo(() => {
    return technicians.find((t) => t.id === editAssignedTechnicianId)?.name ?? "Technician";
  }, [editAssignedTechnicianId, technicians]);

  const selectedAsset = useMemo(() => {
    if (!editAssetId) return null;
    return assets.find((a) => a.id === editAssetId) ?? null;
  }, [editAssetId, assets]);

  const computedNextReminderAt = useMemo(() => {
    if (task.taskType !== "preventive") return undefined;
    if (!preventiveIntervalDays || preventiveIntervalDays <= 0) return undefined;
    const base = parseYmdToMs(editLoggedDate);
    if (!Number.isFinite(base)) return undefined;
    return base + preventiveIntervalDays * 24 * 60 * 60 * 1000;
  }, [task.taskType, preventiveIntervalDays, editLoggedDate]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    const next: Task = {
      ...task,
      title: editTitle.trim() || task.title,
      assetId: editAssetId || undefined,
      assetType: editAssetType,
      assetLabel: editAssetLabel.trim() || task.assetLabel,
      assignedTechnicianId: editAssignedTechnicianId,
      assignedTechnicianName,
      loggedDate: editLoggedDate,
      progressPercent: clamp(Math.round(editProgressPercent), 0, 100),
      status: editStatus,
      latestUpdateAt: now,
      latestUpdateText: editLatestUpdateText.trim() || task.latestUpdateText,
      preventiveIntervalDays: task.taskType === "preventive" ? preventiveIntervalDays : undefined,
      nextReminderAt: task.taskType === "preventive" ? computedNextReminderAt : undefined,
      updatedAt: now,
    };

    const logType: TaskLog["type"] =
      editStatus === "completed"
        ? "completion"
        : editProgressPercent !== task.progressPercent
          ? "progress"
          : "note";

    const log: TaskLog = {
      id: makeId(),
      taskId: task.id,
      createdAt: now,
      createdByTechnicianId: selectedTechnicianId,
      createdByTechnicianName: selectedTechnicianName,
      type: logType,
      message: next.latestUpdateText,
      progressPercent: next.progressPercent,
    };

    await upsertTask(next);

    if (next.assetId && (next.status === "completed" || next.progressPercent >= 100)) {
      updateAssetLastServiced(next.assetId, next.loggedDate);
    }

    await addTaskLog(log);
    router.refresh();
  };

  const onAddImages = async () => {
    if (!pendingFiles.length) return;
    if (!task) return;
    setImageError("");

    try {
      const now = Date.now();

      const uploadedUrls: string[] = [];
      for (const f of pendingFiles) {
        assertSmallImage(f, 1_000_000);
        // Cloudinary unsigned upload → save URL
        const url = await uploadToCloudinaryUnsigned({ file: f });
        uploadedUrls.push(url);
      }

      if (uploadedUrls.length === 0) return;

      const nextImages = [
        ...(task.images ?? []),
        ...uploadedUrls.map((url, idx) => ({
          id: makeId(),
          name: pendingFiles[idx]?.name ?? `image-${idx + 1}`,
          url,
          createdAt: now,
          createdByTechnicianId: selectedTechnicianId,
          createdByTechnicianName: selectedTechnicianName,
        })),
      ];

      const next: Task = {
        ...task,
        images: nextImages,
        latestUpdateAt: now,
        latestUpdateText: `Image added (${uploadedUrls.length})`,
        updatedAt: now,
      };

      await upsertTask(next);

      // One image log entry per upload
      for (const f of pendingFiles) {
        await addTaskLog({
          id: makeId(),
          taskId: task.id,
          createdAt: now,
          createdByTechnicianId: selectedTechnicianId,
          createdByTechnicianName: selectedTechnicianName,
          type: "image",
          message: `Image added: ${f.name}`,
        });
      }

      setPendingFiles([]);
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "Failed to upload images");
    }
  };

  const onRemoveImage = async (imageId: string) => {
    if (!task) return;
    const ok = window.confirm("Remove this image from the task?");
    if (!ok) return;
    const now = new Date().getTime();
    const nextImages = (task.images ?? []).filter((img) => img.id !== imageId);
    const next: Task = { ...task, images: nextImages, latestUpdateAt: now, updatedAt: now };
    await upsertTask(next);
    // (Optional) deleting from Cloudinary not implemented in MVP.
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/tasks" className="text-sm font-medium text-zinc-900 underline">
            ← Tasks
          </Link>
          <div className="text-xs text-zinc-500">ID: {task.id}</div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await onDelete();
          }}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Task</div>
            <div className="mt-1 text-lg font-semibold">{task.title}</div>
            <div className="mt-1 text-xs text-zinc-600">
              {task.assetType.toUpperCase()} • {task.assetLabel}
            </div>
            <div className="mt-1 text-xs text-zinc-500">Assigned: {task.assignedTechnicianName}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-600">Status</div>
            <div className="mt-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              {task.status.replace("_", " ")}
            </div>
            <div className="mt-2 text-xs text-zinc-500">Progress: {task.progressPercent}%</div>
          </div>
        </div>

        {task.taskType === "preventive" ? (
          <div className="mt-4 rounded-lg bg-zinc-50 p-3">
            <div className="text-xs text-zinc-600">Preventive scheduling</div>
            <div className="mt-1 text-sm text-zinc-900">
              Next reminder:{" "}
              <span className="font-semibold">
                {typeof task.nextReminderAt === "number" ? new Date(task.nextReminderAt).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Images (optional)</div>
              <div className="text-xs text-zinc-600">Uploaded to Cloudinary, stored as URLs.</div>
            </div>
            <label className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer">
              + Add
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setPendingFiles(files);
                }}
              />
            </label>
          </div>

          {imageError ? <div className="mt-2 text-xs text-red-700">{imageError}</div> : null}

          <div className="mt-3">
            <button
              type="button"
              onClick={() => void onAddImages()}
              className="rounded-lg bg-indigo-700 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-600"
            >
              Upload selected
            </button>
          </div>

          {task.images && task.images.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {task.images.map((img) => (
                <div key={img.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url ?? img.dataUrl ?? ""}
                    alt={img.name}
                    className="h-28 w-full rounded-md object-cover bg-white"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate text-[11px] text-zinc-600">{img.name}</div>
                    <button
                      type="button"
                      onClick={() => void onRemoveImage(img.id)}
                      className="text-[11px] font-medium text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-600">No images yet.</div>
          )}
        </div>

        <form onSubmit={onSave} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-900">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-900">Select Asset (optional)</label>
            <select
              value={editAssetId}
              onChange={(e) => {
                const id = e.target.value;
                setEditAssetId(id);
                const a = assets.find((x) => x.id === id);
                if (a) {
                  setEditAssetType(mapAssetKindToAssetType(a.kind));
                  setEditAssetLabel(a.name);
                } else {
                  setEditAssetType("shop");
                  setEditAssetLabel("");
                }
              }}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            >
              <option value="">— No asset selected —</option>
              {assets
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.locationName})
                  </option>
                ))}
            </select>
            {selectedAsset ? (
              <div className="mt-1 text-xs text-zinc-600">
                Location: {selectedAsset.locationType.toUpperCase()} • {selectedAsset.locationName}
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900">Asset Type</label>
            <select
              value={editAssetType}
              onChange={(e) => setEditAssetType(e.target.value as AssetType)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            >
              <option value="shop">Shop</option>
              <option value="chiller">Chiller</option>
              <option value="freezer">Freezer</option>
              <option value="guesthouse">Guest House</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900">Asset Label</label>
            <input
              value={editAssetLabel}
              onChange={(e) => setEditAssetLabel(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900">Assigned Technician</label>
            <select
              value={editAssignedTechnicianId}
              onChange={(e) => setEditAssignedTechnicianId(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900">Logged Date</label>
            <input
              type="date"
              value={editLoggedDate}
              onChange={(e) => setEditLoggedDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900">Progress %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={editProgressPercent}
              onChange={(e) => setEditProgressPercent(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {task.taskType === "preventive" ? (
            <div className="md:col-span-2 rounded-lg bg-zinc-50 p-3">
              <div className="text-xs text-zinc-600">Preventive interval + next reminder (auto)</div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-900">Interval (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={preventiveIntervalDays}
                    onChange={(e) => setPreventiveIntervalDays(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">Next reminder</div>
                  <div className="mt-1 h-10 rounded-lg border border-zinc-200 bg-white px-3 flex items-center text-sm text-zinc-700">
                    {typeof computedNextReminderAt === "number"
                      ? new Date(computedNextReminderAt).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-900">Latest update / note</label>
            <textarea
              value={editLatestUpdateText}
              onChange={(e) => setEditLatestUpdateText(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setEditTitle(task.title);
                setEditAssetId(task.assetId ?? "");
                setEditAssetType(task.assetType);
                setEditAssetLabel(task.assetLabel);
                setEditAssignedTechnicianId(task.assignedTechnicianId);
                setEditLoggedDate(task.loggedDate);
                setEditProgressPercent(task.progressPercent);
                setEditStatus(task.status);
                setEditLatestUpdateText(task.latestUpdateText);
                setPreventiveIntervalDays(task.preventiveIntervalDays ?? 30);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Reset from saved
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              Save update
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-900">Timeline</div>
          <div className="text-xs text-zinc-500">{logs.length} logs</div>
        </div>

        {logs.length === 0 ? (
          <div className="mt-2 text-sm text-zinc-600">No logs yet.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {logs.map((l) => (
              <div key={l.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-medium text-zinc-900">{l.type.toUpperCase()}</div>
                  <div className="text-xs text-zinc-500">{formatDate(l.createdAt)}</div>
                </div>
                <div className="mt-1 text-xs text-zinc-700">{l.message}</div>
                <div className="mt-2 text-xs text-zinc-600">
                  By: {l.createdByTechnicianName}
                  {typeof l.progressPercent === "number" ? ` • ${l.progressPercent}%` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

