import { create } from 'zustand';

import { persist } from 'zustand/middleware';



export interface Company {

  id: string;

  name: string;

  code: string;

  address?: string;

  phone?: string;

  email?: string;

  logo?: string;

  isActive: boolean;

  createdAt: any;

}



export interface User {

  id: string;

  email: string;

  name: string;

  role: 'super_admin' | 'company_admin' | 'supervisor' | 'technician' | 'staff' | 'viewer';

  companyId?: string;

  companyName?: string;

  avatar?: string;

  phone?: string;

  department?: string;

  isActive: boolean;

  lastLoginAt?: any;

  createdAt?: any;

}



export type Permission = 

  | 'companies:read' | 'companies:create' | 'companies:update' | 'companies:delete'

  | 'users:read' | 'users:create' | 'users:update' | 'users:delete'

  | 'assets:read' | 'assets:create' | 'assets:update' | 'assets:delete'

  | 'work_orders:read' | 'work_orders:create' | 'work_orders:update' | 'work_orders:delete'

  | 'fuel:read' | 'fuel:create' | 'fuel:update' | 'fuel:delete'

  | 'generators:read' | 'generators:create' | 'generators:update' | 'generators:delete'

  | 'reports:read' | 'reports:export'

  | 'settings:read' | 'settings:update';



const rolePermissions: Record<User['role'], Permission[]> = {

  super_admin: [

    'companies:read', 'companies:create', 'companies:update', 'companies:delete',

    'users:read', 'users:create', 'users:update', 'users:delete',

    'assets:read', 'assets:create', 'assets:update', 'assets:delete',

    'work_orders:read', 'work_orders:create', 'work_orders:update', 'work_orders:delete',

    'fuel:read', 'fuel:create', 'fuel:update', 'fuel:delete',

    'generators:read', 'generators:create', 'generators:update', 'generators:delete',

    'reports:read', 'reports:export',

    'settings:read', 'settings:update'

  ],

  company_admin: [

    'users:read', 'users:create', 'users:update', 'users:delete',

    'assets:read', 'assets:create', 'assets:update', 'assets:delete',

    'work_orders:read', 'work_orders:create', 'work_orders:update', 'work_orders:delete',

    'fuel:read', 'fuel:create', 'fuel:update', 'fuel:delete',

    'generators:read', 'generators:create', 'generators:update', 'generators:delete',

    'reports:read', 'reports:export',

    'settings:read', 'settings:update'

  ],

  supervisor: [

    'users:read',

    'assets:read', 'assets:create', 'assets:update',

    'work_orders:read', 'work_orders:create', 'work_orders:update', 'work_orders:delete',

    'fuel:read', 'fuel:create', 'fuel:update',

    'generators:read', 'generators:create', 'generators:update',

    'reports:read'

  ],

  technician: [

    'assets:read',

    'work_orders:read', 'work_orders:update',

    'fuel:read', 'fuel:create',

    'generators:read'

  ],

  staff: [

    'assets:read',

    'work_orders:read',

    'fuel:read'

  ],

  viewer: [

    'assets:read',

    'work_orders:read',

    'reports:read'

  ]

};



interface AuthState {

  user: User | null;

  currentCompany: Company | null;

  companies: Company[];

  loading: boolean;

  setUser: (user: User | null) => void;

  setCurrentCompany: (company: Company | null) => void;

  setCompanies: (companies: Company[]) => void;

  setLoading: (loading: boolean) => void;

  logout: () => void;

  clearStorage: () => void;

  hasPermission: (permission: Permission) => boolean;

  isSuperAdmin: () => boolean;

  isCompanyAdmin: () => boolean;

  canManageCompany: (companyId: string) => boolean;

  getCompanyId: () => string | undefined;

}



export const hasPermission = (user: User | null, permission: Permission): boolean => {

  if (!user) return false;

  const permissions = rolePermissions[user.role] || [];

  return permissions.includes(permission);

};



export const useAuthStore = create<AuthState>()(

  persist(

    (set, get) => ({
      user: null,
      currentCompany: null,
      companies: [],
      loading: false,

      setUser: (user) => set({ user }),
      setCurrentCompany: (company) => set({ currentCompany: company }),
      setCompanies: (companies) => set({ companies }),
      setLoading: (loading) => set({ loading }),

      logout: () => {
        set({ user: null, currentCompany: null });
        localStorage.removeItem('auth-storage');
      },

      clearStorage: () => {
        set({ user: null, currentCompany: null, loading: false });
        localStorage.removeItem('auth-storage');
        sessionStorage.clear();
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
      },

      hasPermission: (permission: Permission) => {
        const state = get();
        if (!state.user) return false;
        const permissions = rolePermissions[state.user.role] || [];
        return permissions.includes(permission);
      },

      isSuperAdmin: () => {
        const state = get();
        return state.user?.role === 'super_admin';
      },

      isCompanyAdmin: () => {
        const state = get();
        return state.user?.role === 'company_admin';
      },

      canManageCompany: (companyId: string) => {
        const state = get();
        if (!state.user) return false;
        if (state.user.role === 'super_admin') return true;
        return state.user.companyId === companyId;
      },

      getCompanyId: () => {
        const state = get();
        return state.currentCompany?.id || state.user?.companyId;
      },
    }),

    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        currentCompany: state.currentCompany,
        companies: state.companies,
        loading: false 
      }),
    }

  )

);

