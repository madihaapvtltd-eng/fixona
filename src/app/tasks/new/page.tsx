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
import { Button, Card, CardContent, Input, Select, Textarea, Badge, Combobox } from "@/components/ui";
import { ArrowLeft, Calendar, Upload, X, Wrench, Building2 } from "lucide-react";
import Link from "next/link";

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

const assetTypeOptions = [
  { value: "shop", label: "Shop" },
  { value: "chiller", label: "Chiller" },
  { value: "freezer", label: "Freezer" },
  { value: "guesthouse", label: "Guest House" },
];

const taskTypeOptions = [
  { value: "preventive", label: "Preventive" },
  { value: "repair", label: "Repair" },
];

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function NewTaskPage() {
  const router = useRouter();
  const technicians = useTechnicians();
  const assets = useAssets();
  const selectedTechnicianId = useSelectedTechnicianId();

  const selectedTechnicianName = useMemo(() => {
    return technicians.find((t) => t.id === selectedTechnicianId)?.name ?? technicians[0]?.name ?? "Technician";
  }, [selectedTechnicianId, technicians]);

  const today = useMemo(() => ymd(new Date()), []);

  const [title, setTitle] = useState("");
  const [assetId, setAssetId] = useState<string>("");
  const [assetType, setAssetType] = useState<AssetType>("shop");
  const [assetLabel, setAssetLabel] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("preventive");
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<string>(selectedTechnicianId ?? "");
  const [loggedDate, setLoggedDate] = useState(today);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [status, setStatus] = useState<TaskStatus>("open");
  const [latestUpdateText, setLatestUpdateText] = useState("");
  const [preventiveIntervalDays, setPreventiveIntervalDays] = useState<number>(30);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const technicianOptions = technicians.map((t) => ({ value: t.id, label: t.name }));
  const assetOptions = [
    { value: "", label: "— No asset selected —" },
    ...assets.slice().sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({
      value: a.id,
      label: `${a.name} (${a.locationName})`,
    })),
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const now = Date.now();
    const id = makeId();

    let uploadedImageUrl: string | undefined;
    const uploadedImageName = imageFile?.name ?? "";
    if (imageFile) {
      uploadedImageUrl = await uploadToCloudinaryUnsigned({ file: imageFile });
    }

    const task: Task = {
      id,
      title: title.trim(),
      assetId: assetId || undefined,
      assetType,
      assetLabel: assetLabel.trim() || "Unknown asset",
      taskType,
      assignedTechnicianId,
      assignedTechnicianName,
      loggedDate,
      latestUpdateAt: now,
      latestUpdateText: latestUpdateText.trim() || "Task created",
      images: uploadedImageUrl
        ? [{ id: makeId(), name: uploadedImageName, url: uploadedImageUrl, createdAt: now, createdByTechnicianId: assignedTechnicianId, createdByTechnicianName: assignedTechnicianName }]
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

  const handleAssetChange = (value: string) => {
    setAssetId(value);
    const a = assets.find((x) => x.id === value);
    if (a) {
      const mapped: AssetType =
        a.kind === "guesthouse" ? "guesthouse" :
        a.kind === "chiller" ? "chiller" :
        a.kind === "freezer" || a.kind === "refrigerator" ? "freezer" : "shop";
      setAssetType(mapped);
      setAssetLabel(a.name);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Task</h1>
          <p className="text-muted-foreground">Add a new maintenance task</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Task Title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Monthly chiller maintenance"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Combobox
                  label={`Select Asset (optional) ${assets.length > 0 ? `(${assets.length} available)` : ""}`}
                  placeholder="— No asset selected —"
                  value={assetId}
                  onChange={handleAssetChange}
                  options={assetOptions}
                  searchable
                />
                {selectedAsset && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Building2 className="h-3 w-3 inline mr-1" />
                    {selectedAsset.locationType.toUpperCase()} • {selectedAsset.locationName}
                  </p>
                )}
              </div>

              <Select
                label="Asset Type"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                options={assetTypeOptions}
              />

              <Input
                label="Asset Label"
                value={assetLabel}
                onChange={(e) => setAssetLabel(e.target.value)}
                placeholder="e.g., Shop 1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Task Details */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Task Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Task Type"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                options={taskTypeOptions}
              />

              <Select
                label="Assigned Technician"
                value={assignedTechnicianId}
                onChange={(e) => setAssignedTechnicianId(e.target.value)}
                options={technicianOptions}
              />

              <Input
                label="Logged Date"
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                icon={<Calendar className="h-4 w-4" />}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Progress %</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(Number(e.target.value))}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <Badge>{progressPercent}%</Badge>
                </div>
              </div>

              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                options={statusOptions}
              />
            </div>

            {taskType === "preventive" && (
              <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t">
                <Input
                  label="Preventive Interval (days)"
                  type="number"
                  min={1}
                  value={preventiveIntervalDays}
                  onChange={(e) => setPreventiveIntervalDays(Number(e.target.value))}
                />
                <div>
                  <label className="text-sm font-medium mb-2 block">Next Reminder (auto)</label>
                  <div className="h-10 px-3 flex items-center rounded-lg border bg-muted/50 text-sm">
                    {computedNextReminderAt ? new Date(computedNextReminderAt).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes & Image */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Notes & Attachments</h2>
            
            <Textarea
              label="Initial Update / Notes"
              value={latestUpdateText}
              onChange={(e) => setLatestUpdateText(e.target.value)}
              placeholder="Describe the task or add initial observations..."
              rows={4}
              className="mb-4"
            />

            {/* Image Upload */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Attachment (optional)</span>
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <Button type="button" variant="outline" size="sm">
                    Choose File
                  </Button>
                </label>
              </div>

              {imageError && (
                <p className="text-sm text-red-500 mt-2">{imageError}</p>
              )}

              {imagePreview && (
                <div className="mt-4">
                  <div className="relative rounded-lg overflow-hidden max-w-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setImageError("");
                      }}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{imageFile?.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/tasks">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </div>
  );
}

