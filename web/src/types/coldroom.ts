// Cold Room / Refrigerator / Freezer Asset
export interface ColdRoomAsset {
  id: string;
  assetCode: string;
  name: string;
  category: 'cold_room' | 'refrigerator' | 'freezer' | 'blast_freezer' | 'chiller';
  type: 'walk_in' | 'reach_in' | 'under_counter' | 'upright' | 'display';
  
  // Temperature specs (in Celsius)
  minTemp: number;        // Minimum allowed temperature
  maxTemp: number;        // Maximum allowed temperature
  targetTemp: number;     // Target temperature
  criticalMin: number;    // Critical alert threshold
  criticalMax: number;    // Critical alert threshold
  
  // Physical specs
  capacity: string;       // e.g., "500 cubic feet" or "1000 liters"
  dimensions?: string;    // e.g., "10x8x8 ft"
  location: string;       // Physical location in facility
  
  // Current status
  currentTemp?: number;   // Last recorded temperature
  currentHumidity?: number; // Last recorded humidity %
  status: 'normal' | 'warning' | 'critical' | 'maintenance' | 'offline';
  lastCheckAt?: Date;     // Last temperature check timestamp
  
  // Condition & Risk
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Company (multi-tenant)
  companyId?: string;
  companyName?: string;
  
  // Metadata
  createdAt?: any;
  qrCode?: string;
}

// Temperature Log Entry (3x daily checks)
export interface TemperatureLog {
  id: string;
  coldRoomId: string;
  coldRoomName: string;
  coldRoomAssetCode: string;
  companyId?: string;
  
  // Check details
  checkTime: 'morning' | 'midday' | 'evening';  // Morning, Midday, or Evening check
  recordedAt: Date;                  // When temperature was recorded
  recordedBy: string;                // Staff name
  recordedById?: string;             // Staff ID
  
  // Temperature readings
  temperature: number;               // Actual temperature in °C
  humidity?: number;                 // Humidity % (optional)
  
  // Visual checks
  doorSealOk: boolean;               // Door seal intact
  condenserClean: boolean;           // Condenser coils clean
  interiorClean: boolean;            // Interior clean
  noIceBuildup: boolean;             // No excessive ice (freezers)
  lightsWorking: boolean;            // Interior lights working
  compressorRunning: boolean;        // Compressor running normally
  
  // Issues
  issuesFound: boolean;
  issueDescription?: string;         // If issues found, describe
  
  // Corrective actions
  actionTaken?: string;              // What was done to fix issues
  resolvedBy?: string;               // Who resolved it
  resolvedAt?: Date;                // When resolved
  
  // Photos (optional)
  photos?: string[];                 // Photo URLs of readings/gauge
  
  // Alert status
  isOutOfRange: boolean;             // Temperature was out of range
  alertSent?: boolean;              // Alert was sent
  
  createdAt?: any;
}

// Cold Room Alert
export interface ColdRoomAlert {
  id: string;
  coldRoomId: string;
  coldRoomName: string;
  companyId?: string;
  
  type: 'temp_high' | 'temp_low' | 'door_open' | 'power_outage' | 'compressor_fault' | 'maintenance_due';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  
  temperature?: number;           // Temperature at time of alert
  threshold?: number;             // Threshold that was breached
  
  isActive: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  
  createdAt: any;
}

// Cold Room Maintenance Record
export interface ColdRoomMaintenanceRecord {
  id: string;
  coldRoomId: string;
  coldRoomName: string;
  companyId?: string;
  
  type: 'daily_cleaning' | 'weekly_check' | 'monthly_service' | 'quarterly_service' | 'repair' | 'defrost';
  scheduledDate: Date;
  completedDate?: Date;
  
  workPerformed: string;
  technician: string;
  cost?: number;
  
  // Checklist items
  tempCalibrationChecked: boolean;
  doorSealInspected: boolean;
  condenserCleaned: boolean;
  defrostCompleted: boolean;
  refrigerantLevelChecked: boolean;
  
  notes?: string;
  photos?: string[];
  
  nextServiceDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  
  createdAt: any;
}

// Temperature Check Schedule
export const CHECK_TIMES = {
  MORNING: { label: 'Morning Check', time: '08:00', endTime: '10:00' },
  MIDDAY: { label: 'Afternoon Check', time: '12:00', endTime: '14:00' },
  EVENING: { label: 'Night Check', time: '16:00', endTime: '18:00' },
} as const;

// Check if temperature is within range
export function isTempInRange(temp: number, coldRoom: ColdRoomAsset): boolean {
  return temp >= coldRoom.minTemp && temp <= coldRoom.maxTemp;
}

// Get status color for temperature
export function getTempStatusColor(temp: number, coldRoom: ColdRoomAsset): string {
  if (temp < coldRoom.criticalMin || temp > coldRoom.criticalMax) {
    return 'text-red-600 bg-red-100';
  }
  if (temp < coldRoom.minTemp || temp > coldRoom.maxTemp) {
    return 'text-yellow-600 bg-yellow-100';
  }
  return 'text-green-600 bg-green-100';
}

// Get cold room status label
export function getColdRoomStatusLabel(status: ColdRoomAsset['status']): string {
  const labels: Record<string, string> = {
    normal: 'Normal',
    warning: 'Warning',
    critical: 'Critical',
    maintenance: 'Maintenance',
    offline: 'Offline',
  };
  return labels[status] || status;
}

// Get category label
export function getCategoryLabel(category: ColdRoomAsset['category']): string {
  const labels: Record<string, string> = {
    cold_room: 'Cold Room',
    refrigerator: 'Refrigerator',
    freezer: 'Freezer',
    blast_freezer: 'Blast Freezer',
    chiller: 'Chiller',
  };
  return labels[category] || category;
}

// Maintenance intervals (in days)
export const MAINTENANCE_INTERVALS = {
  DAILY_CLEANING: 1,
  WEEKLY_CHECK: 7,
  MONTHLY_SERVICE: 30,
  QUARTERLY_SERVICE: 90,
} as const;

// Default temperature ranges by category
export const DEFAULT_TEMP_RANGES: Record<ColdRoomAsset['category'], { min: number; max: number; target: number }> = {
  cold_room: { min: 0, max: 5, target: 2 },
  refrigerator: { min: 1, max: 5, target: 3 },
  freezer: { min: -25, max: -18, target: -20 },
  blast_freezer: { min: -40, max: -30, target: -35 },
  chiller: { min: 0, max: 10, target: 5 },
};
