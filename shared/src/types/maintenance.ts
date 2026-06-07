export interface MaintenanceLog {
  id: string;
  assetId: string;
  workOrderId?: string;
  type: 'preventive' | 'corrective' | 'predictive' | 'emergency' | 'inspection';
  description: string;
  performedBy: string;
  performedByName: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  cost: number;
  partsUsed: MaintenancePart[];
  laborHours: number;
  downtime: number;
  notes?: string;
  images: string[];
  documents: string[];
  checklistResults?: ChecklistResult[];
  nextMaintenanceDate?: Date;
  createdAt: Date;
}

export interface MaintenancePart {
  partId: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface ChecklistResult {
  itemId: string;
  description: string;
  isPassed: boolean;
  notes?: string;
}

export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  scheduleType: 'time_based' | 'usage_based' | 'condition_based';
  frequency?: number;
  frequencyUnit?: 'days' | 'weeks' | 'months' | 'hours' | 'cycles';
  lastMaintenance?: Date;
  nextMaintenance: Date;
  estimatedDuration: number;
  assignedTo?: string;
  checklist?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
