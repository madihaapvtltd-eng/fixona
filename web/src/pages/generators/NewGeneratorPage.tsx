import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGenerator } from '@/hooks/useGenerators';
import { useAuthStore } from '@/stores/authStore';
import { useCompany } from '@/hooks/useCompany';
import type { GeneratorAsset } from '@/types/generator';
import { 
  Zap, ArrowLeft, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GeneratorFormData {
  name: string;
  assetCode: string;
  location: string;
  description: string;
  
  // Power specs
  powerRatingKva: string;
  voltage: string;
  frequency: string;
  
  // Fuel
  fuelTankCapacityLiters: string;
  currentFuelLevel: string;
  fuelConsumptionRate: string;
  
  // Runtime/Maintenance
  totalRuntimeHours: string;
  serviceIntervalHours: string;
  
  // Installation
  installationType: 'permanent' | 'mobile';
  
  // Status
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const initialFormData: GeneratorFormData = {
  name: '',
  assetCode: '',
  location: '',
  description: '',
  powerRatingKva: '',
  voltage: '400',
  frequency: '50',
  fuelTankCapacityLiters: '',
  currentFuelLevel: '100',
  fuelConsumptionRate: '',
  totalRuntimeHours: '0',
  serviceIntervalHours: '250',
  installationType: 'permanent',
  condition: 'good',
  riskLevel: 'medium',
};

export function NewGeneratorPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuthStore();
  const { companyId, companyName } = useCompany();
  const createMutation = useCreateGenerator();
  const [formData, setFormData] = useState<GeneratorFormData>(initialFormData);

  const canCreateGenerator = user?.role === 'super_admin' || user?.role === 'company_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateGenerator) {
      toast.error('Only administrators can create generators');
      return;
    }

    if (!companyId && !isSuperAdmin()) {
      toast.error('Please select a company first');
      return;
    }

    const generatorData: Omit<GeneratorAsset, 'id' | 'createdAt'> = {
      name: formData.name,
      assetCode: formData.assetCode,
      category: 'generator',
      status: 'standby',
      condition: formData.condition,
      riskLevel: formData.riskLevel,
      companyId: companyId || undefined,
      companyName: companyName || undefined,
      description: formData.description,
      location: formData.location,
      
      // Power specs
      powerRatingKva: parseFloat(formData.powerRatingKva) || 0,
      voltage: parseInt(formData.voltage) || 400,
      frequency: parseInt(formData.frequency) || 50,
      
      // Fuel
      fuelTankCapacityLiters: parseFloat(formData.fuelTankCapacityLiters) || 0,
      currentFuelLevel: parseFloat(formData.currentFuelLevel) || 100,
      fuelConsumptionRate: parseFloat(formData.fuelConsumptionRate) || 0,
      
      // Runtime
      totalRuntimeHours: parseFloat(formData.totalRuntimeHours) || 0,
      currentSessionHours: 0,
      serviceIntervalHours: parseInt(formData.serviceIntervalHours) || 250,
      nextServiceHours: (parseFloat(formData.totalRuntimeHours) || 0) + (parseInt(formData.serviceIntervalHours) || 250),
      
      // Status
      isRunning: false,
      loadPercentage: 0,
      atsStatus: 'mains',
      
      // Installation
      installationType: formData.installationType,
      backupFor: [],
    };

    await createMutation.mutateAsync(generatorData);
    navigate('/generators');
  };

  if (!canCreateGenerator) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only administrators can create generators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/generators')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Add New Generator
          </h1>
          <p className="text-gray-500">Register a new power generator in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Generator Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Main Backup Generator"
                required
              />
            </div>
            <div>
              <label className="label">Asset Code *</label>
              <input
                type="text"
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                className="input"
                placeholder="e.g., GEN-001"
                required
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                placeholder="e.g., Generator Room A"
              />
            </div>
            <div>
              <label className="label">Installation Type</label>
              <select
                value={formData.installationType}
                onChange={(e) => setFormData({ ...formData, installationType: e.target.value as any })}
                className="input"
              >
                <option value="permanent">Permanent Installation</option>
                <option value="mobile">Mobile/Portable</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Additional details about this generator..."
            />
          </div>
        </div>

        {/* Power Specifications */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Power Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Power Rating (kVA) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.powerRatingKva}
                onChange={(e) => setFormData({ ...formData, powerRatingKva: e.target.value })}
                className="input"
                placeholder="e.g., 500"
                required
              />
            </div>
            <div>
              <label className="label">Voltage (V)</label>
              <input
                type="number"
                value={formData.voltage}
                onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                className="input"
                placeholder="e.g., 400"
              />
            </div>
            <div>
              <label className="label">Frequency (Hz)</label>
              <input
                type="number"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="input"
                placeholder="e.g., 50"
              />
            </div>
          </div>
        </div>

        {/* Fuel Specifications */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fuel Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Tank Capacity (Liters) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.fuelTankCapacityLiters}
                onChange={(e) => setFormData({ ...formData, fuelTankCapacityLiters: e.target.value })}
                className="input"
                placeholder="e.g., 1000"
                required
              />
            </div>
            <div>
              <label className="label">Current Fuel Level (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.currentFuelLevel}
                onChange={(e) => setFormData({ ...formData, currentFuelLevel: e.target.value })}
                className="input"
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="label">Consumption Rate (L/hr)</label>
              <input
                type="number"
                step="0.1"
                value={formData.fuelConsumptionRate}
                onChange={(e) => setFormData({ ...formData, fuelConsumptionRate: e.target.value })}
                className="input"
                placeholder="e.g., 50"
              />
            </div>
          </div>
        </div>

        {/* Runtime & Maintenance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Runtime & Maintenance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Current Total Runtime Hours</label>
              <input
                type="number"
                step="0.1"
                value={formData.totalRuntimeHours}
                onChange={(e) => setFormData({ ...formData, totalRuntimeHours: e.target.value })}
                className="input"
                placeholder="e.g., 1500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter current hour meter reading</p>
            </div>
            <div>
              <label className="label">Service Interval (Hours)</label>
              <select
                value={formData.serviceIntervalHours}
                onChange={(e) => setFormData({ ...formData, serviceIntervalHours: e.target.value })}
                className="input"
              >
                <option value="250">250 Hours</option>
                <option value="500">500 Hours</option>
                <option value="1000">1000 Hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status & Condition */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Condition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                className="input"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Risk Level</label>
              <select
                value={formData.riskLevel}
                onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/generators')}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading || !formData.name || !formData.assetCode || !formData.powerRatingKva}
            className="btn btn-primary flex-1"
          >
            {createMutation.isLoading ? 'Creating...' : 'Create Generator'}
          </button>
        </div>
      </form>
    </div>
  );
}
