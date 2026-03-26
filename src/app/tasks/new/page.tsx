"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addTaskLog, makeId, upsertTask } from "@/lib/taskStore";
import type { AssetType, Task, TaskLog, TaskType, TaskStatus } from "@/lib/taskTypes";
import { useSelectedTechnicianId } from "@/lib/useSelectedTechnician";
import { useTechnicians } from "@/lib/useTechnicians";
import { useAssets } from "@/lib/useAssets";
import { assertSmallImage, fileToDataUrl } from "@/lib/imageUtils";
import { updateAssetLastServiced } from "@/lib/assetStore";
import { uploadToCloudinaryUnsigned } from "@/lib/cloudinary";

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseYmdToMs(ymdStr: string) {
  return new Date(`${ymdStr}T00:00:00`).getTime();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function NewTaskPage() {
  const router = useRouter();
  const technicians = useTechnicians();
  const assets = useAssets();
  const selectedTechnicianId = useSelectedTechnicianId();

  const selectedTechnicianName = useMemo(() => {
    return technicians.find((t) => t.id === selectedTechnicianId)?.name ?? technicians[0]?.name ?? "Technician";
  }, [selectedTechnicianId, technicians]);

  const today = useMemo(() => ymd(new Date()), []);

  const [title, setTitle] = useState("Preventive check");
  const [assetId, setAssetId] = useState<string>("");
  const [assetType, setAssetType] = useState<AssetType>("shop");
  const [assetLabel, setAssetLabel] = useState("Shop 1");
  const [taskType, setTaskType] = useState<TaskType>("preventive");
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<string>(selectedTechnicianId);
  const [loggedDate, setLoggedDate] = useState(today);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [status, setStatus] = useState<TaskStatus>("open");
  const [latestUpdateText, setLatestUpdateText] = useState("Initial task created.");

  const [preventiveIntervalDays, setPreventiveIntervalDays] = useState<number>(30);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");

  const assignedTechnicianName = useMemo(() => {
    return technicians.find((t) => t.id === assignedTechnicianId)?.name ?? selectedTechnicianName;
  }, [assignedTechnicianId, selectedTechnicianName, technicians]);

  const computedNextReminderAt = useMemo(() => {
    if (taskType !== "preventive") return undefined;
    const base = parseYmdToMs(loggedDate);
    if (!Number.isFinite(base)) return undefined;
    if (!preventiveIntervalDays || preventiveIntervalDays <= 0) return undefined;
    return base + preventiveIntervalDays * 24 * 60 * 60 * 1000;
  }, [taskType, loggedDate, preventiveIntervalDays]);

  const selectedAsset = useMemo(() => {
    if (!assetId) return null;
    return assets.find((a) => a.id === assetId) ?? null;
  }, [assetId, assets]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    const id = makeId();

    let uploadedImageUrl: string | undefined;
    const uploadedImageName = imageFile?.name ?? "";
    if (imageFile) {
      // Unsigned upload to Cloudinary → store only URL in Firestore
      uploadedImageUrl = await uploadToCloudinaryUnsigned({ file: imageFile });
    }

    const task: Task = {
      id,
      title: title.trim() || "Untitled task",
      assetId: assetId || undefined,
      assetType,
      assetLabel: assetLabel.trim() || "Unknown asset",
      taskType,
      assignedTechnicianId,
      assignedTechnicianName,
      loggedDate,
      latestUpdateAt: now,
      latestUpdateText: latestUpdateText.trim() || "Updated",
      images:
        uploadedImageUrl
          ? [
              {
                id: makeId(),
                name: uploadedImageName,
                url: uploadedImageUrl,
                createdAt: now,
                createdByTechnicianId: assignedTechnicianId,
                createdByTechnicianName: assignedTechnicianName,
              },
            ]
          : undefined,
      progressPercent: clamp(Math.round(progressPercent), 0, 100),
      status,
      preventiveIntervalDays: taskType === "preventive" ? preventiveIntervalDays : undefined,
      nextReminderAt: taskType === "preventive" ? computedNextReminderAt : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const log: TaskLog = {
      id: makeId(),
      taskId: id,
      createdAt: now,
      createdByTechnicianId: assignedTechnicianId,
      createdByTechnicianName: assignedTechnicianName,
      type: "note",
      message: task.latestUpdateText,
      progressPercent: task.progressPercent,
    };

    await upsertTask(task);
    if (task.assetId && (task.status === "completed" || task.progressPercent >= 100)) {
      updateAssetLastServiced(task.assetId, task.loggedDate);
    }
    await addTaskLog(log);
    if (imageFile && uploadedImageUrl) {
      await addTaskLog({
        id: makeId(),
        taskId: id,
        createdAt: now,
        createdByTechnicianId: assignedTechnicianId,
        createdByTechnicianName: assignedTechnicianName,
        type: "image",
        message: `Image added: ${imageFile.name}`,
      });
    }
    router.push(`/tasks/${id}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-lg font-semibold text-zinc-900">Create Task</h1>
      <p className="text-sm text-zinc-600">Data is saved to Firebase (Firestore).</p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-900">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-900">
            Select Asset (optional) {assets.length > 0 && <span className="text-xs font-normal text-zinc-500">({assets.length} available)</span>}
          </label>
          <select
            value={assetId}
            onChange={(e) => {
              const id = e.target.value;
              setAssetId(id);
              const a = assets.find((x) => x.id === id);
              if (a) {
                // Map asset kind to existing Task assetType for MVP
                const mapped: AssetType =
                  a.kind === "guesthouse"
                    ? "guesthouse"
                    : a.kind === "chiller"
                      ? "chiller"
                      : a.kind === "freezer" || a.kind === "refrigerator"
                        ? "freezer"
                        : "shop";
                setAssetType(mapped);
                setAssetLabel(a.name);
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
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as AssetType)}
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
            value={assetLabel}
            onChange={(e) => setAssetLabel(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-900">Task Type</label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="preventive">Preventive</option>
            <option value="repair">Repair</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-900">Assigned Technician</label>
          <select
            value={assignedTechnicianId}
            onChange={(e) => setAssignedTechnicianId(e.target.value)}
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
            value={loggedDate}
            onChange={(e) => setLoggedDate(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-900">Progress %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={progressPercent}
            onChange={(e) => setProgressPercent(Number(e.target.value))}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-900">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {taskType === "preventive" ? (
          <>
            <div>
              <label className="text-sm font-medium text-zinc-900">Preventive interval (days)</label>
              <input
                type="number"
                min={1}
                value={preventiveIntervalDays}
                onChange={(e) => setPreventiveIntervalDays(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900">Next reminder (auto)</label>
              <div className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 flex items-center text-sm text-zinc-700">
                {typeof computedNextReminderAt === "number"
                  ? new Date(computedNextReminderAt).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          </>
        ) : null}

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-900">Initial / latest update message</label>
          <textarea
            value={latestUpdateText}
            onChange={(e) => setLatestUpdateText(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        <div className="md:col-span-2 rounded-lg border border-zinc-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Image (optional)</div>
              <div className="text-xs text-zinc-600">Local MVP only. Later we’ll upload to Cloudinary and save a URL.</div>
            </div>
            <label className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer">
              Choose image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.currentTarget.value = "";
                  setImageError("");
                  setImageFile(null);
                  setImagePreview("");
                  if (!f) return;
                  try {
                    assertSmallImage(f, 1_000_000);
                    const dataUrl = await fileToDataUrl(f);
                    setImageFile(f);
                    setImagePreview(dataUrl);
                  } catch (err) {
                    setImageError(err instanceof Error ? err.message : "Failed to load image");
                  }
                }}
              />
            </label>
          </div>

          {imageError ? <div className="mt-2 text-xs text-red-700">{imageError}</div> : null}

          {imagePreview ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Selected" className="h-40 w-full rounded-md object-cover bg-white" />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate text-xs text-zinc-600">{imageFile?.name}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                      setImageError("");
                    }}
                    className="text-xs font-medium text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-600">No image selected.</div>
          )}
        </div>

        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/tasks")}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
}

