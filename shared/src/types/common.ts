export interface Location {
  id: string;
  name: string;
  code?: string;
  type: 'building' | 'floor' | 'room' | 'area' | 'zone';
  parentId?: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'work_order' | 'inventory' | 'asset' | 'system' | 'alert';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  sentVia: ('push' | 'email' | 'whatsapp' | 'in_app')[];
  createdAt: Date;
  readAt?: Date;
}

export interface WhatsAppMessage {
  id: string;
  phoneNumber: string;
  message: string;
  templateName?: string;
  parameters?: Record<string, string>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface DashboardStats {
  totalAssets: number;
  assetsUnderMaintenance: number;
  highRiskAssets: number;
  openWorkOrders: number;
  overdueWorkOrders: number;
  lowStockItems: number;
  totalInventoryValue: number;
  monthlyMaintenanceCost: number;
  avgCompletionTime: number;
  technicianUtilization: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface PredictionResult {
  assetId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  failureProbability: number;
  predictedFailureDate?: Date;
  recommendedAction: string;
  confidence: number;
  factors: string[];
}
