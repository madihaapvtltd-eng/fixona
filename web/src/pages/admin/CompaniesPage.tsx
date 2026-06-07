import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore, type Company } from '@/stores/authStore';
import { Building2, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, CheckCircle, XCircle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';

interface CompanyFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const initialFormData: CompanyFormData = {
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
  isActive: true,
};

export function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const { isSuperAdmin } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch companies
  const { data: companies, isLoading } = useQuery('companies', async () => {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Company[];
  }, {
    enabled: isSuperAdmin(),
  });

  // Create company mutation
  const createMutation = useMutation(
    async (data: CompanyFormData) => {
      const docRef = await addDoc(collection(db, 'companies'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        toast.success('Company created successfully');
        closeModal();
      },
      onError: () => toast.error('Failed to create company'),
    }
  );

  // Update company mutation
  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: Partial<CompanyFormData> }) => {
      await updateDoc(doc(db, 'companies', id), data);
      return true;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        toast.success('Company updated successfully');
        closeModal();
      },
      onError: () => toast.error('Failed to update company'),
    }
  );

  // Delete company mutation
  const deleteMutation = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, 'companies', id));
      return true;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        toast.success('Company deleted successfully');
      },
      onError: () => toast.error('Failed to delete company'),
    }
  );

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      isActive: company.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (company: Company) => {
    if (confirm(`Are you sure you want to delete "${company.name}"? This will also deactivate all users associated with this company.`)) {
      deleteMutation.mutate(company.id);
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only Super Administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 mt-1">Manage organizations in the system</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/users"
            className="btn btn-secondary flex items-center gap-2"
          >
            Manage Users
          </Link>
          <button
            onClick={openCreateModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Company
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search companies by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCompanies?.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No companies found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Create your first company to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies?.map((company) => (
            <div key={company.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {company.code}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(company)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(company)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {company.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} />
                    <span className="truncate">{company.address}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} />
                    <span>{company.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {company.isActive ? (
                    <>
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-sm text-green-600">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-red-500" />
                      <span className="text-sm text-red-600">Inactive</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  Created {company.createdAt ? format(company.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCompany ? 'Edit Company' : 'Add Company'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Company Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Acme Corporation"
              required
            />
          </div>

          <div>
            <label className="label">Company Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="input"
              placeholder="e.g., ACME"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Unique identifier for the company</p>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Company address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="Contact number"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="Company email"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active Company
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn btn-primary flex-1"
            >
              {createMutation.isLoading || updateMutation.isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                editingCompany ? 'Update Company' : 'Create Company'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

