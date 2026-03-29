import { useQuery } from 'react-query';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, isAfter, subDays } from 'date-fns';
import {
  Wrench,
  Package,
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  Briefcase,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}

function StatCard({ title, value, change, icon: Icon, color, href }: StatCardProps) {
  const content = (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-gray-500'}`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  priority: string;
  budget: number;
  totalCost: number;
  createdAt: any;
  startDate: string;
  endDate: string;
}

export function DashboardPage() {
  // Fetch all data
  const { data: stats } = useQuery('dashboardStats', async () => {
    const [workOrdersSnap, assetsSnap, inventorySnap, usersSnap, projectsSnap] = await Promise.all([
      getDocs(collection(db, 'work_orders')),
      getDocs(collection(db, 'assets')),
      getDocs(collection(db, 'inventory')),
      getDocs(query(collection(db, 'users'), where('isActive', '==', true))),
      getDocs(collection(db, 'projects')),
    ]);

    const workOrders = workOrdersSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data());
    const assets = assetsSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data());
    const inventory = inventorySnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data());
    const projects = projectsSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }));

    // Work Orders by Status - REAL DATA
    const statusCounts: Record<string, number> = {};
    workOrders.forEach((wo: DocumentData) => {
      const status = wo.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Priority counts
    const priorityCounts: Record<string, number> = {};
    workOrders.forEach((wo: DocumentData) => {
      const priority = wo.priority || 'unknown';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });

    // Active work orders
    const activeStatuses = ['open', 'raised', 'assigned_to_supervisor', 'assigned_to_technician', 'assigned_to_dept_admin', 'in_progress', 'need_to_buy', 'fixed', 'work_started_with_items'];
    const openWO = workOrders.filter((wo: DocumentData) => activeStatuses.includes(wo.status)).length;
    const completedWO = workOrders.filter((wo: DocumentData) => wo.status === 'completed' || wo.progress === 100).length;
    
    // Overdue work orders
    const overdueWO = workOrders.filter((wo: DocumentData) => {
      if (!wo.dueDate || wo.status === 'completed' || wo.status === 'cancelled') return false;
      const dueDate = wo.dueDate?.toDate?.() || new Date(wo.dueDate);
      return dueDate < new Date();
    }).length;

    // High risk assets
    const highRiskAssets = assets.filter((a: DocumentData) => a.riskLevel === 'high' || a.riskLevel === 'critical').length;
    const criticalRiskAssets = assets.filter((a: DocumentData) => a.riskLevel === 'critical').length;
    const assetsUnderMaintenance = assets.filter((a: DocumentData) => a.status === 'maintenance').length;

    // Inventory
    const lowStockItems = inventory.filter((i: DocumentData) => i.quantity <= i.minThreshold).length;
    const outOfStockItems = inventory.filter((i: DocumentData) => i.quantity === 0).length;
    const totalInventoryValue = inventory.reduce((sum: number, i: DocumentData) => sum + (i.quantity * i.unitCost || 0), 0);

    // Projects
    const activeProjects = projects.filter((p: any) => p.status === 'in_progress' || p.status === 'planning').length;
    const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
    const totalProjectBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);
    const totalProjectCost = projects.reduce((sum: number, p: any) => sum + (p.totalCost || 0), 0);

    // Work orders created this week
    const oneWeekAgo = subDays(new Date(), 7);
    const newThisWeek = workOrders.filter((wo: DocumentData) => {
      const createdAt = wo.createdAt?.toDate?.() || new Date(wo.createdAt);
      return isAfter(createdAt, oneWeekAgo);
    }).length;

    return {
      totalAssets: assets.length,
      totalWorkOrders: workOrders.length,
      assetsUnderMaintenance,
      highRiskAssets,
      criticalRiskAssets,
      openWorkOrders: openWO,
      completedWorkOrders: completedWO,
      overdueWorkOrders: overdueWO,
      lowStockItems,
      outOfStockItems,
      totalInventoryValue,
      totalStaff: usersSnap.docs.length,
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalProjectBudget,
      totalProjectCost,
      newWorkOrdersThisWeek: newThisWeek,
      workOrdersByStatus: statusCounts,
      workOrdersByPriority: priorityCounts,
      workOrdersList: workOrders,
      projectsList: projects,
      assetsList: assets,
    };
  });

  // Fetch recent work orders
  const { data: recentWorkOrders } = useQuery('recentWorkOrders', async () => {
    const q = query(
      collection(db, 'work_orders'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }));
  });

  // Chart data - REAL DATA from statusCounts
  const statusData = Object.entries(stats?.workOrdersByStatus || {})
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => (b.value as number) - (a.value as number));

  const priorityData = Object.entries(stats?.workOrdersByPriority || {})
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count: value as number }))
    .filter((d) => d.count > 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Storyset Illustration */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <img 
            src="/storyset-illustrations/Office management-amico.svg" 
            alt="Fixora Dashboard" 
            className="w-40 h-40 object-contain"
          />
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Fixora</h1>
            <p className="text-gray-600 mt-1">Built for Zero Downtime. Manage your maintenance efficiently.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - More Comprehensive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Work Orders"
          value={stats?.totalWorkOrders || 0}
          change={`${stats?.completedWorkOrders || 0} completed`}
          icon={ClipboardList}
          color="bg-purple-500"
          href="/work-orders"
        />
        <StatCard
          title="Open Work Orders"
          value={stats?.openWorkOrders || 0}
          change={`${stats?.overdueWorkOrders || 0} overdue`}
          icon={Wrench}
          color="bg-blue-500"
          href="/work-orders"
        />
        <StatCard
          title="New This Week"
          value={stats?.newWorkOrdersThisWeek || 0}
          icon={Calendar}
          color="bg-indigo-500"
          href="/work-orders"
        />
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          change={`${stats?.activeProjects || 0} active`}
          icon={Briefcase}
          color="bg-pink-500"
          href="/projects"
        />
        <StatCard
          title="Total Assets"
          value={stats?.totalAssets || 0}
          change={`${stats?.assetsUnderMaintenance || 0} under maintenance`}
          icon={Building2}
          color="bg-green-500"
          href="/assets"
        />
        <StatCard
          title="High Risk Assets"
          value={stats?.highRiskAssets || 0}
          change={`${stats?.criticalRiskAssets || 0} critical`}
          icon={AlertCircle}
          color="bg-red-500"
          href="/assets?risk=high"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems || 0}
          change={`${stats?.outOfStockItems || 0} out of stock`}
          icon={Package}
          color="bg-amber-500"
          href="/inventory"
        />
        <StatCard
          title="Total Staff"
          value={stats?.totalStaff || 0}
          icon={Users}
          color="bg-cyan-500"
          href="/staff"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Orders by Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Orders by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Work Orders by Priority */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Orders by Priority</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Work Orders</h3>
          <Link to="/work-orders" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WO #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentWorkOrders?.map((wo: DocumentData) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-primary-600">
                    <Link to={`/work-orders/${wo.id}`}>{wo.woNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{wo.title}</td>
                  <td className="px-4 py-3">
                    <span className={`badge status-${wo.status}`}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge priority-${wo.priority}`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {wo.createdAt?.toDate ? format(wo.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projects Section */}
      {stats?.projectsList && stats.projectsList.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.projectsList
              .filter((p: any) => p.status === 'in_progress' || p.status === 'planning')
              .slice(0, 6)
              .map((project: any) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{project.projectNumber}</p>
                      <p className="text-sm text-gray-600 mt-1">{project.name}</p>
                    </div>
                    <span className={`badge status-${project.status}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span>Budget: MVR {project.budget?.toLocaleString() || 0}</span>
                    <span>Priority: {project.priority}</span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* AI Risk Alerts */}
      <div className="card border-l-4 border-l-amber-500">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Risk Alerts</h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats?.highRiskAssets || 0} assets flagged with high risk. Review and schedule preventive maintenance.
            </p>
            <Link
              to="/assets?filter=risk"
              className="inline-flex items-center mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              View risk analysis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
