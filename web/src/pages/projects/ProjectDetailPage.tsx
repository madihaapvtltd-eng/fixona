import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { 
  ArrowLeft, Edit, Trash2, Plus, CheckCircle, Clock, DollarSign, 
  Users, Building, Calendar, Package, FileText, Download,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
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
  purchaseRequests: PurchaseRequest[];
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
  id: string;
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

interface PurchaseRequest {
  id: string;
  itemName: string;
  quantity: number;
  estimatedCost: number;
  department: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'purchased';
  requestedAt: string;
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

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingWork, setEditingWork] = useState<number | null>(null);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    type: 'milestone',
    amount: 0,
    percentage: 0,
    description: '',
    paidTo: '',
    paidDate: new Date().toISOString().split('T')[0],
  });

  const [purchaseForm, setPurchaseForm] = useState({
    itemName: '',
    quantity: 1,
    estimatedCost: 0,
    department: '',
    urgency: 'normal',
  });

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const docRef = doc(db, 'projects', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() } as Project);
      } else {
        toast.error('Project not found');
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, 'projects', id!), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success('Status updated');
      fetchProject();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleRecordPayment = async () => {
    try {
      const newPayment = {
        id: `pay-${Date.now()}`,
        ...paymentForm,
        status: 'paid',
      };
      
      const updatedPayments = [...(project?.payments || []), newPayment];
      const totalPaid = updatedPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      
      await updateDoc(doc(db, 'projects', id!), {
        payments: updatedPayments,
        totalCost: totalPaid,
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      fetchProject();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleAddPurchaseRequest = async () => {
    try {
      const newRequest = {
        id: `req-${Date.now()}`,
        ...purchaseForm,
        requestedBy: user?.name || user?.email,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      
      await updateDoc(doc(db, 'projects', id!), {
        purchaseRequests: [...(project?.purchaseRequests || []), newRequest],
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Purchase request added');
      setShowPurchaseModal(false);
      fetchProject();
    } catch (error) {
      toast.error('Failed to add purchase request');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await updateDoc(doc(db, 'projects', id!), {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
      toast.success('Project deleted');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const getTotalPaid = () => {
    return project?.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
  };

  const getTotalBudget = () => {
    return project?.budget || 0;
  };

  const getPaymentProgress = () => {
    const total = getTotalBudget();
    const paid = getTotalPaid();
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  };

  const getWorkProgress = () => {
    const works = project?.departmentBreakdown || [];
    if (works.length === 0) return 0;
    const completed = works.filter(w => w.status === 'completed').length;
    return Math.round((completed / works.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
        <Link to="/projects" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
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
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/projects/${id}/edit`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          {user?.role === 'super_admin' && (
            <button
              onClick={handleDeleteProject}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Work Progress</h3>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{getWorkProgress()}%</span>
            <span className="text-sm text-gray-500 mb-1">complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${getWorkProgress()}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Payment Progress</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{getPaymentProgress()}%</span>
            <span className="text-sm text-gray-500 mb-1">paid</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${getPaymentProgress()}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            MVR {getTotalPaid().toLocaleString()} / MVR {getTotalBudget().toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Project Timeline</h3>
            <Calendar className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Start:</span>
              <span className="font-medium">{format(new Date(project.startDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">End:</span>
              <span className="font-medium">{format(new Date(project.endDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duration:</span>
              <span className="font-medium">
                {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'work-breakdown', 'contractors', 'payments', 'purchases'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{project.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Information</h3>
                <div className="space-y-2">
                  <p className="text-gray-600"><span className="font-medium">Name:</span> {project.clientName}</p>
                  <p className="text-gray-600"><span className="font-medium">Contact:</span> {project.clientContact || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Details</h3>
                <div className="space-y-2">
                  <p className="text-gray-600"><span className="font-medium">Budget:</span> MVR {project.budget?.toLocaleString() || 0}</p>
                  <p className="text-gray-600"><span className="font-medium">Total Cost:</span> MVR {project.totalCost?.toLocaleString() || 0}</p>
                  <p className="text-gray-600"><span className="font-medium">Created by:</span> {project.createdByName}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{project.departmentBreakdown?.length || 0}</p>
                <p className="text-sm text-gray-500">Departments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{project.thirdPartyContracts?.length || 0}</p>
                <p className="text-sm text-gray-500">Contractors</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{project.payments?.length || 0}</p>
                <p className="text-sm text-gray-500">Payments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{project.purchaseRequests?.length || 0}</p>
                <p className="text-sm text-gray-500">Purchase Requests</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'work-breakdown' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Work Breakdown by Department</h3>
            </div>

            {project.departmentBreakdown?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No work breakdown defined</p>
            ) : (
              <div className="space-y-3">
                {project.departmentBreakdown.map((work, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{work.department}</h4>
                          {work.isThirdParty && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              3rd Party
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            work.status === 'completed' ? 'bg-green-100 text-green-700' :
                            work.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {work.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{work.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Est. Cost: MVR {work.estimatedCost?.toLocaleString() || 0}</span>
                          <span>Actual: MVR {work.actualCost?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contractors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">3rd Party Contractors</h3>
            </div>

            {project.thirdPartyContracts?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No contractors assigned</p>
            ) : (
              <div className="grid gap-4">
                {project.thirdPartyContracts.map((contract, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{contract.contractorName}</h4>
                        <p className="text-sm text-gray-500">{contract.contactPerson}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contract.status === 'active' ? 'bg-green-100 text-green-700' :
                        contract.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium">{contract.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium">{contract.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Contract Value</p>
                        <p className="font-medium">MVR {contract.contractValue?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Period</p>
                        <p className="font-medium">{format(new Date(contract.startDate), 'MMM d')} - {format(new Date(contract.endDate), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-500">Scope of Work:</p>
                      <p className="text-sm text-gray-700">{contract.scopeOfWork}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
              >
                <Plus className="h-4 w-4 mr-1" />
                Record Payment
              </button>
            </div>

            {project.payments?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payments recorded</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay To</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {project.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3">
                          <span className="capitalize">{payment.type}</span>
                        </td>
                        <td className="px-4 py-3">{payment.description}</td>
                        <td className="px-4 py-3">{payment.paidTo}</td>
                        <td className="px-4 py-3 font-medium">MVR {payment.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3">{payment.paidDate ? format(new Date(payment.paidDate), 'MMM d, yyyy') : '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payment Summary */}
            {project.payments && project.payments.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Budget</p>
                    <p className="text-lg font-semibold">MVR {getTotalBudget().toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Paid</p>
                    <p className="text-lg font-semibold text-green-600">MVR {getTotalPaid().toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="text-lg font-semibold text-orange-600">MVR {(getTotalBudget() - getTotalPaid()).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="text-lg font-semibold">{getPaymentProgress()}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Requests</h3>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Request
              </button>
            </div>

            {project.purchaseRequests?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No purchase requests</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {project.purchaseRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-4 py-3">{request.itemName}</td>
                        <td className="px-4 py-3">{request.department}</td>
                        <td className="px-4 py-3">{request.quantity}</td>
                        <td className="px-4 py-3">MVR {request.estimatedCost?.toLocaleString()}</td>
                        <td className="px-4 py-3">{request.requestedBy}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'purchased' ? 'bg-green-100 text-green-700' :
                            request.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="advance">Advance</option>
                  <option value="milestone">Milestone</option>
                  <option value="partial">Partial</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (MVR)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pay To</label>
                <input
                  type="text"
                  value={paymentForm.paidTo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Contractor or Department name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 30% advance payment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paidDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Request Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Purchase Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={purchaseForm.itemName}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="What needs to be purchased?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={purchaseForm.department}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Department</option>
                  {project?.departmentBreakdown?.map((dept, i) => (
                    <option key={i} value={dept.department}>{dept.department}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost (MVR)</label>
                  <input
                    type="number"
                    value={purchaseForm.estimatedCost}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, estimatedCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select
                  value={purchaseForm.urgency}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, urgency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPurchaseRequest}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
