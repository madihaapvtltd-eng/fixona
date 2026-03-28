import { createNotification } from '@/hooks/useNotifications';

export async function notifyWorkOrderCreated(
  workOrderId: string,
  woNumber: string,
  title: string,
  createdByName: string,
  department: string
) {
  await createNotification({
    type: 'workorder_created',
    title: `New Work Order Created: ${woNumber}`,
    message: `${title} was created by ${createdByName}`,
    workOrderId,
    workOrderNumber: woNumber,
    recipientId: 'all',
    recipientRole: department,
    createdBy: 'system',
    createdByName: 'System',
  });
}

export async function notifyWorkOrderAssigned(
  workOrderId: string,
  woNumber: string,
  title: string,
  assignedToName: string,
  assignedByName: string,
  assigneeId: string,
  role: 'supervisor' | 'technician'
) {
  await createNotification({
    type: 'workorder_assigned',
    title: `Work Order Assigned: ${woNumber}`,
    message: `${title} assigned to ${assignedToName} by ${assignedByName}`,
    workOrderId,
    workOrderNumber: woNumber,
    recipientId: assigneeId,
    recipientRole: role,
    createdBy: 'system',
    createdByName: 'System',
  });
}

export async function notifyStatusChanged(
  workOrderId: string,
  woNumber: string,
  title: string,
  newStatus: string,
  updatedByName: string,
  comment?: string
) {
  await createNotification({
    type: 'status_changed',
    title: `Status Updated: ${woNumber}`,
    message: `${title} changed to ${newStatus.replace(/_/g, ' ')}${comment ? ` - "${comment}"` : ''}`,
    workOrderId,
    workOrderNumber: woNumber,
    recipientId: 'all',
    createdBy: 'system',
    createdByName: updatedByName,
  });
}

export async function notifyWorkOrderCompleted(
  workOrderId: string,
  woNumber: string,
  title: string,
  completedByName: string
) {
  await createNotification({
    type: 'workorder_completed',
    title: `Work Order Completed: ${woNumber}`,
    message: `${title} was completed by ${completedByName}`,
    workOrderId,
    workOrderNumber: woNumber,
    recipientId: 'all',
    createdBy: 'system',
    createdByName: completedByName,
  });
}

export async function notifyCommentAdded(
  workOrderId: string,
  woNumber: string,
  title: string,
  comment: string,
  addedByName: string
) {
  await createNotification({
    type: 'comment_added',
    title: `New Comment on ${woNumber}`,
    message: `${addedByName}: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
    workOrderId,
    workOrderNumber: woNumber,
    recipientId: 'all',
    createdBy: 'system',
    createdByName: addedByName,
  });
}

export async function notifyPurchaseRequest(
  workOrderId: string,
  woNumber: string,
  title: string,
  requestedByName: string
) {
  // Notify supervisor and admin about purchase request
  await createNotification({
    type: 'purchase_request',
    title: `Purchase Request: ${woNumber}`,
    message: `${title} needs items purchased by ${requestedByName}`,
    workOrderId,
    workOrderNumber: woNumber,
    recipientId: 'all',
    recipientRole: 'supervisor',
    createdBy: 'system',
    createdByName: 'System',
  });
  
  // Also notify admin
  await createNotification({
    type: 'purchase_request',
    title: `Purchase Request: ${woNumber}`,
    message: `${title} needs items purchased by ${requestedByName}`,
    workOrderId,
    workOrderNumber: woNumber,
    recipientId: 'all',
    recipientRole: 'admin',
    createdBy: 'system',
    createdByName: 'System',
  });
}
