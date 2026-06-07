export interface GuestRequest {
  id: string;
  
  // Guest info
  guestName: string;
  roomNumber: string;
  guestId?: string;
  
  // Request details
  requestType: 'amenity' | 'service' | 'maintenance' | 'housekeeping' | 'transport' | 'dining' | 'activity' | 'complaint' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Assignment
  assignedTo?: string;
  assignedToName?: string;
  department?: string;
  
  // Timing
  requestedAt: string;
  preferredTime?: string;
  completedAt?: string;
  
  // Status
  status: 'pending' | 'acknowledged' | 'in-progress' | 'completed' | 'cancelled';
  
  // Follow up
  guestFeedback?: string;
  rating?: number;
  
  // Cost (if applicable)
  cost?: number;
  isChargeable: boolean;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ConciergeService {
  id: string;
  serviceType: 'excursion' | 'restaurant' | 'transport' | 'spa' | 'activity' | 'special';
  name: string;
  description: string;
  
  // Availability
  available: boolean;
  requiresBooking: boolean;
  advanceNotice: number; // hours
  
  // Pricing
  price: number;
  currency: string;
  isComplimentary: boolean;
  
  // Provider
  providerName?: string;
  providerContact?: string;
  
  // Details
  duration?: number; // hours
  maxParticipants?: number;
  includedItems?: string[];
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface GuestFeedback {
  id: string;
  guestName: string;
  roomNumber?: string;
  guestId?: string;
  
  // Feedback details
  feedbackType: 'complaint' | 'compliment' | 'suggestion' | 'general';
  category: 'room' | 'service' | 'dining' | 'facilities' | 'staff' | 'activities' | 'overall';
  title: string;
  description: string;
  
  // Ratings
  overallRating: number; // 1-10
  serviceRating?: number;
  cleanlinessRating?: number;
  foodRating?: number;
  facilitiesRating?: number;
  valueRating?: number;
  
  // Follow up
  requiresFollowUp: boolean;
  followUpBy?: string;
  followUpDate?: string;
  followUpNotes?: string;
  
  // Status
  status: 'new' | 'in-review' | 'action-taken' | 'resolved' | 'closed';
  
  submittedAt: string;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface LostFound {
  id: string;
  itemType: 'electronics' | 'jewelry' | 'clothing' | 'documents' | 'keys' | 'bag' | 'other';
  description: string;
  color?: string;
  brand?: string;
  
  // Location found
  foundLocation: string;
  foundDate: string;
  foundBy: string;
  foundByName: string;
  
  // Storage
  storageLocation: string;
  storageRefNumber: string;
  
  // Status
  status: 'held' | 'claimed' | 'disposed' | 'donated';
  
  // Claim details
  claimedBy?: string;
  claimedDate?: string;
  verificationMethod?: string;
  
  companyId: string;
  companyName?: string;
  
  images?: string[];
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface VipGuest {
  id: string;
  guestId: string;
  name: string;
  
  // VIP details
  vipLevel: 'silver' | 'gold' | 'platinum' | 'diamond';
  reason: string; // why they are VIP
  
  // Preferences
  preferences?: {
    room?: string;
    amenities?: string[];
    dining?: string;
    activities?: string[];
    dietary?: string[];
    allergies?: string[];
  };
  
  // History
  previousStays: number;
  totalSpend?: number;
  lastStay?: string;
  
  // Current stay
  currentRoom?: string;
  checkIn?: string;
  checkOut?: string;
  
  // Special handling
  specialRequests?: string;
  assignedButler?: string;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface GuestSurvey {
  id: string;
  title: string;
  description?: string;
  
  // Questions
  questions: {
    id: string;
    type: 'rating' | 'text' | 'multiple-choice' | 'yes-no';
    question: string;
    required: boolean;
    options?: string[];
    category?: string;
  }[];
  
  // Settings
  isActive: boolean;
  sendOn: 'checkout' | 'email' | 'in-app';
  
  // Stats
  responses?: number;
  avgRating?: number;
  
  companyId: string;
  companyName?: string;
  
  createdAt?: any;
  updatedAt?: any;
}

export const requestTypeLabels: Record<string, string> = {
  'amenity': 'Amenity Request',
  'service': 'Service Request',
  'maintenance': 'Maintenance Issue',
  'housekeeping': 'Housekeeping',
  'transport': 'Transportation',
  'dining': 'Dining',
  'activity': 'Activity Booking',
  'complaint': 'Complaint',
  'other': 'Other',
};

export const requestPriorityColors: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-800',
  'normal': 'bg-blue-100 text-blue-800',
  'high': 'bg-orange-100 text-orange-800',
  'urgent': 'bg-red-100 text-red-800',
};

export const requestStatusLabels: Record<string, string> = {
  'pending': 'Pending',
  'acknowledged': 'Acknowledged',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

export const requestStatusColors: Record<string, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'acknowledged': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export const feedbackTypeLabels: Record<string, string> = {
  'complaint': 'Complaint',
  'compliment': 'Compliment',
  'suggestion': 'Suggestion',
  'general': 'General Feedback',
};

export const feedbackTypeColors: Record<string, string> = {
  'complaint': 'bg-red-100 text-red-800',
  'compliment': 'bg-green-100 text-green-800',
  'suggestion': 'bg-blue-100 text-blue-800',
  'general': 'bg-gray-100 text-gray-800',
};

export const vipLevelLabels: Record<string, string> = {
  'silver': 'Silver VIP',
  'gold': 'Gold VIP',
  'platinum': 'Platinum VIP',
  'diamond': 'Diamond VIP',
};

export const vipLevelColors: Record<string, string> = {
  'silver': 'bg-gray-100 text-gray-800 border-gray-300',
  'gold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'platinum': 'bg-purple-100 text-purple-800 border-purple-300',
  'diamond': 'bg-blue-100 text-blue-800 border-blue-300',
};
