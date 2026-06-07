export interface WaterSportsEquipment {
  id: string;
  name: string;
  equipmentType: 'kayak' | 'paddleboard' | 'surfboard' | 'jetski' | 'boat' | 'sailboat' | 'canoe' | 'windsurf' | 'kiteboard' | 'snorkel' | 'diving' | 'fishing' | 'banana-boat' | 'catamaran';
  assetCode: string;
  
  // Specifications
  capacity: number; // people
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  
  // Status
  status: 'available' | 'in-use' | 'maintenance' | 'damaged' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  
  // Location
  storageLocation: string;
  currentLocation?: string;
  
  // Safety & Compliance
  maxWeight: number; // kg
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  requiresLicense: boolean;
  requiredLicense?: string;
  safetyEquipment: string[]; // life jacket, whistle, etc.
  
  // Rental info
  rentalPricePerHour?: number;
  rentalPricePerDay?: number;
  isRentable: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  
  // Maintenance
  lastServiceDate?: string;
  nextServiceDue?: string;
  totalUses: number;
  
  // Images
  images?: string[];
  
  companyId: string;
  companyName?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface RentalRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  
  // Guest/Renter info
  guestName: string;
  guestRoom?: string;
  guestContact: string;
  idDocument?: string;
  
  // Rental details
  rentalType: 'hourly' | 'half-day' | 'full-day' | 'multi-day';
  startTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  duration: number; // hours
  
  // Staff
  issuedBy: string;
  issuedByName: string;
  receivedBy?: string;
  receivedByName?: string;
  
  // Financial
  rentalFee: number;
  deposit: number;
  damageFee?: number;
  totalCharge: number;
  
  // Status
  status: 'active' | 'returned' | 'overdue' | 'damaged' | 'lost';
  
  // Condition check
  conditionOut: string;
  conditionIn?: string;
  damages?: string[];
  damagePhotos?: string[];
  
  // Safety
  safetyBriefingGiven: boolean;
  lifeJacketIssued: boolean;
  lifeJacketReturned?: boolean;
  
  companyId: string;
  companyName?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface MarineVessel {
  id: string;
  name: string;
  vesselType: 'dhoni' | 'speedboat' | 'yacht' | 'fishing-boat' | 'transfer-boat' | 'diving-boat' | 'safety-boat';
  registrationNumber: string;
  
  // Specifications
  length: number; // meters
  capacity: number; // people
  maxSpeed: number; // knots
  fuelCapacity: number; // liters
  fuelType: 'diesel' | 'petrol';
  enginePower: string;
  
  // Status
  status: 'operational' | 'maintenance' | 'docked' | 'in-use' | 'out-of-service';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Crew
  captain?: string;
  crew?: string[];
  
  // Maintenance
  lastServiceDate?: string;
  nextServiceDue?: string;
  totalHours: number;
  
  // Safety equipment
  lifeJackets: number;
  lifeRaft: boolean;
  firstAidKit: boolean;
  fireExtinguisher: boolean;
  radio: boolean;
  gps: boolean;
  flares: boolean;
  
  // Documentation
  licenseExpiry?: string;
  insuranceExpiry?: string;
  
  currentLocation?: string;
  mooringLocation: string;
  
  images?: string[];
  
  companyId: string;
  companyName?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface VesselTrip {
  id: string;
  vesselId: string;
  vesselName: string;
  
  // Trip details
  tripType: 'guest-transfer' | 'excursion' | 'fishing' | 'diving' | 'maintenance' | 'supply' | 'safety';
  destination?: string;
  departureTime: string;
  expectedReturn: string;
  actualReturn?: string;
  
  // Passengers/Crew
  passengerCount: number;
  passengerNames?: string[];
  crew: string[];
  captain: string;
  
  // Status
  status: 'scheduled' | 'departed' | 'completed' | 'delayed' | 'cancelled';
  
  // Fuel
  fuelStart?: number;
  fuelEnd?: number;
  fuelUsed?: number;
  
  companyId: string;
  companyName?: string;
  notes?: string;
  createdAt?: any;
}

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: 'vessel' | 'equipment';
  
  maintenanceType: 'routine' | 'repair' | 'safety-check' | 'seasonal';
  description: string;
  performedBy: string;
  performedByName: string;
  date: string;
  
  partsReplaced?: string[];
  cost?: number;
  nextDue?: string;
  
  photos?: string[];
  
  companyId: string;
  companyName?: string;
  notes?: string;
  createdAt?: any;
}

export const equipmentTypeLabels: Record<string, string> = {
  'kayak': 'Kayak',
  'paddleboard': 'Stand-up Paddleboard',
  'surfboard': 'Surfboard',
  'jetski': 'Jet Ski',
  'boat': 'Small Boat',
  'sailboat': 'Sailboat',
  'canoe': 'Canoe',
  'windsurf': 'Windsurfing Board',
  'kiteboard': 'Kitesurfing Board',
  'snorkel': 'Snorkeling Equipment',
  'diving': 'Diving Equipment',
  'fishing': 'Fishing Equipment',
  'banana-boat': 'Banana Boat',
  'catamaran': 'Catamaran',
};

export const vesselTypeLabels: Record<string, string> = {
  'dhoni': 'Traditional Dhoni',
  'speedboat': 'Speedboat',
  'yacht': 'Yacht',
  'fishing-boat': 'Fishing Boat',
  'transfer-boat': 'Guest Transfer Boat',
  'diving-boat': 'Diving Support Boat',
  'safety-boat': 'Safety/Rescue Boat',
};

export const equipmentStatusLabels: Record<string, string> = {
  'available': 'Available',
  'in-use': 'In Use',
  'maintenance': 'Under Maintenance',
  'damaged': 'Damaged',
  'retired': 'Retired',
};

export const equipmentStatusColors: Record<string, string> = {
  'available': 'bg-green-100 text-green-800',
  'in-use': 'bg-blue-100 text-blue-800',
  'maintenance': 'bg-yellow-100 text-yellow-800',
  'damaged': 'bg-red-100 text-red-800',
  'retired': 'bg-gray-100 text-gray-800',
};

export const vesselStatusLabels: Record<string, string> = {
  'operational': 'Operational',
  'maintenance': 'Under Maintenance',
  'docked': 'Docked',
  'in-use': 'In Use',
  'out-of-service': 'Out of Service',
};

export const vesselStatusColors: Record<string, string> = {
  'operational': 'bg-green-100 text-green-800',
  'maintenance': 'bg-yellow-100 text-yellow-800',
  'docked': 'bg-blue-100 text-blue-800',
  'in-use': 'bg-purple-100 text-purple-800',
  'out-of-service': 'bg-red-100 text-red-800',
};

export const rentalStatusLabels: Record<string, string> = {
  'active': 'Active Rental',
  'returned': 'Returned',
  'overdue': 'Overdue',
  'damaged': 'Damaged on Return',
  'lost': 'Lost/Not Returned',
};

export const skillLevelLabels: Record<string, string> = {
  'beginner': 'Beginner Friendly',
  'intermediate': 'Intermediate',
  'advanced': 'Advanced Only',
  'all-levels': 'All Skill Levels',
};
