export interface Room {
  id: string;
  roomNumber: string;
  roomType: 'villa' | 'suite' | 'bungalow' | 'standard' | 'deluxe' | 'presidential';
  bedConfiguration: 'king' | 'queen' | 'twin' | 'double' | 'bunk';
  maxOccupancy: number;
  floor?: string;
  location: string;
  viewType: 'ocean' | 'lagoon' | 'garden' | 'beach' | 'pool' | 'partial-ocean';
  amenities: string[];
  status: 'vacant-clean' | 'vacant-dirty' | 'occupied' | 'occupied-do-not-disturb' | 'maintenance' | 'out-of-order';
  condition: 'excellent' | 'good' | 'fair' | 'needs-repair';
  companyId: string;
  companyName?: string;
  assignedHousekeeper?: string;
  assignedHousekeeperName?: string;
  currentGuest?: string;
  checkInDate?: string;
  checkOutDate?: string;
  lastCleaned?: string;
  cleaningPriority: 'normal' | 'high' | 'urgent';
  notes?: string;
  images?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface CleaningTask {
  id: string;
  roomId: string;
  roomNumber: string;
  assignedTo: string;
  assignedToName: string;
  taskType: 'regular-cleaning' | 'deep-cleaning' | 'turnover' | 'touch-up' | 'turndown' | 'special-request';
  status: 'pending' | 'in-progress' | 'completed' | 'verified' | 'issue-reported';
  priority: 'normal' | 'high' | 'urgent';
  scheduledDate: string;
  scheduledTime?: string;
  startedAt?: string;
  completedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  itemsToReplenish?: {
    towels?: number;
    toiletries?: boolean;
    minibar?: boolean;
    waterBottles?: number;
    linens?: boolean;
  };
  issuesFound?: string[];
  guestRequests?: string;
  notes?: string;
  companyId: string;
  companyName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface HousekeepingInspection {
  id: string;
  roomId: string;
  roomNumber: string;
  inspectedBy: string;
  inspectedByName: string;
  inspectionDate: string;
  overallStatus: 'passed' | 'needs-attention' | 'failed';
  cleanlinessScore: number;
  maintenanceScore: number;
  amenitiesScore: number;
  checklist: {
    bedMade: boolean;
    bathroomClean: boolean;
    floorsVacuumed: boolean;
    dustingDone: boolean;
    mirrorsClean: boolean;
    towelsNeatlyFolded: boolean;
    toiletriesReplenished: boolean;
    minibarStocked: boolean;
    lightsWorking: boolean;
    acWorking: boolean;
    noOdors: boolean;
    windowsClean: boolean;
  };
  issuesFound: string[];
  photos?: string[];
  notes?: string;
  companyId: string;
  companyName?: string;
  createdAt?: any;
}

export const roomStatusLabels: Record<string, string> = {
  'vacant-clean': 'Vacant Clean',
  'vacant-dirty': 'Vacant Dirty',
  'occupied': 'Occupied',
  'occupied-do-not-disturb': 'Do Not Disturb',
  'maintenance': 'Under Maintenance',
  'out-of-order': 'Out of Order',
};

export const roomStatusColors: Record<string, string> = {
  'vacant-clean': 'bg-green-100 text-green-800',
  'vacant-dirty': 'bg-yellow-100 text-yellow-800',
  'occupied': 'bg-blue-100 text-blue-800',
  'occupied-do-not-disturb': 'bg-red-100 text-red-800',
  'maintenance': 'bg-orange-100 text-orange-800',
  'out-of-order': 'bg-gray-100 text-gray-800',
};

export const cleaningTaskStatusLabels: Record<string, string> = {
  'pending': 'Pending',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'verified': 'Verified',
  'issue-reported': 'Issue Reported',
};

export const cleaningTaskStatusColors: Record<string, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
  'verified': 'bg-purple-100 text-purple-800',
  'issue-reported': 'bg-red-100 text-red-800',
};

export const roomTypeLabels: Record<string, string> = {
  'villa': 'Private Villa',
  'suite': 'Suite',
  'bungalow': 'Bungalow',
  'standard': 'Standard Room',
  'deluxe': 'Deluxe Room',
  'presidential': 'Presidential Suite',
};

export const viewTypeLabels: Record<string, string> = {
  'ocean': 'Ocean View',
  'lagoon': 'Lagoon View',
  'garden': 'Garden View',
  'beach': 'Beach Front',
  'pool': 'Pool View',
  'partial-ocean': 'Partial Ocean View',
};

export const taskTypeLabels: Record<string, string> = {
  'regular-cleaning': 'Regular Cleaning',
  'deep-cleaning': 'Deep Cleaning',
  'turnover': 'Turnover Service',
  'touch-up': 'Touch-Up Service',
  'turndown': 'Evening Turndown',
  'special-request': 'Special Request',
};

export const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    'vacant-clean': '✓',
    'vacant-dirty': '🧹',
    'occupied': '👤',
    'occupied-do-not-disturb': '🚫',
    'maintenance': '🔧',
    'out-of-order': '⛔',
  };
  return icons[status] || '?';
};
