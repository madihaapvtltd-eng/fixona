export const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export const STATUS_COLORS = {
  open: '#3b82f6',
  assigned: '#8b5cf6',
  in_progress: '#f59e0b',
  on_hold: '#6b7280',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

export const ASSET_STATUS_COLORS = {
  operational: '#22c55e',
  maintenance: '#f59e0b',
  offline: '#ef4444',
  retired: '#6b7280',
};

export const RISK_COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export const PRIORITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const WORK_ORDER_STATUSES: string[] = ['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'];

export const WORK_ORDER_PRIORITIES: string[] = ['low', 'medium', 'high', 'critical'];

export const USER_ROLES: string[] = ['admin', 'supervisor', 'technician'];

export const ASSET_CATEGORIES: string[] = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'Mechanical',
  'Safety',
  'IT Equipment',
  'Furniture',
  'Vehicles',
  'Production',
  'Other',
];

export const INVENTORY_CATEGORIES: string[] = [
  'Electrical',
  'Mechanical',
  'Plumbing',
  'HVAC',
  'Safety',
  'Tools',
  'Consumables',
  'Other',
];

export const UNITS_OF_MEASURE: string[] = [
  'each',
  'piece',
  'box',
  'pack',
  'kg',
  'liter',
  'meter',
  'set',
  'pair',
  'roll',
  'bundle',
];
