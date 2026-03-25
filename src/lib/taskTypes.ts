export type AssetType = "shop" | "chiller" | "freezer" | "guesthouse";

export type TaskType = "preventive" | "repair";
export type TaskStatus = "open" | "in_progress" | "completed";

export type Task = {
  id: string;
  title: string;
  assetId?: string;
  assetType: AssetType;
  assetLabel: string;
  taskType: TaskType;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  loggedDate: string; // YYYY-MM-DD

  images?: Array<{
    id: string;
    name: string;
    dataUrl?: string; // local MVP
    url?: string; // Cloudinary future
    createdAt: number;
    createdByTechnicianId: string;
    createdByTechnicianName: string;
  }>;

  // Latest update snapshot (also stored via logs)
  latestUpdateAt: number; // epoch ms
  latestUpdateText: string;

  progressPercent: number; // 0-100
  status: TaskStatus;

  // Preventive scheduling (simple MVP)
  preventiveIntervalDays?: number; // e.g. 7, 30, 90
  nextReminderAt?: number; // epoch ms

  createdAt: number;
  updatedAt: number;
};

export type TaskLog = {
  id: string;
  taskId: string;
  createdAt: number;
  createdByTechnicianId: string;
  createdByTechnicianName: string;

  type: "note" | "progress" | "completion" | "image";
  message: string;
  progressPercent?: number;
};

