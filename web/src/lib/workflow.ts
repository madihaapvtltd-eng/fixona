// Work Order Workflow Configuration
// Tracks multi-stage workflow: User → Supervisor → Technician → Complete

export const WORKFLOW_STAGES = {
  // Stage 1: Issue Raised
  RAISED: {
    code: 'raised',
    label: 'Issue Raised',
    description: 'User has logged the work order',
    assignedTo: 'user',
    nextStages: ['assigned_to_supervisor'],
    actions: ['Assign to Supervisor'],
  },

  // Stage 2: Assigned to Supervisor
  ASSIGNED_TO_SUPERVISOR: {
    code: 'assigned_to_supervisor',
    label: 'Assigned to Supervisor',
    description: 'Supervisor has been assigned',
    assignedTo: 'supervisor',
    nextStages: ['assigned_to_technician', 'rejected'],
    actions: ['Assign to Technician', 'Reject'],
  },

  // Stage 3: Assigned to Technician
  ASSIGNED_TO_TECHNICIAN: {
    code: 'assigned_to_technician',
    label: 'Assigned to Technician',
    description: 'Technician is working on the issue',
    assignedTo: 'technician',
    nextStages: ['in_progress', 'need_to_buy'],
    actions: ['Start Work', 'Need Parts'],
  },

  // Stage 4: In Progress
  IN_PROGRESS: {
    code: 'in_progress',
    label: 'In Progress',
    description: 'Technician is fixing the issue',
    assignedTo: 'technician',
    nextStages: ['fixed', 'need_to_buy'],
    actions: ['Mark as Fixed', 'Need Parts'],
  },

  // Stage 5: Need to Buy (Purchase Request) - Admin/Supervisor notified
  NEED_TO_BUY: {
    code: 'need_to_buy',
    label: 'Need to Purchase Items',
    description: 'Technician needs parts/materials - Admin/Supervisor notified',
    assignedTo: 'supervisor',
    nextStages: ['purchase_assigned_technician', 'purchase_assigned_purchasing'],
    actions: ['Buy by Tech & Submit Bill', 'Assign to Purchasing'],
  },

  // Stage 6a: Purchase Assigned to Technician (Buy & Submit Bill)
  PURCHASE_ASSIGNED_TECHNICIAN: {
    code: 'purchase_assigned_technician',
    label: 'Technician Buys & Submits Bill',
    description: 'Technician will purchase and submit bill for signature/cash',
    assignedTo: 'technician',
    nextStages: ['bill_submitted'],
    actions: ['Submit Bill for Signature'],
  },

  // Stage 6b: Purchase Assigned to Purchasing Team
  PURCHASE_ASSIGNED_PURCHASING: {
    code: 'purchase_assigned_purchasing',
    label: 'Assigned to Purchasing',
    description: 'Purchasing team acknowledged - working on quotation',
    assignedTo: 'purchasing',
    nextStages: ['quotation_in_progress'],
    actions: ['Acknowledge & Start Quotation'],
  },

  // Stage 7: Quotation In Progress
  QUOTATION_IN_PROGRESS: {
    code: 'quotation_in_progress',
    label: 'Quotation In Progress',
    description: 'Purchasing team getting quotations from suppliers',
    assignedTo: 'purchasing',
    nextStages: ['quotation_submitted_for_signature'],
    actions: ['Submit Quotation for Signature'],
  },

  // Stage 8: Quotation Submitted for Signature
  QUOTATION_SUBMITTED_FOR_SIGNATURE: {
    code: 'quotation_submitted_for_signature',
    label: 'Submitted for Signature',
    description: 'Quotation submitted - waiting for admin/supervisor approval & signature',
    assignedTo: 'admin',
    nextStages: ['quotation_approved', 'quotation_rejected'],
    actions: ['Approve & Sign', 'Reject & Return'],
  },

  // Stage 9: Quotation Approved (Signed)
  QUOTATION_APPROVED: {
    code: 'quotation_approved',
    label: 'Approved & Signed',
    description: 'Quotation approved and signed - ready for payment',
    assignedTo: 'supervisor',
    nextStages: ['payment_done'],
    actions: ['Mark as Paid'],
  },

  // Stage 10: Payment Done
  PAYMENT_DONE: {
    code: 'payment_done',
    label: 'Payment Completed',
    description: 'Payment processed - assign someone to collect items',
    assignedTo: 'supervisor',
    nextStages: ['items_collection_assigned'],
    actions: ['Assign to Collect Items'],
  },

  // Stage 11: Items Collection Assigned
  ITEMS_COLLECTION_ASSIGNED: {
    code: 'items_collection_assigned',
    label: 'Collection Assigned',
    description: 'Assigned to purchase team or technician to collect items',
    assignedTo: 'purchasing',
    nextStages: ['items_purchased'],
    actions: ['Items Collected'],
  },

  // Stage 12: Items Purchased/Collected
  ITEMS_PURCHASED: {
    code: 'items_purchased',
    label: 'Items Collected',
    description: 'Items collected from supplier - hand over to technician',
    assignedTo: 'technician',
    nextStages: ['items_received'],
    actions: ['Receive Items'],
  },

  // Stage 13: Items Received
  ITEMS_RECEIVED: {
    code: 'items_received',
    label: 'Items Received',
    description: 'Technician received items - ready to continue work',
    assignedTo: 'technician',
    nextStages: ['work_started_with_items'],
    actions: ['Start Work with Items'],
  },

  // Stage 14: Work Started with Items
  WORK_STARTED_WITH_ITEMS: {
    code: 'work_started_with_items',
    label: 'Work in Progress',
    description: 'Technician working with purchased items',
    assignedTo: 'technician',
    nextStages: ['fixed', 'need_to_buy_again'],
    actions: ['Mark as Fixed', 'Need More Parts'],
  },

  // Stage 15: Fixed
  FIXED: {
    code: 'fixed',
    label: 'Fixed',
    description: 'Work completed by technician',
    assignedTo: 'technician',
    nextStages: ['verified', 'rejected'],
    actions: ['Submit for Verification'],
  },

  // Stage 16: Verified/Complete
  COMPLETED: {
    code: 'completed',
    label: 'Completed',
    description: 'Work order successfully completed',
    assignedTo: 'supervisor',
    nextStages: [],
    actions: ['Close Work Order'],
  },

  // Rejection stages
  REJECTED: {
    code: 'rejected',
    label: 'Rejected',
    description: 'Work order rejected',
    assignedTo: 'supervisor',
    nextStages: [],
    actions: [],
  },

  QUOTATION_REJECTED: {
    code: 'quotation_rejected',
    label: 'Quotation Rejected',
    description: 'Quotation rejected - return to purchasing for new quotation',
    assignedTo: 'purchasing',
    nextStages: ['quotation_in_progress'],
    actions: ['Get New Quotation'],
  },

  // Loop: Need to Buy Again
  NEED_TO_BUY_AGAIN: {
    code: 'need_to_buy_again',
    label: 'Need More Parts',
    description: 'Technician needs additional parts - restart purchase flow',
    assignedTo: 'supervisor',
    nextStages: ['purchase_assigned_technician', 'purchase_assigned_purchasing'],
    actions: ['Buy by Tech & Submit Bill', 'Assign to Purchasing'],
  },
};

