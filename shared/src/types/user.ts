export type UserRole = 'admin' | 'supervisor' | 'technician';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  whatsappEnabled: boolean;
  fcmToken?: string;
}

export interface UserStats {
  userId: string;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  avgCompletionTime: number;
  totalCost: number;
  rating: number;
  lastActive: Date;
}
