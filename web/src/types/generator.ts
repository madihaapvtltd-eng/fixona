// Generator Asset extending base Asset interface
export interface GeneratorAsset {
  id: string;
  assetCode: string;
  name: string;
  category: 'generator';
  status: 'running' | 'standby' | 'maintenance' | 'offline' | 'fault';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  companyId?: string;
  companyName?: string;
  description?: string;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  warrantyExpiry?: string;
  qrCode?: string;
  images?: string[];
  createdAt?: any;
  
  // Runtime tracking (critical for generators)
  totalRuntimeHours: number;
  currentSessionHours: number;
  lastStartTime?: Date;
  
  // Power specs
  powerRatingKva: number;
  powerOutputKw?: number;
  voltage: number;
  frequency: number;
  
  // Fuel integration
  fuelTankCapacityLiters: number;
  currentFuelLevel: number; // percentage 0-100
  fuelConsumptionRate: number; // liters/hour at full load
  
  // Maintenance triggers (runtime-based, not just calendar)
  nextServiceHours: number;
  serviceIntervalHours: number;
  lastServiceDate?: Date;
  
  // Status
  isRunning: boolean;
  loadPercentage: number;
  atsStatus: 'mains' | 'generator' | 'transfer';
  
  // Location/Installation
  installationType: 'permanent' | 'mobile';
  backupFor: string[]; // asset IDs this generator backs up
}

// Runtime log entry
export interface GeneratorRuntimeLog {
  id: string;
  generatorId: string;
  generatorName: string;
  startTime: Date;
  endTime?: Date;
  runtimeHours: number;
  fuelConsumed?: number;
  loadPercentage: number;
  powerOutputKw?: number;
  operatorName?: string;
  notes?: string;
  createdAt: any;
}

// Maintenance record
export interface GeneratorMaintenanceRecord {
  id: string;
  generatorId: string;
  generatorName: string;
  type: 'daily' | 'weekly' | 'monthly' | '250hr' | '500hr' | 'custom';
  serviceHours: number;
  workPerformed: string;
  partsReplaced?: string[];
  technician: string;
  cost?: number;
  nextServiceHours: number;
  notes?: string;
  createdAt: any;
}

// Generator alarm
export interface GeneratorAlarm {
  id: string;
  generatorId: string;
  generatorName: string;
  type: 'low_fuel' | 'overload' | 'maintenance_due' | 'fault' | 'ats_transfer';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: any;
}

// Service intervals (in hours)
export const SERVICE_INTERVALS = {
  DAILY: 24,      // Visual inspection, fuel check
  WEEKLY: 168,    // Battery check, air filter, run test
  MONTHLY: 720,   // Oil check, belt inspection
  HOURS_250: 250, // Oil change, filter replacement
  HOURS_500: 500, // Air filter, fuel filter, coolant
} as const;

// Check if generator needs service
export function needsService(generator: GeneratorAsset): boolean {
  const hoursUntilService = generator.nextServiceHours - generator.totalRuntimeHours;
  const daysSinceLastService = generator.lastServiceDate 
    ? Math.floor((Date.now() - generator.lastServiceDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  return hoursUntilService <= 0 || daysSinceLastService >= 90;
}

// Calculate remaining runtime based on fuel level
export function calculateRemainingRuntime(generator: GeneratorAsset): number {
  if (generator.fuelConsumptionRate <= 0) return 0;
  const fuelLiters = (generator.fuelTankCapacityLiters * generator.currentFuelLevel) / 100;
  return fuelLiters / generator.fuelConsumptionRate;
}

// Get status color
export function getGeneratorStatusColor(status: GeneratorAsset['status']): string {
  switch (status) {
    case 'running': return 'text-green-600 bg-green-100';
    case 'standby': return 'text-blue-600 bg-blue-100';
    case 'maintenance': return 'text-yellow-600 bg-yellow-100';
    case 'offline': return 'text-gray-600 bg-gray-100';
    case 'fault': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

// Get ATS status label
export function getAtsStatusLabel(status: GeneratorAsset['atsStatus']): string {
  switch (status) {
    case 'mains': return 'On Mains Power';
    case 'generator': return 'On Generator Power';
    case 'transfer': return 'Transferring';
    default: return 'Unknown';
  }
}
