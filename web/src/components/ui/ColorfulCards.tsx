import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// Colorful Card Components for Assets, Work Orders, Users

interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: string;
}

export function GradientCard({ children, className = '', gradient = 'from-blue-500 to-purple-600' }: CardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-lg p-1 ${className}`}>
      <div className="bg-white rounded-xl p-6 h-full">
        {children}
      </div>
    </div>
  );
}

// Asset Card
interface AssetCardProps {
  asset: {
    id: string;
    assetCode: string;
    name: string;
    type: string;
    department: string;
    location: string;
    status: string;
    barcode?: string;
  };
}

export function AssetCard({ asset }: AssetCardProps) {
  const statusColors: Record<string, string> = {
    operational: 'bg-green-100 text-green-800 border-green-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    repair: 'bg-orange-100 text-orange-800 border-orange-200',
    offline: 'bg-red-100 text-red-800 border-red-200',
    retired: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const typeIcons: Record<string, string> = {
    equipment: '🔧',
    machinery: '⚙️',
    vehicle: '🚗',
    building: '🏢',
    it: '💻',
    furniture: '🪑',
  };

  return (
    <GradientCard gradient="from-emerald-400 to-teal-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl">
            {typeIcons[asset.type] || '📦'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{asset.name}</h3>
            <p className="text-sm text-gray-500 font-mono">{asset.assetCode}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[asset.status] || 'bg-gray-100'}`}>
          {asset.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          {asset.department}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          {asset.location}
        </div>
      </div>

      {asset.barcode && (
        <div className="mt-4 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 text-center">Barcode: {asset.barcode}</p>
        </div>
      )}

      <Link 
        to={`/assets/${asset.id}`}
        className="mt-4 block w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center rounded-lg font-medium hover:shadow-lg transition-shadow"
      >
        View Details
      </Link>
    </GradientCard>
  );
}

// Work Order Card
interface WorkOrderCardProps {
  workOrder: {
    id: string;
    woNumber: string;
    title: string;
    workType?: string;
    status: string;
    priority: string;
    department: string;
    location: string;
    createdAt: any;
    cost?: number;
    assignedToName?: string;
  };
}

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const statusColors: Record<string, string> = {
    raised: 'bg-gray-100 text-gray-800',
    assigned_to_supervisor: 'bg-blue-100 text-blue-800',
    assigned_to_technician: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    need_to_buy: 'bg-orange-100 text-orange-800',
    fixed: 'bg-lime-100 text-lime-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  const workTypeColors: Record<string, string> = {
    maintenance: 'bg-orange-500',
    it: 'bg-blue-500',
    graphic_design: 'bg-pink-500',
    marketing: 'bg-purple-500',
    purchasing: 'bg-green-500',
    hr: 'bg-red-500',
    accounts: 'bg-yellow-500',
    general: 'bg-gray-500',
  };

  return (
    <GradientCard gradient="from-blue-400 to-indigo-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {workOrder.workType && (
            <div className={`w-10 h-10 rounded-lg ${workTypeColors[workOrder.workType] || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-bold`}>
              {workOrder.workType.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900">{workOrder.woNumber}</h3>
            <p className="text-sm text-gray-500">{workOrder.title}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[workOrder.status] || 'bg-gray-100'}`}>
            {workOrder.status.replace(/_/g, ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[workOrder.priority]}`}>
            {workOrder.priority}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span className="text-gray-600">{workOrder.department}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span className="text-gray-600">{workOrder.location}</span>
        </div>
        {workOrder.assignedToName && (
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-gray-600">Assigned: {workOrder.assignedToName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Cost</p>
          <p className="text-lg font-bold text-emerald-600">MVR {workOrder.cost?.toFixed(2) || '0.00'}</p>
        </div>
        <Link 
          to={`/work-orders/${workOrder.id}`}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
        >
          View
        </Link>
      </div>
    </GradientCard>
  );
}

// User Card
interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    adminLevel?: string;
    permissions?: string[];
    avatar?: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  const roleColors: Record<string, string> = {
    super_admin: 'bg-gradient-to-r from-red-500 to-pink-500',
    dept_admin: 'bg-gradient-to-r from-orange-500 to-amber-500',
    supervisor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    technician: 'bg-gradient-to-r from-green-500 to-emerald-500',
    designer: 'bg-gradient-to-r from-pink-500 to-rose-500',
    marketing: 'bg-gradient-to-r from-purple-500 to-violet-500',
    user: 'bg-gradient-to-r from-gray-400 to-gray-500',
  };

  const levelLabels: Record<string, string> = {
    super_admin: 'Level 1 - Super Admin',
    dept_admin: 'Level 2 - Dept Admin',
    supervisor: 'Level 3 - Supervisor',
    technician: 'Level 3 - Staff',
    designer: 'Level 3 - Staff',
    marketing: 'Level 3 - Staff',
    user: 'Level 3 - User',
  };

  return (
    <GradientCard gradient="from-violet-400 to-purple-500">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-violet-600">
          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{user.name || user.email}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs text-white ${roleColors[user.role] || 'bg-gray-400'}`}>
            {user.role.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span className="text-gray-600">Dept: {user.department || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span className="text-gray-600">{levelLabels[user.role] || 'Level 3 - User'}</span>
        </div>
        {user.permissions && (
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-gray-600">{user.permissions.length} permissions</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Link 
          to={`/staff/${user.id}`}
          className="flex-1 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-center rounded-lg font-medium hover:shadow-lg transition-shadow"
        >
          Edit
        </Link>
        <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors">
          Delete
        </button>
      </div>
    </GradientCard>
  );
}

// Stat Card
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  gradient?: string;
}

export function StatCard({ title, value, icon, trend, gradient = 'from-blue-400 to-indigo-500' }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-xl">
          {icon}
        </div>
        {trend && (
          <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm opacity-80 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

// Action Button
interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  gradient?: string;
  icon?: ReactNode;
}

export function ActionButton({ children, onClick, gradient = 'from-blue-500 to-indigo-500', icon }: ActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${gradient} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
    >
      {icon}
      {children}
    </button>
  );
}
