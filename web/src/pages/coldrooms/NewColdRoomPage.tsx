import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateColdRoom } from '@/hooks/useColdRooms';
import { useAuthStore } from '@/stores/authStore';
import { useCompany } from '@/hooks/useCompany';
import type { ColdRoomAsset } from '@/types/coldroom';
import { DEFAULT_TEMP_RANGES } from '@/types/coldroom';
import { 
  Thermometer, ArrowLeft, Snowflake, AlertCircle
} from 'lucide-react';

interface ColdRoomFormData {
  name: string;
  assetCode: string;
  category: ColdRoomAsset['category'];
  type: ColdRoomAsset['type'];
  location: string;
  capacity: string;
  dimensions: string;
  
  // Temperature
  minTemp: string;
  maxTemp: string;
  targetTemp: string;
  criticalMin: string;
  criticalMax: string;
  
  // Status
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const initialFormData: ColdRoomFormData = {
  name: '',
  assetCode: '',
  category: 'cold_room',
  type: 'walk_in',
  location: '',
  capacity: '',
  dimensions: '',
  minTemp: '0',
  maxTemp: '5',
  targetTemp: '2',
  criticalMin: '-5',
  criticalMax: '10',
  condition: 'good',
  riskLevel: 'medium',
};

export function NewColdRoomPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuthStore();
  const { companyId } = useCompany();
  const createMutation = useCreateColdRoom();
  const [formData, setFormData] = useState<ColdRoomFormData>(initialFormData);

  const canCreate = user?.role === 'super_admin' || user?.role === 'company_admin';

  // Update temps when category changes
  const handleCategoryChange = (category: ColdRoomAsset['category']) => {
    const defaults = DEFAULT_TEMP_RANGES[category];
    setFormData({
      ...formData,
      category,
      minTemp: defaults.min.toString(),
      maxTemp: defaults.max.toString(),
      targetTemp: defaults.target.toString(),
      criticalMin: (defaults.min - 5).toString(),
      criticalMax: (defaults.max + 5).toString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreate) {
      return;
    }

    await createMutation.mutateAsync({
      name: formData.name,
      assetCode: formData.assetCode,
      category: formData.category,
      type: formData.type,
      location: formData.location,
      capacity: formData.capacity,
      dimensions: formData.dimensions,
      minTemp: parseFloat(formData.minTemp),
      maxTemp: parseFloat(formData.maxTemp),
      targetTemp: parseFloat(formData.targetTemp),
      criticalMin: parseFloat(formData.criticalMin),
      criticalMax: parseFloat(formData.criticalMax),
      condition: formData.condition,
      riskLevel: formData.riskLevel,
    });
    
    navigate('/cold-rooms');
  };

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only administrators can add cold rooms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/cold-rooms')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Snowflake className="text-blue-500" />
            Add New Cold Room
          </h1>
          <p className="text-gray-500">Register a refrigeration unit for temperature monitoring</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Unit Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Main Cold Storage"
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
                placeholder="e.g., CR-001"
                required
              />
            </div>
            <div>
              <label className="label">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value as ColdRoomAsset['category'])}
                className="input"
              >
                <option value="cold_room">Cold Room</option>
                <option value="refrigerator">Refrigerator</option>
                <option value="freezer">Freezer</option>
                <option value="blast_freezer">Blast Freezer</option>
                <option value="chiller">Chiller</option>
              </select>
            </div>
            <div>
              <label className="label">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ColdRoomAsset['type'] })}
                className="input"
              >
                <option value="walk_in">Walk-in</option>
                <option value="reach_in">Reach-in</option>
                <option value="upright">Upright</option>
                <option value="under_counter">Under Counter</option>
                <option value="display">Display</option>
              </select>
            </div>
            <div>
              <label className="label">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                placeholder="e.g., Kitchen Cold Room A"
                required
              />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input
                type="text"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="input"
                placeholder="e.g., 1000 liters or 500 cubic feet"
              />
            </div>
          </div>
        </div>

        {/* Temperature Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Thermometer size={20} />
            Temperature Settings
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Min Temperature (°C) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.minTemp}
                onChange={(e) => setFormData({ ...formData, minTemp: e.target.value })}
                className="input"
                placeholder="e.g., 0"
                required
              />
            </div>
            <div>
              <label className="label">Max Temperature (°C) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.maxTemp}
                onChange={(e) => setFormData({ ...formData, maxTemp: e.target.value })}
                className="input"
                placeholder="e.g., 5"
                required
              />
            </div>
            <div>
              <label className="label">Target Temperature (°C) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.targetTemp}
                onChange={(e) => setFormData({ ...formData, targetTemp: e.target.value })}
                className="input"
                placeholder="e.g., 2"
                required
              />
            </div>
            <div>
              <label className="label">Critical Min (°C)</label>
              <input
                type="number"
                step="0.1"
                value={formData.criticalMin}
                onChange={(e) => setFormData({ ...formData, criticalMin: e.target.value })}
                className="input"
                placeholder="e.g., -5"
              />
            </div>
            <div>
              <label className="label">Critical Max (°C)</label>
              <input
                type="number"
                step="0.1"
                value={formData.criticalMax}
                onChange={(e) => setFormData({ ...formData, criticalMax: e.target.value })}
                className="input"
                placeholder="e.g., 10"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Temperature range automatically set based on category. Adjust as needed.
          </p>
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
            onClick={() => navigate('/cold-rooms')}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading || !formData.name || !formData.assetCode}
            className="btn btn-primary flex-1"
          >
            {createMutation.isLoading ? 'Creating...' : 'Create Cold Room'}
          </button>
        </div>
      </form>
    </div>
  );
}
