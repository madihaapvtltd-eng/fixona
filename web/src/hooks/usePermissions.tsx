import { useAuthStore } from '@/stores/authStore';
import { getRolePermissions, hasPermission, PERMISSIONS, canViewWorkOrder, canEditWorkOrder, canDeleteWorkOrder } from '@/lib/permissions';

// Hook to check user permissions
export function usePermissions() {
  const { user } = useAuthStore();
  
  const userPermissions = user?.permissions || getRolePermissions(user?.role || 'user');
  const userRole = user?.role || 'user';
  const userId = user?.id || '';
  const userDepartment = user?.department || '';

  return {
    // Basic permission checks
    can: (permission: string) => hasPermission(userPermissions, permission),
    
    // View permissions
    canViewAllWorkOrders: hasPermission(userPermissions, PERMISSIONS.VIEW_ALL_DEPARTMENTS),
    canViewDepartmentWorkOrders: hasPermission(userPermissions, PERMISSIONS.VIEW_OWN_DEPARTMENT),
    canViewOnlyAssigned: hasPermission(userPermissions, PERMISSIONS.VIEW_ASSIGNED_ONLY),
    
    // Edit permissions  
    canEditAllWorkOrders: hasPermission(userPermissions, PERMISSIONS.EDIT_ALL_WORK_ORDERS),
    canEditDepartmentWorkOrders: hasPermission(userPermissions, PERMISSIONS.EDIT_OWN_DEPARTMENT),
    canEditOnlyAssigned: hasPermission(userPermissions, PERMISSIONS.EDIT_ASSIGNED_ONLY),
    
    // Delete permissions
    canDeleteAll: hasPermission(userPermissions, PERMISSIONS.DELETE_ALL),
    canDeleteDepartment: hasPermission(userPermissions, PERMISSIONS.DELETE_OWN_DEPARTMENT),
    
    // User management
    canManageAllUsers: hasPermission(userPermissions, PERMISSIONS.MANAGE_ALL_USERS),
    canManageDepartmentUsers: hasPermission(userPermissions, PERMISSIONS.MANAGE_DEPT_USERS),
    
    // Asset management
    canManageAllAssets: hasPermission(userPermissions, PERMISSIONS.MANAGE_ALL_ASSETS),
    canManageDepartmentAssets: hasPermission(userPermissions, PERMISSIONS.MANAGE_DEPT_ASSETS),
    
    // Reports
    canViewAllReports: hasPermission(userPermissions, PERMISSIONS.VIEW_ALL_REPORTS),
    canViewDepartmentReports: hasPermission(userPermissions, PERMISSIONS.VIEW_DEPT_REPORTS),
    
    // Role checks
    isAdmin: userRole === 'super_admin' || userRole === 'dept_admin',
    isSuperAdmin: userRole === 'super_admin',
    isSupervisor: userRole === 'supervisor',
    isTechnician: userRole === 'technician',
    
    // Contextual checks
    canViewWorkOrder: (workOrder: any) => canViewWorkOrder(userPermissions, userId, userDepartment, workOrder),
    canEditWorkOrder: (workOrder: any) => canEditWorkOrder(userPermissions, userId, userDepartment, workOrder),
    canDeleteWorkOrder: (workOrder: any) => canDeleteWorkOrder(userPermissions, userDepartment, workOrder),
    
    userRole,
    userId,
    userDepartment,
    userPermissions,
  };
}

// Role-based component wrapper
import { ReactNode } from 'react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  role?: string | string[];
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, role, fallback = null }: PermissionGuardProps) {
  const { can, userRole } = usePermissions();
  
  const hasAccess = permission ? can(permission) : 
    role ? (Array.isArray(role) ? role.includes(userRole) : userRole === role) : 
    false;
  
  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}

// Role-based visibility wrapper
export function RoleGuard({ children, roles, fallback = null }: { 
  children: ReactNode; 
  roles: string[]; 
  fallback?: ReactNode;
}) {
  const { userRole } = usePermissions();
  
  if (!roles.includes(userRole)) return <>{fallback}</>;
  return <>{children}</>;
}
