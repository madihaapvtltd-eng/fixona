export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // hours
  department: string;
  color: string;
  isNightShift: boolean;
  breakDuration: number; // minutes
  companyId: string;
  companyName?: string;
  createdAt?: any;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  department: string;
  
  // Shift details
  shiftId: string;
  shiftName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  
  // Status
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'absent' | 'leave';
  
  // Location/Assignment
  location?: string;
  assignment?: string;
  notes?: string;
  
  // Check in/out
  checkedInAt?: string;
  checkedOutAt?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  
  // OT and breaks
  overtimeHours?: number;
  breakStart?: string;
  breakEnd?: string;
  
  // Swap/Cover
  isSwapRequest: boolean;
  swapRequestedWith?: string;
  swapStatus?: 'pending' | 'approved' | 'rejected';
  coveredBy?: string;
  
  companyId: string;
  companyName?: string;
  createdBy: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface TimeOffRequest {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  
  // Leave details
  type: 'annual' | 'sick' | 'emergency' | 'unpaid' | 'maternity' | 'paternity' | 'training';
  startDate: string;
  endDate: string;
  days: number;
  
  // Status workflow
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: string;
  
  // Approvals
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  reason: string;
  supportingDoc?: string;
  
  companyId: string;
  companyName?: string;
  createdAt?: any;
}

export interface StaffAvailability {
  id: string;
  staffId: string;
  staffName: string;
  
  // Weekly availability pattern
  availability: {
    monday: { available: boolean; preferredShift?: string };
    tuesday: { available: boolean; preferredShift?: string };
    wednesday: { available: boolean; preferredShift?: string };
    thursday: { available: boolean; preferredShift?: string };
    friday: { available: boolean; preferredShift?: string };
    saturday: { available: boolean; preferredShift?: string };
    sunday: { available: boolean; preferredShift?: string };
  };
  
  // Exceptions (dates not available)
  exceptions?: string[]; // YYYY-MM-DD dates
  
  // Max hours per week
  maxHoursPerWeek: number;
  preferredMaxShiftsPerWeek: number;
  
  companyId: string;
  companyName?: string;
  updatedAt?: any;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  department: string;
  
  // Template pattern (day of week -> shift assignments)
  pattern: {
    monday?: { shiftId: string; staffNeeded: number; roles: string[] };
    tuesday?: { shiftId: string; staffNeeded: number; roles: string[] };
    wednesday?: { shiftId: string; staffNeeded: number; roles: string[] };
    thursday?: { shiftId: string; staffNeeded: number; roles: string[] };
    friday?: { shiftId: string; staffNeeded: number; roles: string[] };
    saturday?: { shiftId: string; staffNeeded: number; roles: string[] };
    sunday?: { shiftId: string; staffNeeded: number; roles: string[] };
  };
  
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  
  companyId: string;
  companyName?: string;
  createdAt?: any;
}

export const shiftStatusLabels: Record<string, string> = {
  'scheduled': 'Scheduled',
  'confirmed': 'Confirmed',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'absent': 'Absent',
  'leave': 'On Leave',
};

export const shiftStatusColors: Record<string, string> = {
  'scheduled': 'bg-blue-100 text-blue-800',
  'confirmed': 'bg-green-100 text-green-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-gray-100 text-gray-800',
  'absent': 'bg-red-100 text-red-800',
  'leave': 'bg-purple-100 text-purple-800',
};

export const leaveTypeLabels: Record<string, string> = {
  'annual': 'Annual Leave',
  'sick': 'Sick Leave',
  'emergency': 'Emergency Leave',
  'unpaid': 'Unpaid Leave',
  'maternity': 'Maternity Leave',
  'paternity': 'Paternity Leave',
  'training': 'Training',
};

export const leaveStatusLabels: Record<string, string> = {
  'pending': 'Pending Approval',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'cancelled': 'Cancelled',
};

export const leaveStatusColors: Record<string, string> = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'cancelled': 'bg-gray-100 text-gray-800',
};

export const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const getDayName = (date: Date): string => {
  return dayNames[date.getDay()];
};

export const calculateHoursBetween = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let mins = endMin - startMin;
  
  if (mins < 0) {
    hours--;
    mins += 60;
  }
  
  if (hours < 0) {
    hours += 24; // Overnight shift
  }
  
  return hours + mins / 60;
};
