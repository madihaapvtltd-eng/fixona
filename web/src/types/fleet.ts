export interface Vehicle {
  id: string;
  name: string;
  vehicleType: 'car' | 'van' | 'truck' | 'bus' | 'golf-cart' | 'atv' | 'motorcycle' | 'seaplane';
  assetCode: string;
  
  // Registration
  registrationNumber: string;
  licensePlate?: string;
  
  // Specifications
  make: string;
  model: string;
  year: number;
  color: string;
  capacity: number; // passengers
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  
  // Status
  status: 'available' | 'in-use' | 'maintenance' | 'out-of-service';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Odometer
  currentMileage: number;
  
  // Maintenance
  lastServiceDate?: string;
  nextServiceDue?: string;
  serviceInterval: number; // km
  
  // Assignment
  assignedDriver?: string;
  assignedDepartment?: string;
  
  // Insurance & docs
  insuranceExpiry?: string;
  registrationExpiry?: string;
  
  // Location
  currentLocation?: string;
  homeLocation: string;
  
  images?: string[];
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Trip {
  id: string;
  vehicleId: string;
  vehicleName: string;
  
  // Trip details
  tripType: 'guest-transfer' | 'airport-transfer' | 'staff-transport' | 'delivery' | 'maintenance' | 'personal';
  purpose?: string;
  
  // Route
  startLocation: string;
  destination: string;
  route?: string;
  distance?: number; // km
  
  // Timing
  startTime: string;
  expectedEnd: string;
  actualEnd?: string;
  
  // Passengers
  passengerCount: number;
  passengerNames?: string[];
  guestName?: string;
  guestRoom?: string;
  
  // Driver
  driverId: string;
  driverName: string;
  
  // Status
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  // Fuel
  fuelStart?: number;
  fuelEnd?: number;
  fuelUsed?: number;
  
  // Odometer
  startMileage: number;
  endMileage?: number;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  vehicleName: string;
  
  // Fuel details
  fuelType: 'petrol' | 'diesel' | 'electric';
  liters: number;
  cost: number;
  pricePerLiter: number;
  
  // Odometer reading at refuel
  mileage: number;
  
  // Date & location
  date: string;
  time: string;
  location: string;
  
  // Staff
  recordedBy: string;
  recordedByName: string;
  
  // For calculations
  distanceSinceLastRefuel?: number;
  kmPerLiter?: number;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
}

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehicleName: string;
  
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'tire-change' | 'oil-change' | 'brake-service' | 'battery-replacement' | 'body-work';
  description: string;
  
  // Service details
  serviceDate: string;
  serviceProvider?: string;
  cost?: number;
  
  // Mileage at service
  mileage: number;
  
  // Next service
  nextServiceDue?: string;
  nextServiceMileage?: number;
  
  // Parts
  partsReplaced?: string[];
  
  performedBy: string;
  performedByName: string;
  
  photos?: string[];
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
}

export interface Driver {
  id: string;
  staffId: string;
  name: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  
  // Qualifications
  vehicleTypes: string[]; // what they can drive
  
  // Status
  status: 'active' | 'suspended' | 'on-leave';
  
  // Stats
  totalTrips: number;
  totalDistance: number;
  
  // Contact
  phone: string;
  email?: string;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const vehicleTypeLabels: Record<string, string> = {
  'car': 'Car',
  'van': 'Van',
  'truck': 'Truck',
  'bus': 'Bus',
  'golf-cart': 'Golf Cart',
  'atv': 'ATV/Quad',
  'motorcycle': 'Motorcycle',
  'seaplane': 'Seaplane',
};

export const tripTypeLabels: Record<string, string> = {
  'guest-transfer': 'Guest Transfer',
  'airport-transfer': 'Airport Transfer',
  'staff-transport': 'Staff Transport',
  'delivery': 'Delivery',
  'maintenance': 'Maintenance Run',
  'personal': 'Personal Use',
};

export const vehicleStatusLabels: Record<string, string> = {
  'available': 'Available',
  'in-use': 'In Use',
  'maintenance': 'Under Maintenance',
  'out-of-service': 'Out of Service',
};

export const vehicleStatusColors: Record<string, string> = {
  'available': 'bg-green-100 text-green-800',
  'in-use': 'bg-blue-100 text-blue-800',
  'maintenance': 'bg-yellow-100 text-yellow-800',
  'out-of-service': 'bg-red-100 text-red-800',
};

export const tripStatusLabels: Record<string, string> = {
  'scheduled': 'Scheduled',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

export const tripStatusColors: Record<string, string> = {
  'scheduled': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export const maintenanceTypeLabels: Record<string, string> = {
  'routine': 'Routine Service',
  'repair': 'Repair',
  'inspection': 'Inspection',
  'tire-change': 'Tire Change',
  'oil-change': 'Oil Change',
  'brake-service': 'Brake Service',
  'battery-replacement': 'Battery Replacement',
  'body-work': 'Body Work',
};
