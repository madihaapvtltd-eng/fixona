// 3-Level Admin System with Full Permission Control
// Level 1: Super Admin - Full control
// Level 2: Department Admin - Control within assigned departments  
// Level 3: User - Limited access based on permissions

export const ADMIN_LEVELS = {
  SUPER_ADMIN: 'super_admin',      // Level 1: Full control
  DEPT_ADMIN: 'dept_admin',      // Level 2: Department control
  USER: 'user',                    // Level 3: Limited access
};

export const PERMISSIONS = {
  // View permissions
  VIEW_ALL_DEPARTMENTS: 'view_all_departments',
  VIEW_OWN_DEPARTMENT: 'view_own_department',
  VIEW_ASSIGNED_ONLY: 'view_assigned_only',
  
  // Edit permissions
  EDIT_ALL_WORK_ORDERS: 'edit_all_work_orders',
  EDIT_OWN_DEPARTMENT: 'edit_own_department',
  EDIT_ASSIGNED_ONLY: 'edit_assigned_only',
  
  // Delete permissions
  DELETE_ALL: 'delete_all',
  DELETE_OWN_DEPARTMENT: 'delete_own_department',
  NO_DELETE: 'no_delete',
  
  // User management
  MANAGE_ALL_USERS: 'manage_all_users',
  MANAGE_DEPT_USERS: 'manage_dept_users',
  NO_USER_MANAGE: 'no_user_manage',
  
  // Asset management
  MANAGE_ALL_ASSETS: 'manage_all_assets',
  MANAGE_DEPT_ASSETS: 'manage_dept_assets',
  VIEW_ASSETS_ONLY: 'view_assets_only',
  
  // Settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SETTINGS: 'view_settings',
  
  // Reports
  VIEW_ALL_REPORTS: 'view_all_reports',
  VIEW_DEPT_REPORTS: 'view_dept_reports',
  NO_REPORTS: 'no_reports',
};

// Permission sets for each role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    PERMISSIONS.EDIT_ALL_WORK_ORDERS,
    PERMISSIONS.DELETE_ALL,
    PERMISSIONS.MANAGE_ALL_USERS,
    PERMISSIONS.MANAGE_ALL_ASSETS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_ALL_REPORTS,
  ],
  
  dept_admin: [
    PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    PERMISSIONS.EDIT_OWN_DEPARTMENT,
    PERMISSIONS.DELETE_OWN_DEPARTMENT,
    PERMISSIONS.MANAGE_DEPT_USERS,
    PERMISSIONS.MANAGE_DEPT_ASSETS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_DEPT_REPORTS,
  ],
  
  supervisor: [
    PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    PERMISSIONS.EDIT_OWN_DEPARTMENT,
    PERMISSIONS.NO_DELETE,
    PERMISSIONS.NO_USER_MANAGE,
    PERMISSIONS.VIEW_ASSETS_ONLY,
    PERMISSIONS.VIEW_DEPT_REPORTS,
  ],
  
  technician: [
    PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    PERMISSIONS.EDIT_ASSIGNED_ONLY,
    PERMISSIONS.NO_DELETE,
    PERMISSIONS.NO_USER_MANAGE,
    PERMISSIONS.VIEW_ASSETS_ONLY,
    PERMISSIONS.NO_REPORTS,
  ],
  
  designer: [
    PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    PERMISSIONS.EDIT_ASSIGNED_ONLY,
    PERMISSIONS.NO_DELETE,
    PERMISSIONS.NO_USER_MANAGE,
    PERMISSIONS.VIEW_ASSETS_ONLY,
    PERMISSIONS.NO_REPORTS,
  ],
  
  marketing: [
    PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    PERMISSIONS.EDIT_ASSIGNED_ONLY,
    PERMISSIONS.NO_DELETE,
    PERMISSIONS.NO_USER_MANAGE,
    PERMISSIONS.VIEW_ASSETS_ONLY,
    PERMISSIONS.NO_REPORTS,
  ],
  
  user: [
    PERMISSIONS.VIEW_ALL_DEPARTMENTS,
    PERMISSIONS.NO_DELETE,
    PERMISSIONS.NO_USER_MANAGE,
    PERMISSIONS.VIEW_ASSETS_ONLY,
    PERMISSIONS.NO_REPORTS,
  ],
};

// Check if user has permission
export function hasPermission(userPermissions: string[], permission: string): boolean {
  return userPermissions.includes(permission);
}

// Check if user can view work order
export function canViewWorkOrder(
  userPermissions: string[],
  userId: string,
  userDepartment: string,
  workOrder: any
): boolean {
  if (hasPermission(userPermissions, PERMISSIONS.VIEW_ALL_DEPARTMENTS)) return true;
  if (hasPermission(userPermissions, PERMISSIONS.VIEW_OWN_DEPARTMENT)) {
    return workOrder.department === userDepartment;
  }
  if (hasPermission(userPermissions, PERMISSIONS.VIEW_ASSIGNED_ONLY)) {
    return workOrder.technicianId === userId || 
           workOrder.supervisorId === userId ||
           workOrder.designerId === userId ||
           workOrder.marketingId === userId ||
           workOrder.createdBy === userId;
  }
  return false;
}

// Check if user can edit work order
export function canEditWorkOrder(
  userPermissions: string[],
  userId: string,
  userDepartment: string,
  workOrder: any
): boolean {
  if (hasPermission(userPermissions, PERMISSIONS.EDIT_ALL_WORK_ORDERS)) return true;
  if (hasPermission(userPermissions, PERMISSIONS.EDIT_OWN_DEPARTMENT)) {
    return workOrder.department === userDepartment;
  }
  if (hasPermission(userPermissions, PERMISSIONS.EDIT_ASSIGNED_ONLY)) {
    return workOrder.technicianId === userId || 
           workOrder.supervisorId === userId ||
           workOrder.designerId === userId ||
           workOrder.marketingId === userId;
  }
  return false;
}

// Check if user can delete work order
export function canDeleteWorkOrder(
  userPermissions: string[],
  userDepartment: string,
  workOrder: any
): boolean {
  if (hasPermission(userPermissions, PERMISSIONS.DELETE_ALL)) return true;
  if (hasPermission(userPermissions, PERMISSIONS.DELETE_OWN_DEPARTMENT)) {
    return workOrder.department === userDepartment;
  }
  return false;
}

// Get user's role level
export function getAdminLevel(role: string): string {
  switch (role) {
    case 'super_admin':
      return ADMIN_LEVELS.SUPER_ADMIN;
    case 'dept_admin':
      return ADMIN_LEVELS.DEPT_ADMIN;
    default:
      return ADMIN_LEVELS.USER;
  }
}

// Get all permissions for a role
export function getRolePermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
}
