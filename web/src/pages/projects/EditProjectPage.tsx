import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Plus, Trash2, DollarSign, Users, Building, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface DepartmentWork {
  department: string;
  description: string;
  estimatedCost: number;
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
}

interface Payment {
  type: 'advance' | 'milestone' | 'partial' | 'final';
  amount: number;
  percentage: number;
  description: string;
  paidTo: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'material' | 'labor' | 'equipment' | 'contractor' | 'other';
  department: string;
  date: string;
  paidTo: string;
  notes?: string;
}

interface FinancialSummary {
  estimatedTotal: number;
  actualTotal: number;
  budget: number;
  variance: number;
  departmentBreakdown: { department: string; estimated: number; actual: number }[];
  partyBreakdown: { party: string; amount: number; type: 'internal' | 'contractor' }[];
}

const departments = [
  'Electrical',
  'Mechanical',
  'Plumbing',
  'Civil',
  'HVAC',
  'IT',
  'Security',
  'Cleaning',
  'Landscaping',
  'Other'
];

export function EditProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    clientContact: '',
    startDate: '',
    endDate: '',
    budget: '',
    priority: 'medium',
    status: 'planning',
  });

  const [departmentWorks, setDepartmentWorks] = useState<DepartmentWork[]>([
    { department: '', description: '', estimatedCost: 0, isThirdParty: false }
  ]);

  const [contracts, setContracts] = useState<ThirdPartyContract[]>([]);
  const [showContractors, setShowContractors] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Calculate financial summary
  const calculateFinancialSummary = (): FinancialSummary => {
    const estimatedDeptTotal = departmentWorks
      .filter(w => w.department)
      .reduce((sum, w) => sum + (w.estimatedCost || 0), 0);
    
    const contractTotal = contracts
      .filter(c => c.contractorName)
      .reduce((sum, c) => sum + (c.contractValue || 0), 0);
    
    const estimatedTotal = estimatedDeptTotal + contractTotal;
    const actualTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const budget = Number(formData.budget) || 0;
    
    // Department breakdown
    const deptMap = new Map<string, { estimated: number; actual: number }>();
    departments.forEach(d => deptMap.set(d, { estimated: 0, actual: 0 }));
    
    departmentWorks.forEach(w => {
      if (w.department) {
        const current = deptMap.get(w.department) || { estimated: 0, actual: 0 };
        deptMap.set(w.department, { ...current, estimated: current.estimated + (w.estimatedCost || 0) });
      }
    });
    
    expenses.forEach(e => {
      if (e.department) {
        const current = deptMap.get(e.department) || { estimated: 0, actual: 0 };
        deptMap.set(e.department, { ...current, actual: current.actual + (e.amount || 0) });
      }
    });
    
    const departmentBreakdown = Array.from(deptMap.entries())
      .filter(([_, v]) => v.estimated > 0 || v.actual > 0)
      .map(([dept, costs]) => ({ department: dept, ...costs }));
    
    // Party breakdown
    const partyMap = new Map<string, { amount: number; type: 'internal' | 'contractor' }>();
    
    contracts.forEach(c => {
      if (c.contractorName) {
        const current = partyMap.get(c.contractorName)?.amount || 0;
        partyMap.set(c.contractorName, { amount: current + (c.contractValue || 0), type: 'contractor' });
      }
    });
    
    expenses.forEach(e => {
      if (e.paidTo) {
        const current = partyMap.get(e.paidTo)?.amount || 0;
        const type = contracts.some(c => c.contractorName === e.paidTo) ? 'contractor' : 'internal';
        partyMap.set(e.paidTo, { amount: current + (e.amount || 0), type });
      }
    });
    
    const partyBreakdown = Array.from(partyMap.entries())
      .map(([party, data]) => ({ party, ...data }));
    
    return {
      estimatedTotal,
      actualTotal,
      budget,
      variance: budget - actualTotal,
      departmentBreakdown,
      partyBreakdown
    };
  };

  const addExpense = () => {
    setExpenses([...expenses, { 
      id: `exp-${Date.now()}`,
      description: '', 
      amount: 0, 
      category: 'other',
      department: '',
      date: new Date().toISOString().split('T')[0],
      paidTo: ''
    }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: string, value: any) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

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
        const data = docSnap.data();
        setFormData({
          name: data.name || '',
          description: data.description || '',
          clientName: data.clientName || '',
          clientContact: data.clientContact || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          budget: String(data.budget || ''),
          priority: data.priority || 'medium',
          status: data.status || 'planning',
        });
        setDepartmentWorks(data.departmentBreakdown?.length ? data.departmentBreakdown : [{ department: '', description: '', estimatedCost: 0, isThirdParty: false }]);
        setContracts(data.thirdPartyContracts || []);
        setPayments(data.payments?.map((p: any) => ({
          type: p.type || 'milestone',
          amount: p.amount || 0,
          percentage: p.percentage || 0,
          description: p.description || '',
          paidTo: p.paidTo || ''
        })) || []);
        setExpenses(data.expenses?.map((e: any) => ({
          id: e.id || `exp-${Date.now()}-${Math.random()}`,
          description: e.description || '',
          amount: e.amount || 0,
          category: e.category || 'other',
          department: e.department || '',
          date: e.date || new Date().toISOString().split('T')[0],
          paidTo: e.paidTo || '',
          notes: e.notes || ''
        })) || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const financialSummary = calculateFinancialSummary();
      
      const projectData = {
        ...formData,
        budget: Number(formData.budget),
        departmentBreakdown: departmentWorks.filter(w => w.department),
        thirdPartyContracts: contracts.filter(c => c.contractorName),
        payments: payments.filter(p => p.amount > 0),
        expenses: expenses.filter(e => e.description && e.amount > 0),
        financialSummary: {
          ...financialSummary,
          updatedAt: serverTimestamp()
        },
        estimatedTotalCost: financialSummary.estimatedTotal,
        actualTotalCost: financialSummary.actualTotal,
        totalCost: financialSummary.actualTotal,
        updatedAt: serverTimestamp(),
        updatedBy: user?.id || 'unknown',
        updatedByName: user?.name || user?.email || 'Unknown User',
      };

      await updateDoc(doc(db, 'projects', id!), projectData);
      toast.success('Project updated successfully');
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const addDepartmentWork = () => {
    setDepartmentWorks([...departmentWorks, { department: '', description: '', estimatedCost: 0, isThirdParty: false }]);
  };

  const removeDepartmentWork = (index: number) => {
    setDepartmentWorks(departmentWorks.filter((_, i) => i !== index));
  };

  const updateDepartmentWork = (index: number, field: string, value: any) => {
    const updated = [...departmentWorks];
    updated[index] = { ...updated[index], [field]: value };
    setDepartmentWorks(updated);
  };

  const addContract = () => {
    setContracts([...contracts, { contractorName: '', contactPerson: '', phone: '', email: '', scopeOfWork: '', contractValue: 0, startDate: '', endDate: '' }]);
  };

  const removeContract = (index: number) => {
    setContracts(contracts.filter((_, i) => i !== index));
  };

  const updateContract = (index: number, field: string, value: any) => {
    const updated = [...contracts];
    updated[index] = { ...updated[index], [field]: value };
    setContracts(updated);
  };

  const addPayment = () => {
    setPayments([...payments, { type: 'milestone', amount: 0, percentage: 0, description: '', paidTo: '' }]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, field: string, value: any) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-500">Update project details and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2 text-primary-600" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter project name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe the project scope and objectives"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Client or company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Contact</label>
              <input
                type="text"
                value={formData.clientContact}
                onChange={(e) => setFormData({ ...formData, clientContact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Phone or email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (MVR)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Work Breakdown by Department */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary-600" />
              Work Breakdown by Department
            </h2>
            <button
              type="button"
              onClick={addDepartmentWork}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Department
            </button>
          </div>

          <div className="space-y-4">
            {departmentWorks.map((work, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={work.department}
                      onChange={(e) => updateDepartmentWork(index, 'department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Description</label>
                    <input
                      type="text"
                      value={work.description}
                      onChange={(e) => updateDepartmentWork(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe the work for this department"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost (MVR)</label>
                      <input
                        type="number"
                        value={work.estimatedCost}
                        onChange={(e) => updateDepartmentWork(index, 'estimatedCost', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                    {departmentWorks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDepartmentWork(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={work.isThirdParty}
                      onChange={(e) => updateDepartmentWork(index, 'isThirdParty', e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">This work is done by 3rd party contractor</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3rd Party Contractors */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary-600" />
              3rd Party Contractors
            </h2>
            <button
              type="button"
              onClick={() => setShowContractors(!showContractors)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {showContractors ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {contracts.length > 0 ? `Edit (${contracts.length})` : 'Add Contractors'}
                </>
              )}
            </button>
          </div>

          {showContractors && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={addContract}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Contractor
              </button>
              
              {contracts.map((contract, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Name</label>
                      <input
                        type="text"
                        value={contract.contractorName}
                        onChange={(e) => updateContract(index, 'contractorName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={contract.contactPerson}
                        onChange={(e) => updateContract(index, 'contactPerson', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={contract.phone}
                        onChange={(e) => updateContract(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={contract.email}
                        onChange={(e) => updateContract(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Email address"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scope of Work</label>
                      <textarea
                        rows={2}
                        value={contract.scopeOfWork}
                        onChange={(e) => updateContract(index, 'scopeOfWork', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Detailed description of work"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value (MVR)</label>
                      <input
                        type="number"
                        value={contract.contractValue}
                        onChange={(e) => updateContract(index, 'contractValue', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={contract.startDate}
                          onChange={(e) => updateContract(index, 'startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={contract.endDate}
                          onChange={(e) => updateContract(index, 'endDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      {contracts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeContract(index)}
                          className="self-end p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!showContractors && contracts.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              No contractors added yet.
            </p>
          )}
        </div>

        {/* Payment Schedule */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
              Payment Schedule
            </h2>
            <button
              type="button"
              onClick={addPayment}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Payment
            </button>
          </div>

          <div className="space-y-4">
            {payments.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No payment schedule added.</p>
            ) : (
              payments.map((payment, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={payment.type}
                        onChange={(e) => updatePayment(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                        value={payment.amount}
                        onChange={(e) => updatePayment(index, 'amount', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                      <input
                        type="number"
                        value={payment.percentage}
                        onChange={(e) => updatePayment(index, 'percentage', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pay To</label>
                      <input
                        type="text"
                        value={payment.paidTo}
                        onChange={(e) => updatePayment(index, 'paidTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Contractor/Dept"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={payment.description}
                          onChange={(e) => updatePayment(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g., 30% advance"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePayment(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
            Financial Summary
          </h2>
          
          {(() => {
            const summary = calculateFinancialSummary();
            return (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="text-xl font-bold text-blue-600">MVR {summary.budget.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Estimated Total</p>
                    <p className="text-xl font-bold text-amber-600">MVR {summary.estimatedTotal.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Actual Expenses</p>
                    <p className="text-xl font-bold text-green-600">MVR {summary.actualTotal.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${summary.variance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-sm text-gray-600">Variance</p>
                    <p className={`text-xl font-bold ${summary.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      MVR {summary.variance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Department Breakdown */}
                {summary.departmentBreakdown.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Department Breakdown</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Department</th>
                            <th className="px-4 py-2 text-right">Estimated</th>
                            <th className="px-4 py-2 text-right">Actual</th>
                            <th className="px-4 py-2 text-right">Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.departmentBreakdown.map((dept) => (
                            <tr key={dept.department} className="border-t">
                              <td className="px-4 py-2">{dept.department}</td>
                              <td className="px-4 py-2 text-right">MVR {dept.estimated.toLocaleString()}</td>
                              <td className="px-4 py-2 text-right">MVR {dept.actual.toLocaleString()}</td>
                              <td className={`px-4 py-2 text-right ${dept.estimated - dept.actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                MVR {(dept.estimated - dept.actual).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Party Breakdown */}
                {summary.partyBreakdown.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Party/Contractor Breakdown</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Party</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.partyBreakdown.map((party) => (
                            <tr key={party.party} className="border-t">
                              <td className="px-4 py-2">{party.party}</td>
                              <td className="px-4 py-2">
                                <span className={`badge ${party.type === 'contractor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {party.type}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right font-medium">MVR {party.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Expenses Tracking */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
              Expenses & Investments
            </h2>
            <button
              type="button"
              onClick={addExpense}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </button>
          </div>

          <div className="space-y-4">
            {expenses.length === 0 && (
              <p className="text-gray-500 text-sm italic">No expenses recorded yet. Click "Add Expense" to track project costs.</p>
            )}
            {expenses.map((expense, index) => (
              <div key={expense.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={expense.description}
                      onChange={(e) => updateExpense(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="What was purchased?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (MVR)</label>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => updateExpense(index, 'amount', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={expense.category}
                      onChange={(e) => updateExpense(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="material">Material</option>
                      <option value="labor">Labor</option>
                      <option value="equipment">Equipment</option>
                      <option value="contractor">Contractor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={expense.department}
                      onChange={(e) => updateExpense(index, 'department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Dept</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={expense.date}
                        onChange={(e) => updateExpense(index, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExpense(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid To</label>
                    <input
                      type="text"
                      value={expense.paidTo}
                      onChange={(e) => updateExpense(index, 'paidTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Person or company paid"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      value={expense.notes || ''}
                      onChange={(e) => updateExpense(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Additional details"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(`/projects/${id}`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
