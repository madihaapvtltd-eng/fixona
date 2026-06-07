export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkOrderStatus = 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type WorkOrderType = 'preventive' | 'corrective' | 'predictive' | 'emergency' | 'inspection';

export interface WorkOrder {
  id: string;
  woNumber: string;
  assetId: string;
  title: string;
  description: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  completionNotes?: string;
  cost: number;
  laborCost: number;
  partsCost: number;
  images: string[];
  attachments: string[];
  partsUsed: WorkOrderPart[];
  checklist?: ChecklistItem[];
  failureCause?: string;
  resolution?: string;
}

export interface WorkOrderPart {
  partId: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface WorkOrderHistory {
  id: string;
  workOrderId: string;
  action: string;
  statusFrom?: WorkOrderStatus;
  statusTo?: WorkOrderStatus;
  userId: string;
  userName: string;
  notes?: string;
  createdAt: Date;
}
