import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useGeneratorMaintenanceRecords, useAddMaintenanceRecord } from '@/hooks/useGenerators';
import { Modal } from '@/components/ui/Modal';
import type { GeneratorAsset, GeneratorMaintenanceRecord } from '@/types/generator';
import { SERVICE_INTERVALS } from '@/types/generator';
import { 
  Wrench, ArrowLeft, Plus, Calendar, Clock, CheckCircle,
  AlertTriangle, FileText, User, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const serviceTypes = [
  { value: 'daily', label: 'Daily Check', hours: SERVICE_INTERVALS.DAILY, description: 'Visual inspection, fuel check, coolant level' },
  { value: 'weekly', label: 'Weekly Service', hours: SERVICE_INTERVALS.WEEKLY, description: 'Battery check, air filter inspection, run test (30 min)' },
  { value: 'monthly', label: 'Monthly Service', hours: SERVICE_INTERVALS.MONTHLY, description: 'Oil check, belt inspection, fuel filter drain' },
  { value: '250hr', label: '250-Hour Service', hours: SERVICE_INTERVALS.HOURS_250, description: 'Oil change, filter replacement' },
  { value: '500hr', label: '500-Hour Service', hours: SERVICE_INTERVALS.HOURS_500, description: 'Air filter, fuel filter, coolant change' },
  { value: 'custom', label: 'Custom Service', hours: 0, description: 'Custom maintenance task' },
];

interface MaintenanceFormData {
  type: string;
  serviceHours: number;
  workPerformed: string;
  partsReplaced: string;
  technician: string;
  cost: string;
  notes: string;
}

const initialFormData: MaintenanceFormData = {
  type: '250hr',
  serviceHours: 0,
  workPerformed: '',
  partsReplaced: '',
  technician: '',
  cost: '',
  notes: '',
};

export function GeneratorMaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<MaintenanceFormData>(initialFormData);

  // Fetch generator
  const { data: generator, isLoading: genLoading } = useQuery(
    ['generator', id],
    async () => {
      if (!id) return null;
      const snap = await getDoc(doc(db, 'generators', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as GeneratorAsset;
    },
    { enabled: !!id }
  );

  // Fetch maintenance records
  const { data: records, isLoading: recordsLoading } = useGeneratorMaintenanceRecords(id);
  const addRecordMutation = useAddMaintenanceRecord();

  const canAddMaintenance = user?.role === 'super_admin' || user?.role === 'company_admin' || user?.role === 'technician';

  const hoursUntilService = generator ? generator.nextServiceHours - generator.totalRuntimeHours : 0;
  const isServiceDue = hoursUntilService <= 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generator || !id) return;

    const selectedType = serviceTypes.find(t => t.value === formData.type);
    const nextServiceHours = generator.totalRuntimeHours + (selectedType?.hours || 250);

    await addRecordMutation.mutateAsync({
      generatorId: id,
      generatorName: generator.name,
      type: formData.type as any,
      serviceHours: formData.serviceHours,
      workPerformed: formData.workPerformed,
      partsReplaced: formData.partsReplaced ? formData.partsReplaced.split(',').map(p => p.trim()) : [],
      technician: formData.technician,
      cost: parseFloat(formData.cost) || 0,
      nextServiceHours,
      notes: formData.notes,
    });

    setIsModalOpen(false);
    setFormData(initialFormData);
  };

  if (genLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!generator) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Generator not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/generators/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Maintenance History</h1>
          <p className="text-gray-500">{generator.name} • {generator.assetCode}</p>
        </div>
        {canAddMaintenance && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Log Service
          </button>
        )}
      </div>

      {/* Service Status */}
      <div className={`card ${isServiceDue ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${isServiceDue ? 'bg-yellow-100' : 'bg-green-100'}`}>
            {isServiceDue ? (
              <AlertTriangle className={isServiceDue ? 'text-yellow-600' : 'text-green-600'} size={24} />
            ) : (
              <CheckCircle className="text-green-600" size={24} />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${isServiceDue ? 'text-yellow-800' : 'text-green-800'}`}>
              {isServiceDue ? 'Service Due Soon' : 'Generator in Good Standing'}
            </h3>
            <p className={`text-sm ${isServiceDue ? 'text-yellow-700' : 'text-green-700'}`}>
              Total Runtime: {generator.totalRuntimeHours.toFixed(0)} hrs • 
              Next Service: {generator.nextServiceHours.toFixed(0)} hrs • 
              {hoursUntilService > 0 
                ? `${hoursUntilService.toFixed(0)} hours until next service`
                : 'Service overdue'}
            </p>
          </div>
        </div>
      </div>

      {/* Service Schedule Reference */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Service Schedule Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceTypes.filter(t => t.value !== 'custom').map(type => (
            <div key={type.value} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{type.label}</div>
              <div className="text-sm text-gray-500 mt-1">{type.description}</div>
              <div className="text-sm text-primary-600 mt-2 font-medium">
                Every {type.hours} hours
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Records */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Service History</h3>
        {recordsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records?.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No maintenance records yet</p>
            {canAddMaintenance && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-primary-600 hover:underline mt-2"
              >
                Log your first service
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hours</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Work Performed</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Technician</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Next Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records?.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {record.createdAt ? format(new Date(record.createdAt.toDate()), 'MMM d, yyyy') : 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        record.type === 'daily' ? 'bg-gray-100 text-gray-700' :
                        record.type === 'weekly' ? 'bg-blue-100 text-blue-700' :
                        record.type === 'monthly' ? 'bg-purple-100 text-purple-700' :
                        record.type === '250hr' ? 'bg-yellow-100 text-yellow-700' :
                        record.type === '500hr' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {serviceTypes.find(t => t.value === record.type)?.label || record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {record.serviceHours.toFixed(0)} hrs
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {record.workPerformed}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.technician}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {record.nextServiceHours.toFixed(0)} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Maintenance Service"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Service Type *</label>
            <select
              value={formData.type}
              onChange={(e) => {
                const type = serviceTypes.find(t => t.value === e.target.value);
                setFormData({ 
                  ...formData, 
                  type: e.target.value,
                  serviceHours: generator?.totalRuntimeHours || 0,
                });
              }}
              className="input"
              required
            >
              {serviceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Current Runtime Hours *</label>
              <input
                type="number"
                step="0.1"
                value={formData.serviceHours || generator?.totalRuntimeHours || 0}
                onChange={(e) => setFormData({ ...formData, serviceHours: parseFloat(e.target.value) || 0 })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Service Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="label">Work Performed *</label>
            <textarea
              value={formData.workPerformed}
              onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Describe the maintenance work performed..."
              required
            />
          </div>

          <div>
            <label className="label">Parts Replaced (comma separated)</label>
            <input
              type="text"
              value={formData.partsReplaced}
              onChange={(e) => setFormData({ ...formData, partsReplaced: e.target.value })}
              className="input"
              placeholder="Oil filter, air filter, spark plugs..."
            />
          </div>

          <div>
            <label className="label">Technician Name *</label>
            <input
              type="text"
              value={formData.technician}
              onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
              className="input"
              placeholder="Name of technician who performed service"
              required
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[60px]"
              placeholder="Additional notes or observations..."
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Next Service:</strong> {generator.totalRuntimeHours + (serviceTypes.find(t => t.value === formData.type)?.hours || 250)} hours
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addRecordMutation.isLoading || !formData.workPerformed || !formData.technician}
              className="btn btn-primary flex-1"
            >
              {addRecordMutation.isLoading ? 'Saving...' : 'Log Service'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
