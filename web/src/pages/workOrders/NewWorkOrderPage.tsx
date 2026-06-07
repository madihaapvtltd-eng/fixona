import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { ALL_LOCATIONS } from '@/lib/locations';
import { SearchableLocationDropdown } from '@/components/ui/SearchableLocationDropdown';
import toast from 'react-hot-toast';
import { ArrowLeft, Wrench, Calendar, User, FileText, Building2 } from 'lucide-react';

export function NewWorkOrderPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetId: '',
    assetName: '',
    location: '',
    priority: 'medium',
    status: 'open',
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
    workType: 'preventive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'work_orders'), {
        ...formData,
        createdBy: user?.id,
        createdByName: user?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Work order created successfully!');
      navigate('/work-orders');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create work order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/work-orders" className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Work Order</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Work Order Title *</label>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="Enter work order title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Asset Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Enter asset name"
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <SearchableLocationDropdown
                label="Location"
                locations={ALL_LOCATIONS}
                value={formData.location}
                onChange={(value) => setFormData({ ...formData, location: value })}
                required
              />
            </div>

            <div>
              <label className="label">Work Type *</label>
              <select
                required
                className="input"
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
              >
                <option value="preventive">Preventive Maintenance</option>
                <option value="corrective">Corrective Maintenance</option>
                <option value="predictive">Predictive Maintenance</option>
                <option value="emergency">Emergency Repair</option>
                <option value="inspection">Inspection</option>
                <option value="upgrade">Upgrade/Modification</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Priority *</label>
              <select
                required
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="label">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  className="input pl-10"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Assigned To</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Enter technician name"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Estimated Hours</label>
              <input
                type="number"
                className="input"
                placeholder="Enter estimated hours"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Description *</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  rows={4}
                  required
                  className="input pl-10"
                  placeholder="Describe the work to be performed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Link to="/work-orders" className="btn btn-secondary flex-1">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
