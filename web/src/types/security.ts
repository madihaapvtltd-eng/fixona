export interface SecurityIncident {
  id: string;
  incidentNumber: string;
  
  // Classification
  type: 'theft' | 'loss' | 'damage' | 'injury' | 'disturbance' | 'trespass' | 'medical-emergency' | 'fire' | 'natural-disaster' | 'safety-hazard' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Location & Time
  location: string;
  reportedAt: string;
  occurredAt: string;
  resolvedAt?: string;
  
  // People involved
  reportedBy: string;
  reportedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  
  // Victims/Suspects
  guestInvolved?: string;
  guestRoom?: string;
  staffInvolved?: string[];
  suspectDescription?: string;
  
  // Details
  description: string;
  actionsTaken: string[];
  outcome?: string;
  
  // Follow up
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  
  // Status
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  
  // Evidence
  photos?: string[];
  witnessStatements?: string[];
  
  // Police/Legal
  policeReportFiled: boolean;
  policeReportNumber?: string;
  insuranceClaim?: boolean;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SecurityPatrol {
  id: string;
  patrollerId: string;
  patrollerName: string;
  
  // Schedule
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  
  // Route
  route: string;
  checkpoints: {
    location: string;
    checkedAt?: string;
    status?: 'ok' | 'issue-found' | 'not-checked';
    notes?: string;
  }[];
  
  // Findings
  incidentsFound: number;
  issuesFound?: string[];
  
  // Status
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed';
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
}

export interface CCTVCheck {
  id: string;
  cameraLocation: string;
  checkedBy: string;
  checkedByName: string;
  checkDate: string;
  checkTime: string;
  
  // Status
  isOperational: boolean;
  recordingStatus: 'recording' | 'not-recording' | 'intermittent';
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Issues
  issues?: string[];
  requiresMaintenance: boolean;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
}

export interface KeyControl {
  id: string;
  keyType: 'master' | 'submaster' | 'room' | 'area' | 'emergency' | 'equipment';
  keyNumber: string;
  location: string;
  
  // Assignment
  issuedTo?: string;
  issuedToName?: string;
  issuedAt?: string;
  
  // Status
  status: 'available' | 'issued' | 'lost' | 'damaged' | 'retired';
  
  // History
  issueHistory?: {
    issuedTo: string;
    issuedAt: string;
    returnedAt?: string;
  }[];
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface EmergencyContact {
  id: string;
  name: string;
  type: 'police' | 'fire' | 'medical' | 'coast-guard' | 'ambulance' | 'hospital' | 'insurance' | 'management' | 'other';
  phone: string;
  mobile?: string;
  email?: string;
  
  priority: 'primary' | 'secondary' | 'backup';
  isActive: boolean;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SafetyEquipment {
  id: string;
  name: string;
  type: 'fire-extinguisher' | 'smoke-detector' | 'sprinkler' | 'first-aid' | 'aed' | 'emergency-light' | 'exit-sign' | 'life-jacket' | 'life-ring' | 'emergency-horn' | 'flares';
  assetCode: string;
  location: string;
  
  // Status
  status: 'operational' | 'needs-service' | 'expired' | 'missing';
  
  // Inspection
  lastInspection?: string;
  nextInspection: string;
  inspectionFrequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  
  // Expiry (for extinguishers, first aid kits, etc.)
  expiryDate?: string;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const incidentTypeLabels: Record<string, string> = {
  'theft': 'Theft',
  'loss': 'Loss',
  'damage': 'Property Damage',
  'injury': 'Injury',
  'disturbance': 'Disturbance',
  'trespass': 'Trespass',
  'medical-emergency': 'Medical Emergency',
  'fire': 'Fire',
  'natural-disaster': 'Natural Disaster',
  'safety-hazard': 'Safety Hazard',
  'other': 'Other',
};

export const severityLabels: Record<string, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'critical': 'Critical',
};

export const severityColors: Record<string, string> = {
  'low': 'bg-blue-100 text-blue-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-orange-100 text-orange-800',
  'critical': 'bg-red-100 text-red-800',
};

export const incidentStatusLabels: Record<string, string> = {
  'open': 'Open',
  'in-progress': 'In Progress',
  'resolved': 'Resolved',
  'closed': 'Closed',
};

export const incidentStatusColors: Record<string, string> = {
  'open': 'bg-red-100 text-red-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'resolved': 'bg-green-100 text-green-800',
  'closed': 'bg-gray-100 text-gray-800',
};

export const keyTypeLabels: Record<string, string> = {
  'master': 'Master Key',
  'submaster': 'Sub-Master Key',
  'room': 'Room Key',
  'area': 'Area Key',
  'emergency': 'Emergency Key',
  'equipment': 'Equipment Key',
};

export const safetyEquipmentTypeLabels: Record<string, string> = {
  'fire-extinguisher': 'Fire Extinguisher',
  'smoke-detector': 'Smoke Detector',
  'sprinkler': 'Sprinkler System',
  'first-aid': 'First Aid Kit',
  'aed': 'AED',
  'emergency-light': 'Emergency Light',
  'exit-sign': 'Exit Sign',
  'life-jacket': 'Life Jacket',
  'life-ring': 'Life Ring',
  'emergency-horn': 'Emergency Horn',
  'flares': 'Flares',
};
