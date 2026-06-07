export type AssetStatus = 'operational' | 'maintenance' | 'offline' | 'retired';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Asset {
  id: string;
  name: string;
  assetCode: string;
  category: string;
  locationId: string;
  status: AssetStatus;
  condition: AssetCondition;
  riskLevel: RiskLevel;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  purchaseCost?: number;
  currentValue?: number;
  qrCode?: string;
  imageUrl?: string;
  documents?: string[];
  specifications?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceInterval?: number;
  totalMaintenanceCost: number;
  downtimeHours: number;
  failureCount: number;
}

export interface AssetSparePart {
  assetId: string;
  partId: string;
  quantity: number;
}
