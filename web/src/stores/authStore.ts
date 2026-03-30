import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'dept_admin' | 'supervisor' | 'technician' | 'staff';
  avatar?: string;
  phone?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  clearStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      logout: () => {
        set({ user: null });
        localStorage.removeItem('auth-storage');
      },
      clearStorage: () => {
        set({ user: null, loading: false });
        localStorage.removeItem('auth-storage');
        sessionStorage.clear();
        // Clear all caches
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user, not loading state
    }
  )
);
