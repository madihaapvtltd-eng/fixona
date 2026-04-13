export interface WaterTank {
  id: string;
  name: string;
  tankType: 'freshwater' | 'desalinated' | 'rainwater' | 'wastewater' | 'firefighting';
  location: string;
  capacity: number; // liters
  currentLevel: number; // liters (real-time sensor or manual reading)
  percentageFull: number;
  minLevel: number; // alert threshold
  maxLevel: number; // overflow threshold
  
  // Technical specs
  material: 'concrete' | 'steel' | 'plastic' | 'fiberglass';
  dimensions?: { length: number; width: number; height: number }; // meters
  inletSource?: string;
  outletDestination?: string[];
  hasLevelSensor: boolean;
  
  status: 'active' | 'maintenance' | 'offline';
  condition: 'excellent' | 'good' | 'fair' | 'needs-repair';
  
  lastCleaning?: string;
  nextCleaning?: string;
  lastInspection?: string;
  
  companyId: string;
  companyName?: string;
  assignedStaff?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface DesalinationUnit {
  id: string;
  name: string;
  model: string;
  capacity: number; // liters per day
  technology: 'ro' | 'thermal' | 'electrodialysis' | 'hybrid';
  
  // Status
  status: 'running' | 'standby' | 'maintenance' | 'offline';
  dailyProduction: number; // actual liters today
  totalRuntime: number; // hours
  
  // Energy
  powerConsumption: number; // kW
  energySource: 'solar' | 'grid' | 'generator' | 'hybrid';
  
  // Quality
  tdsInput: number; // ppm
  tdsOutput: number; // ppm
  qualityStatus: 'good' | 'fair' | 'poor';
  
  lastMaintenance?: string;
  nextMaintenance?: string;
  
  companyId: string;
  companyName?: string;
  location: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SolarInstallation {
  id: string;
  name: string;
  location: string;
  systemType: 'rooftop' | 'ground-mount' | 'floating' | 'carport';
  
  // Capacity
  totalCapacity: number; // kW
  panelCount: number;
  panelWattage: number;
  inverterCapacity: number;
  batteryStorage?: number; // kWh
  
  // Production
  dailyProduction: number; // kWh today
  monthlyProduction: number; // kWh this month
  totalProduction: number; // kWh lifetime
  
  // Current status
  currentOutput: number; // kW
  efficiency: number; // percentage
  
  // Environmental
  co2Saved: number; // kg
  
  status: 'operational' | 'maintenance' | 'fault' | 'offline';
  
  lastCleaning?: string;
  lastInspection?: string;
  nextInspection?: string;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface WaterReading {
  id: string;
  tankId: string;
  tankName: string;
  
  // Reading data
  level: number; // liters
  percentage: number;
  readingMethod: 'sensor' | 'manual' | 'estimated';
  
  // Quality (if applicable)
  tds?: number; // ppm
  ph?: number;
  turbidity?: number; // NTU
  chlorine?: number; // ppm
  
  // For desalination
  productionVolume?: number; // liters produced since last reading
  energyUsed?: number; // kWh
  
  // Metadata
  recordedBy: string;
  recordedByName: string;
  readingDate: string;
  readingTime: string;
  notes?: string;
  
  companyId: string;
  companyName?: string;
  createdAt?: any;
}

export interface EnergyReading {
  id: string;
  solarId?: string;
  source: 'solar' | 'grid' | 'generator' | 'total';
  
  // Production/Consumption
  production: number; // kWh
  consumption: number; // kWh
  
  // Solar specific
  peakOutput?: number; // kW
  efficiency?: number; // percentage
  
  // Grid specific
  gridImport?: number; // kWh from grid
  gridExport?: number; // kWh to grid (if net metering)
  
  // Cost (if applicable)
  cost?: number; // local currency
  
  recordedBy: string;
  recordedByName: string;
  readingDate: string;
  readingTime: string;
  notes?: string;
  
  companyId: string;
  companyName?: string;
  createdAt?: any;
}

export interface WaterAlert {
  id: string;
  assetType: 'tank' | 'desalination' | 'solar';
  assetId: string;
  assetName: string;
  alertType: 'low-level' | 'high-level' | 'quality-issue' | 'maintenance-due' | 'equipment-fault' | 'overflow-risk';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value?: number;
  threshold?: number;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  companyId: string;
  companyName?: string;
  createdAt?: any;
}

export const tankTypeLabels: Record<string, string> = {
  'freshwater': 'Freshwater Storage',
  'desalinated': 'Desalinated Water',
  'rainwater': 'Rainwater Harvesting',
  'wastewater': 'Wastewater/Treated',
  'firefighting': 'Fire Fighting Reserve',
};

export const tankStatusColors: Record<string, string> = {
  'active': 'bg-green-100 text-green-800',
  'maintenance': 'bg-yellow-100 text-yellow-800',
  'offline': 'bg-gray-100 text-gray-800',
};

export const desalTechLabels: Record<string, string> = {
  'ro': 'Reverse Osmosis (RO)',
  'thermal': 'Thermal Distillation',
  'electrodialysis': 'Electrodialysis',
  'hybrid': 'Hybrid System',
};

export const alertTypeLabels: Record<string, string> = {
  'low-level': 'Low Water Level',
  'high-level': 'High Water Level',
  'quality-issue': 'Water Quality Issue',
  'maintenance-due': 'Maintenance Due',
  'equipment-fault': 'Equipment Fault',
  'overflow-risk': 'Overflow Risk',
};

export const alertSeverityColors: Record<string, string> = {
  'info': 'bg-blue-100 text-blue-800',
  'warning': 'bg-yellow-100 text-yellow-800',
  'critical': 'bg-red-100 text-red-800',
};

export const getTankLevelColor = (percentage: number): string => {
  if (percentage <= 20) return 'bg-red-500';
  if (percentage <= 40) return 'bg-yellow-500';
  if (percentage >= 90) return 'bg-blue-500';
  return 'bg-green-500';
};
