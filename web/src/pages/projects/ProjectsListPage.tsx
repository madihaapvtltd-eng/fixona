import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { Plus, Search, Filter, MoreVertical, Trash2, Edit, Eye, Briefcase, Calendar, DollarSign, Users, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description: string;
  clientName: string;
  clientContact: string;
  startDate: string;
  endDate: string;
  budget: number;
  totalCost: number;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  departmentBreakdown: DepartmentWork[];
  thirdPartyContracts: ThirdPartyContract[];
  payments: Payment[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  createdByName: string;
}

interface DepartmentWork {
  department: string;
  description: string;
  estimatedCost: number;
  actualCost: number;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  isThirdParty: boolean;
}

interface ThirdPartyContract {
  contractorName: string;
  contactPerson: string;
  phone: string;
  email: string;
  scopeOfWork: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'terminated';
}

interface Payment {
  id: string;
  type: 'advance' | 'milestone' | 'partial' | 'final';
  amount: number;
  percentage: number;
  paidDate: string;
  description: string;
  paidTo: string;
  status: 'pending' | 'paid';
}

const statusColors = {
  planning: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
};

export function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      console.log('[PROJECTS DEBUG] user:', user?.email, 'companyId:', user?.companyId, 'role:', user?.role);
      const projectsRef = collection(db, 'projects');
      // CRITICAL: Filter by companyId for data isolation
      let q;
      if (user?.companyId) {
        console.log('[PROJECTS DEBUG] Filtering by companyId:', user.companyId);
        q = query(
          projectsRef, 
          where('companyId', '==', user.companyId),
          orderBy('createdAt', 'desc')
        );
      } else if (user?.role === 'super_admin') {
        // Super admin can see all projects
        console.log('[PROJECTS DEBUG] Superadmin mode - loading all projects');
        q = query(projectsRef, orderBy('createdAt', 'desc'));
      } else {
        // No company assigned - show empty
        console.log('[PROJECTS DEBUG] NO companyId - showing empty');
        setProjects([]);
        setLoading(false);
        return;
      }
      const snapshot = await getDocs(q);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTotalPaid = (payments: Payment[]) => {
    return payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
  };

  const getPaymentProgress = (payments: Payment[]) => {
    const total = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const paid = getTotalPaid(payments);
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Banner with Storyset Illustration */}
      <div className="card bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img 
            src="/storyset-illustrations/Bricklayer-amico.svg" 
            alt="Projects" 
            className="w-24 h-24 object-contain"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 mt-1">Manage projects, contractors, and payments</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/projects/create"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <img 
            src="/storyset-illustrations/Under construction-amico.svg" 
            alt="No projects" 
            className="w-32 h-32 mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first project'}
          </p>
          {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
            <Link
              to="/projects/create"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Project Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">{project.projectNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[project.priority]}`}>
                          {project.priority}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{project.clientName}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mt-3 line-clamp-2">{project.description}</p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(project.startDate), 'MMM d, yyyy')} - {format(new Date(project.endDate), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Budget: MVR {project.budget?.toLocaleString() || 0}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {project.departmentBreakdown?.length || 0} Departments
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {project.thirdPartyContracts?.length || 0} Contractors
                    </div>
                  </div>

                  {/* Payment Progress */}
                  {project.payments && project.payments.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Payment Progress</span>
                        <span className="font-medium text-gray-900">
                          MVR {getTotalPaid(project.payments).toLocaleString()} / MVR {project.payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${getPaymentProgress(project.payments)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                  <Link
                    to={`/projects/${project.id}/edit`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                  {user?.role === 'super_admin' && (
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
