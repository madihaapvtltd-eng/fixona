import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useGeneratorRuntimeLogs, useGeneratorMaintenanceRecords } from '@/hooks/useGenerators';
import { Modal } from '@/components/ui/Modal';
import type { GeneratorAsset, GeneratorRuntimeLog, GeneratorMaintenanceRecord } from '@/types/generator';
import { 
  Zap, ArrowLeft, Clock, Fuel, Wrench, Activity, Gauge,
  Power, MapPin, Calendar, AlertTriangle, CheckCircle,
  ChevronRight, FileText, Droplets
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Runtime Log Entry
function RuntimeLogEntry({ log }: { log: GeneratorRuntimeLog }) {
  return (
    <div className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {log.startTime ? format(new Date(log.startTime), 'MMM d, yyyy') : 'Unknown'}
            </span>
            <span className="text-xs text-gray-500">
              {log.startTime ? format(new Date(log.startTime), 'HH:mm') : ''} - 
              {log.endTime ? format(new Date(log.endTime), 'HH:mm') : 'Running'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              <Clock size={14} className="inline mr-1" />
              {log.runtimeHours.toFixed(2)} hrs
            </span>
            {log.fuelConsumed && (
              <span className="text-gray-600">
                <Fuel size={14} className="inline mr-1" />
                {log.fuelConsumed.toFixed(1)} L
              </span>
            )}
            {log.loadPercentage > 0 && (
              <span className="text-gray-600">
                <Gauge size={14} className="inline mr-1" />
                {log.loadPercentage.toFixed(0)}% load
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {log.endTime ? (
            <CheckCircle size={20} className="text-green-500" />
          ) : (
            <Activity size={20} className="text-green-500 animate-pulse" />
          )}
        </div>
      </div>
      {log.notes && (
        <p className="mt-2 text-sm text-gray-500">{log.notes}</p>
      )}
    </div>
  );
}

// Maintenance Record Entry
function MaintenanceRecordEntry({ record }: { record: GeneratorMaintenanceRecord }) {
  const typeLabels: Record<string, string> = {
    daily: 'Daily Check',
    weekly: 'Weekly Service',
    monthly: 'Monthly Service',
    '250hr': '250-Hour Service',
    '500hr': '500-Hour Service',
    custom: 'Custom Service',
  };

  return (
    <div className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 mb-1">
            {typeLabels[record.type] || record.type}
          </span>
          <div className="text-sm font-medium text-gray-900">
            {record.createdAt ? format(new Date(record.createdAt.toDate()), 'MMM d, yyyy') : 'Unknown'}
          </div>
          <div className="text-sm text-gray-500">
            At {record.serviceHours.toFixed(0)} hrs • By {record.technician}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            Next: {record.nextServiceHours.toFixed(0)} hrs
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-600">{record.workPerformed}</p>
      {record.partsReplaced && record.partsReplaced.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {record.partsReplaced.map((part, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {part}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Fuel Gauge Component
function FuelGauge({ level }: { level: number }) {
  const getColor = () => {
    if (level > 50) return '#22c55e';
    if (level > 25) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke={getColor()}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${level * 1.76} 176`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Droplets size={20} className={level < 25 ? 'text-red-500' : 'text-blue-500'} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: getColor() }}>
          {level.toFixed(0)}%
        </div>
        <div className="text-sm text-gray-500">Fuel Level</div>
      </div>
    </div>
  );
}

// Power Gauge Component
function PowerGauge({ output, rated }: { output: number; rated: number }) {
  const percentage = Math.min((output / rated) * 100, 100);
  const getColor = () => {
    if (percentage < 60) return '#22c55e';
    if (percentage < 80) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke={getColor()}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${percentage * 1.76} 176`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap size={20} className={percentage > 80 ? 'text-red-500' : 'text-green-500'} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: getColor() }}>
          {output.toFixed(1)} kW
        </div>
        <div className="text-sm text-gray-500">
          {percentage.toFixed(0)}% of {rated} kVA
        </div>
      </div>
    </div>
  );
}

export function GeneratorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'runtime' | 'maintenance'>('overview');

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

  // Fetch runtime logs
  const { data: runtimeLogs, isLoading: logsLoading } = useGeneratorRuntimeLogs(id);

  // Fetch maintenance records
  const { data: maintenanceRecords, isLoading: maintLoading } = useGeneratorMaintenanceRecords(id);

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
        <Link to="/generators" className="text-primary-600 hover:underline mt-4 inline-block">
          Back to Generators
        </Link>
      </div>
    );
  }

  const hoursUntilService = generator.nextServiceHours - generator.totalRuntimeHours;
  const isServiceDue = hoursUntilService <= 50;

  // Chart data from runtime logs
  const chartData = runtimeLogs?.slice(0, 30).reverse().map(log => ({
    date: log.startTime ? format(new Date(log.startTime), 'MMM d') : '',
    hours: log.runtimeHours,
    fuel: log.fuelConsumed || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/generators')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{generator.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              generator.isRunning 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {generator.isRunning ? 'Running' : 'Standby'}
            </span>
          </div>
          <p className="text-gray-500">{generator.assetCode} • {generator.location}</p>
        </div>
        <Link
          to={`/generators/${id}/maintenance`}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Wrench size={18} />
          Maintenance
        </Link>
      </div>

      {/* Alerts */}
      {isServiceDue && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-yellow-600" size={24} />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">
              Service Due Soon
            </p>
            <p className="text-sm text-yellow-700">
              {hoursUntilService > 0 
                ? `Only ${hoursUntilService.toFixed(0)} hours until next service`
                : 'Service overdue - schedule maintenance immediately'}
            </p>
          </div>
          <Link
            to={`/generators/${id}/maintenance`}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Schedule
          </Link>
        </div>
      )}

      {generator.currentFuelLevel < 25 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={24} />
          <div className="flex-1">
            <p className="font-medium text-red-800">
              Low Fuel Level
            </p>
            <p className="text-sm text-red-700">
              Current level: {generator.currentFuelLevel.toFixed(0)}% - Request refuel
            </p>
          </div>
          <Link
            to="/fuel-requests/new"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Request Fuel
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['overview', 'runtime', 'maintenance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <FuelGauge level={generator.currentFuelLevel} />
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Capacity</span>
                  <span className="font-medium">{generator.fuelTankCapacityLiters} L</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Current</span>
                  <span className="font-medium">
                    {((generator.fuelTankCapacityLiters * generator.currentFuelLevel) / 100).toFixed(0)} L
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Consumption</span>
                  <span className="font-medium">{generator.fuelConsumptionRate} L/hr</span>
                </div>
              </div>
            </div>

            <div className="card">
              <PowerGauge output={generator.powerOutputKw || 0} rated={generator.powerRatingKva} />
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rated</span>
                  <span className="font-medium">{generator.powerRatingKva} kVA</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Voltage</span>
                  <span className="font-medium">{generator.voltage}V</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Frequency</span>
                  <span className="font-medium">{generator.frequency}Hz</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock size={24} className="text-blue-500" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {generator.totalRuntimeHours.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Hours</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Session</span>
                  <span className="font-medium">{generator.currentSessionHours.toFixed(2)} hrs</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Next Service</span>
                  <span className={`font-medium ${isServiceDue ? 'text-red-600' : ''}`}>
                    {generator.nextServiceHours.toFixed(0)} hrs
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Hours Until Service</span>
                  <span className={`font-medium ${isServiceDue ? 'text-red-600' : ''}`}>
                    {hoursUntilService.toFixed(0)} hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Runtime History (Last 30 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Runtime Hours"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Generator Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Installation Type</span>
                  <span className="font-medium capitalize">{generator.installationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ATS Status</span>
                  <span className="font-medium capitalize">{generator.atsStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condition</span>
                  <span className="font-medium capitalize">{generator.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Risk Level</span>
                  <span className={`font-medium capitalize ${
                    generator.riskLevel === 'critical' ? 'text-red-600' : 
                    generator.riskLevel === 'high' ? 'text-orange-600' : ''
                  }`}>{generator.riskLevel}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Service Schedule</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Interval</span>
                  <span className="font-medium">{generator.serviceIntervalHours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Service</span>
                  <span className="font-medium">
                    {generator.lastServiceDate 
                      ? format(new Date(generator.lastServiceDate), 'MMM d, yyyy')
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Service Due</span>
                  <span className={`font-medium ${isServiceDue ? 'text-red-600' : ''}`}>
                    {generator.nextServiceHours.toFixed(0)} hrs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'runtime' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Runtime Logs</h3>
            <Link
              to={`/generators/${id}/runtime`}
              className="text-primary-600 hover:underline text-sm flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </Link>
          </div>
          {logsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : runtimeLogs?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No runtime logs yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {runtimeLogs?.slice(0, 10).map(log => (
                <RuntimeLogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Maintenance History</h3>
            <Link
              to={`/generators/${id}/maintenance`}
              className="text-primary-600 hover:underline text-sm flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </Link>
          </div>
          {maintLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : maintenanceRecords?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No maintenance records yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {maintenanceRecords?.slice(0, 10).map(record => (
                <MaintenanceRecordEntry key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
