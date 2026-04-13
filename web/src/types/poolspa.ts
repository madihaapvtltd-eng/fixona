export interface PoolSpaAsset {
  id: string;
  name: string;
  type: 'main-pool' | 'infinity-pool' | 'kids-pool' | 'private-pool' | 'jacuzzi' | 'spa' | 'steam-room' | 'sauna';
  location: string;
  capacity?: number;
  status: 'operational' | 'maintenance' | 'closed' | 'seasonal-closure';
  condition: 'excellent' | 'good' | 'fair' | 'needs-repair';
  companyId: string;
  companyName?: string;
  
  // Water parameters
  waterSource: 'seawater' | 'freshwater' | 'treated' | 'desalinated';
  volumeLiters?: number;
  filtrationSystem: string;
  heatingType?: 'solar' | 'electric' | 'gas' | 'none';
  
  // Safety & compliance
  lifeguardRequired: boolean;
  maxDepth?: number;
  minDepth?: number;
  safetyEquipment: string[];
  lastSafetyInspection?: string;
  nextSafetyInspection?: string;
  
  // Chemical parameters (target ranges)
  targetPH: { min: number; max: number };
  targetChlorine: { min: number; max: number };
  targetAlkalinity: { min: number; max: number };
  
  assignedMaintenanceStaff?: string;
  assignedMaintenanceStaffName?: string;
  
  images?: string[];
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface WaterTestLog {
  id: string;
  assetId: string;
  assetName: string;
  testedBy: string;
  testedByName: string;
  testDate: string;
  testTime: string;
  
  // Test results
  phLevel: number;
  chlorineLevel: number; // ppm
  alkalinity: number; // ppm
  cyanuricAcid?: number; // ppm (stabilizer)
  calciumHardness?: number; // ppm
  totalDissolvedSolids?: number; // ppm
  waterTemperature: number; // celsius
  
  // Visual inspection
  waterClarity: 'crystal-clear' | 'clear' | 'slightly-cloudy' | 'cloudy' | 'opaque';
  waterColor: 'normal' | 'slightly-green' | 'green' | 'milky' | 'brown';
  debrisPresent: boolean;
  algaeVisible: boolean;
  
  // Actions taken
  chemicalsAdded?: {
    chlorine?: number;
    phPlus?: number;
    phMinus?: number;
    alkalinityPlus?: number;
    algaecide?: boolean;
    clarifier?: boolean;
    other?: string;
  };
  
  // Compliance
  withinStandards: boolean;
  issuesFound?: string[];
  requiresFollowUp: boolean;
  
  companyId: string;
  companyName?: string;
  notes?: string;
  createdAt?: any;
}

export interface PoolMaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  maintenanceType: 'daily-cleaning' | 'backwash' | 'filter-clean' | 'deep-clean' | 'equipment-check' | 'repair' | 'seasonal-prep';
  performedBy: string;
  performedByName: string;
  date: string;
  duration: number; // minutes
  
  // Tasks performed
  tasks: {
    skimming: boolean;
    vacuuming: boolean;
    brushing: boolean;
    filterCheck: boolean;
    pumpCheck: boolean;
    waterLevelCheck: boolean;
    equipmentInspection: boolean;
  };
  
  // Findings
  issuesFound?: string[];
  partsReplaced?: string[];
  
  // Next scheduled
  nextMaintenanceDate?: string;
  nextMaintenanceType?: string;
  
  companyId: string;
  companyName?: string;
  photos?: string[];
  notes?: string;
  createdAt?: any;
}

export interface PoolAlert {
  id: string;
  assetId: string;
  assetName: string;
  type: 'ph-high' | 'ph-low' | 'chlorine-high' | 'chlorine-low' | 'temperature-high' | 'temperature-low' | 'cloudy-water' | 'equipment-failure' | 'safety-issue';
  severity: 'warning' | 'critical';
  message: string;
  value?: number;
  targetRange?: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  companyId: string;
  companyName?: string;
  createdAt?: any;
}

export const assetTypeLabels: Record<string, string> = {
  'main-pool': 'Main Swimming Pool',
  'infinity-pool': 'Infinity Pool',
  'kids-pool': 'Kids Pool',
  'private-pool': 'Private/Villa Pool',
  'jacuzzi': 'Jacuzzi/Hot Tub',
  'spa': 'Spa Pool',
  'steam-room': 'Steam Room',
  'sauna': 'Sauna',
};

export const assetStatusLabels: Record<string, string> = {
  'operational': 'Operational',
  'maintenance': 'Under Maintenance',
  'closed': 'Closed',
  'seasonal-closure': 'Seasonal Closure',
};

export const assetStatusColors: Record<string, string> = {
  'operational': 'bg-green-100 text-green-800',
  'maintenance': 'bg-yellow-100 text-yellow-800',
  'closed': 'bg-red-100 text-red-800',
  'seasonal-closure': 'bg-blue-100 text-blue-800',
};

export const waterClarityLabels: Record<string, string> = {
  'crystal-clear': 'Crystal Clear',
  'clear': 'Clear',
  'slightly-cloudy': 'Slightly Cloudy',
  'cloudy': 'Cloudy',
  'opaque': 'Opaque',
};

export const waterColorLabels: Record<string, string> = {
  'normal': 'Normal Blue',
  'slightly-green': 'Slightly Green',
  'green': 'Green (Algae)',
  'milky': 'Milky White',
  'brown': 'Brown/Murky',
};

export const maintenanceTypeLabels: Record<string, string> = {
  'daily-cleaning': 'Daily Cleaning',
  'backwash': 'Filter Backwash',
  'filter-clean': 'Filter Cleaning',
  'deep-clean': 'Deep Clean',
  'equipment-check': 'Equipment Check',
  'repair': 'Repair',
  'seasonal-prep': 'Seasonal Preparation',
};

// WHO/FDA standards for pool water
export const waterQualityStandards = {
  ph: { min: 7.2, max: 7.8, ideal: 7.4 },
  chlorine: { min: 1.0, max: 3.0, ideal: 1.5 },
  alkalinity: { min: 80, max: 120, ideal: 100 },
  cyanuricAcid: { min: 30, max: 50, ideal: 40 },
  calciumHardness: { min: 200, max: 400, ideal: 300 },
  temperature: { min: 26, max: 30, ideal: 28 }, // Celsius for tropical pools
};

export const getWaterQualityStatus = (test: WaterTestLog): 'excellent' | 'good' | 'fair' | 'poor' => {
  const standards = waterQualityStandards;
  
  let score = 0;
  let checks = 0;
  
  if (test.phLevel >= standards.ph.min && test.phLevel <= standards.ph.max) score++;
  checks++;
  
  if (test.chlorineLevel >= standards.chlorine.min && test.chlorineLevel <= standards.chlorine.max) score++;
  checks++;
  
  if (test.alkalinity >= standards.alkalinity.min && test.alkalinity <= standards.alkalinity.max) score++;
  checks++;
  
  if (test.waterClarity === 'crystal-clear' || test.waterClarity === 'clear') score++;
  checks++;
  
  if (test.waterColor === 'normal') score++;
  checks++;
  
  const ratio = score / checks;
  if (ratio >= 0.9) return 'excellent';
  if (ratio >= 0.7) return 'good';
  if (ratio >= 0.5) return 'fair';
  return 'poor';
};