// Workflow status colors for UI
export const STAGE_COLORS = {
  raised: 'bg-gray-500',
  assigned_to_supervisor: 'bg-blue-500',
  assigned_to_technician: 'bg-blue-600',
  in_progress: 'bg-yellow-500',
  need_to_buy: 'bg-orange-500',
  purchase_assigned_technician: 'bg-orange-600',
  purchase_assigned_purchasing: 'bg-orange-600',
  quotation_in_progress: 'bg-purple-500',
  quotation_submitted_for_signature: 'bg-purple-600',
  quotation_approved: 'bg-teal-500',
  quotation_rejected: 'bg-red-500',
  payment_done: 'bg-green-600',
  items_collection_assigned: 'bg-green-500',
  items_purchased: 'bg-teal-500',
  items_received: 'bg-yellow-600',
  work_started_with_items: 'bg-yellow-500',
  fixed: 'bg-green-400',
  completed: 'bg-green-700',
  rejected: 'bg-red-600',
  need_to_buy_again: 'bg-orange-500',
};

// Helper function to get stage details
export function getStageDetails(stageCode: string) {
  return Object.values(WORKFLOW_STAGES).find(stage => stage.code === stageCode);
}

// Calculate duration in days between two timestamps
export function calculateDuration(startDate: Date, endDate: Date = new Date()): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
