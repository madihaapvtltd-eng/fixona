import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGenerators, useStartGenerator, useStopGenerator } from '@/hooks/useGenerators';
import { useAuthStore } from '@/stores/authStore';
import { Modal } from '@/components/ui/Modal';
import type { GeneratorAsset } from '@/types/generator';
import { 
  Zap, Plus, Search, Play, Square, Fuel, Wrench, AlertTriangle,
  Clock, Gauge, Power, ChevronRight, Activity, Droplets
} from 'lucide-react';
import { format } from 'date-fns';

// Status Badge Component
function GeneratorStatusBadge({ status, isRunning }: { status: GeneratorAsset['status']; isRunning: boolean }) {
  const getColors = () => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700 border-green-200';
      case 'standby': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'fault': return 'bg-red-100 text-red-700 border-red-200';
      case 'offline': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getColors()} flex items-center gap-1`}>
      {isRunning && <Activity size={12} className="animate-pulse" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Fuel Level Indicator
function FuelLevelIndicator({ level, capacity }: { level: number; capacity: number }) {
  const getColor = () => {
    if (level > 50) return 'bg-green-500';
    if (level > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <Droplets size={16} className={level < 25 ? 'text-red-500' : 'text-blue-500'} />
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className="text-sm text-gray-600">
        {level.toFixed(0)}% ({((capacity * level) / 100).toFixed(0)}L)
      </span>
    </div>
  );
}

// Runtime Counter
function RuntimeCounter({ 
  isRunning, 
  currentSessionHours, 
  totalRuntimeHours,
  lastStartTime 
}: { 
  isRunning: boolean;
  currentSessionHours: number;
  totalRuntimeHours: number;
  lastStartTime?: Date;
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Clock size={14} className="text-gray-400" />
        <span className="text-gray-600">Total: </span>
        <span className="font-medium">{totalRuntimeHours.toFixed(1)} hrs</span>
      </div>
      {isRunning && (
        <div className="flex items-center gap-1 text-green-600">
          <Activity size={14} className="animate-pulse" />
          <span>Current: {currentSessionHours.toFixed(2)} hrs</span>
        </div>
      )}
    </div>
  );
}

export function GeneratorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenerator, setSelectedGenerator] = useState<GeneratorAsset | null>(null);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [runtimeData, setRuntimeData] = useState({
    runtimeHours: 0,
    fuelConsumed: 0,
    loadPercentage: 0,
    powerOutputKw: 0,
    notes: '',
  });

  const { data: generators, isLoading } = useGenerators();
  const startMutation = useStartGenerator();
  const stopMutation = useStopGenerator();
  const { user } = useAuthStore();

  const canControlGenerators = user?.role === 'super_admin' || user?.role === 'company_admin' || user?.role === 'supervisor';

  const filteredGenerators = generators?.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStart = async (generator: GeneratorAsset) => {
    if (!canControlGenerators) return;
    await startMutation.mutateAsync({ 
      id: generator.id, 
      operatorName: user?.name 
    });
  };

  const handleStop = async (generator: GeneratorAsset) => {
    if (!canControlGenerators) return;
    setSelectedGenerator(generator);
    setStopModalOpen(true);
  };

  const submitStop = async () => {
    if (!selectedGenerator) return;
    await stopMutation.mutateAsync({
      id: selectedGenerator.id,
      ...runtimeData,
    });
    setStopModalOpen(false);
    setSelectedGenerator(null);
    setRuntimeData({
      runtimeHours: 0,
      fuelConsumed: 0,
      loadPercentage: 0,
      powerOutputKw: 0,
      notes: '',
    });
  };

  // Stats
  const runningCount = generators?.filter(g => g.isRunning).length || 0;
  const lowFuelCount = generators?.filter(g => g.currentFuelLevel < 25).length || 0;
  const maintenanceDue = generators?.filter(g => {
    const hoursUntilService = g.nextServiceHours - g.totalRuntimeHours;
    return hoursUntilService <= 50;
  }).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Power Generators
          </h1>
          <p className="text-gray-500 mt-1">
            Manage runtime, fuel, and maintenance for all generators
          </p>
        </div>
        <Link
          to="/generators/new"
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Generator
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Power className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Running</p>
              <p className="text-2xl font-bold text-green-700">{runningCount}</p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-blue-700">{generators?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Fuel className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Fuel</p>
              <p className="text-2xl font-bold text-red-700">{lowFuelCount}</p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Wrench className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Service Due</p>
              <p className="text-2xl font-bold text-yellow-700">{maintenanceDue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search generators by name, code, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Generators Grid */}
      {filteredGenerators?.length === 0 ? (
        <div className="card text-center py-12">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No generators found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Add your first generator to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGenerators?.map((generator) => (
            <div 
              key={generator.id} 
              className={`card hover:shadow-lg transition-shadow ${generator.isRunning ? 'border-green-300' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{generator.name}</h3>
                  <p className="text-sm text-gray-500">{generator.assetCode}</p>
                </div>
                <GeneratorStatusBadge status={generator.status} isRunning={generator.isRunning} />
              </div>

              {/* Power Specs */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Gauge size={14} className="text-gray-400" />
                  <span className="text-gray-600">{generator.powerRatingKva} kVA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-gray-400" />
                  <span className="text-gray-600">{generator.voltage}V / {generator.frequency}Hz</span>
                </div>
              </div>

              {/* Fuel Level */}
              <div className="mb-4">
                <FuelLevelIndicator 
                  level={generator.currentFuelLevel} 
                  capacity={generator.fuelTankCapacityLiters} 
                />
                {generator.currentFuelLevel < 25 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Low fuel - request refuel soon
                  </p>
                )}
              </div>

              {/* Runtime Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <RuntimeCounter 
                  isRunning={generator.isRunning}
                  currentSessionHours={generator.currentSessionHours}
                  totalRuntimeHours={generator.totalRuntimeHours}
                  lastStartTime={generator.lastStartTime}
                />
                <div className="mt-2 text-xs text-gray-500">
                  Next service: {generator.nextServiceHours - generator.totalRuntimeHours > 0 
                    ? `${(generator.nextServiceHours - generator.totalRuntimeHours).toFixed(0)} hrs` 
                    : 'Due now'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {canControlGenerators && (
                  <>
                    {!generator.isRunning ? (
                      <button
                        onClick={() => handleStart(generator)}
                        disabled={startMutation.isLoading}
                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Play size={16} />
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStop(generator)}
                        disabled={stopMutation.isLoading}
                        className="btn btn-secondary flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700"
                      >
                        <Square size={16} />
                        Stop
                      </button>
                    )}
                  </>
                )}
                <Link
                  to={`/generators/${generator.id}`}
                  className="btn btn-secondary flex items-center gap-1"
                >
                  Details
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stop Generator Modal */}
      <Modal 
        isOpen={stopModalOpen} 
        onClose={() => setStopModalOpen(false)} 
        title={`Stop ${selectedGenerator?.name || 'Generator'}`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Log the runtime data for this generator session:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Runtime Hours *</label>
              <input
                type="number"
                step="0.1"
                value={runtimeData.runtimeHours}
                onChange={(e) => setRuntimeData({ ...runtimeData, runtimeHours: parseFloat(e.target.value) || 0 })}
                className="input"
                placeholder="e.g., 4.5"
              />
            </div>
            <div>
              <label className="label">Fuel Consumed (L)</label>
              <input
                type="number"
                step="0.1"
                value={runtimeData.fuelConsumed}
                onChange={(e) => setRuntimeData({ ...runtimeData, fuelConsumed: parseFloat(e.target.value) || 0 })}
                className="input"
                placeholder="e.g., 25.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Load Percentage</label>
              <input
                type="number"
                min="0"
                max="100"
                value={runtimeData.loadPercentage}
                onChange={(e) => setRuntimeData({ ...runtimeData, loadPercentage: parseFloat(e.target.value) || 0 })}
                className="input"
                placeholder="0-100%"
              />
            </div>
            <div>
              <label className="label">Power Output (kW)</label>
              <input
                type="number"
                step="0.1"
                value={runtimeData.powerOutputKw}
                onChange={(e) => setRuntimeData({ ...runtimeData, powerOutputKw: parseFloat(e.target.value) || 0 })}
                className="input"
                placeholder="e.g., 150"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={runtimeData.notes}
              onChange={(e) => setRuntimeData({ ...runtimeData, notes: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Any issues or observations..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStopModalOpen(false)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={submitStop}
              disabled={stopMutation.isLoading || runtimeData.runtimeHours <= 0}
              className="btn btn-primary flex-1"
            >
              {stopMutation.isLoading ? 'Saving...' : 'Log & Stop'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
