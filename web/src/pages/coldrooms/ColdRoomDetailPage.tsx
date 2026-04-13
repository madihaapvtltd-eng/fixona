import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useTemperatureLogs, useColdRoomAlerts, useColdRoomMaintenance } from '@/hooks/useColdRooms';
import { Modal } from '@/components/ui/Modal';
import type { ColdRoomAsset, TemperatureLog, ColdRoomMaintenanceRecord } from '@/types/coldroom';
import { getTempStatusColor, getCategoryLabel, CHECK_TIMES } from '@/types/coldroom';
import { 
  Thermometer, ArrowLeft, Snowflake, AlertTriangle, CheckCircle,
  Clock, Calendar, Wrench, Droplets, MapPin, FileText, ChevronRight
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Temperature Log Entry
function TempLogEntry({ log }: { log: TemperatureLog }) {
  return (
    <div className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {log.checkTime === 'morning' ? 'Morning' : 'Evening'} Check
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(log.recordedAt), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-4">
            <span className={`font-medium ${log.isOutOfRange ? 'text-red-600' : 'text-green-600'}`}>
              {log.temperature.toFixed(1)}°C
            </span>
            {log.humidity !== undefined && (
              <span className="text-sm text-gray-600">
                <Droplets size={14} className="inline mr-1" />
                {log.humidity}%
              </span>
            )}
            <span className="text-sm text-gray-500">
              by {log.recordedBy}
            </span>
          </div>
          {log.issuesFound && (
            <div className="mt-2 text-sm text-red-600">
              <AlertTriangle size={14} className="inline mr-1" />
              Issue: {log.issueDescription}
            </div>
          )}
        </div>
        <div>
          {log.isOutOfRange ? (
            <AlertTriangle size={20} className="text-red-500" />
          ) : (
            <CheckCircle size={20} className="text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
}

// Maintenance Record Entry
function MaintenanceEntry({ record }: { record: ColdRoomMaintenanceRecord }) {
  const typeLabels: Record<string, string> = {
    daily_cleaning: 'Daily Cleaning',
    weekly_check: 'Weekly Check',
    monthly_service: 'Monthly Service',
    quarterly_service: 'Quarterly Service',
    repair: 'Repair',
    defrost: 'Defrost',
  };

  return (
    <div className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div>
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            record.status === 'completed' ? 'bg-green-100 text-green-700' :
            record.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
            record.status === 'overdue' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {typeLabels[record.type] || record.type}
          </span>
          <div className="text-sm font-medium text-gray-900 mt-1">
            {record.scheduledDate ? format(new Date(record.scheduledDate), 'MMM d, yyyy') : 'Unknown'}
          </div>
          <div className="text-sm text-gray-500">
            {record.technician}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium capitalize ${
            record.status === 'completed' ? 'text-green-600' :
            record.status === 'overdue' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {record.status}
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-600">{record.workPerformed}</p>
    </div>
  );
}

export function ColdRoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'temperature' | 'maintenance'>('overview');
  const [dateRange, setDateRange] = useState(7); // Days of history to show

  // Fetch cold room
  const { data: coldRoom, isLoading: roomLoading } = useQuery(
    ['coldRoom', id],
    async () => {
      if (!id) return null;
      const snap = await getDoc(doc(db, 'coldRooms', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as ColdRoomAsset;
    },
    { enabled: !!id }
  );

  // Fetch temperature logs
  const dateFrom = subDays(new Date(), dateRange);
  const { data: tempLogs, isLoading: logsLoading } = useTemperatureLogs(id, dateFrom);

  // Fetch alerts
  const { data: alerts } = useColdRoomAlerts(id, false);

  // Fetch maintenance records
  const { data: maintenanceRecords } = useColdRoomMaintenance(id);

  if (roomLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!coldRoom) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Cold room not found</h2>
        <Link to="/cold-rooms" className="text-primary-600 hover:underline mt-4 inline-block">
          Back to Cold Rooms
        </Link>
      </div>
    );
  }

  // Chart data
  const chartData = tempLogs?.slice().reverse().map(log => ({
    time: format(new Date(log.recordedAt), 'MMM d HH:mm'),
    temp: log.temperature,
    humidity: log.humidity,
  })) || [];

  // Active alerts count
  const activeAlerts = alerts?.filter(a => a.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/cold-rooms')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{coldRoom.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              getTempStatusColor(coldRoom.currentTemp || 0, coldRoom)
            }`}>
              {coldRoom.status === 'normal' ? 'Normal' : 
               coldRoom.status === 'warning' ? 'Warning' : 
               coldRoom.status === 'critical' ? 'Critical' : coldRoom.status}
            </span>
          </div>
          <p className="text-gray-500">{coldRoom.assetCode} • {getCategoryLabel(coldRoom.category)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/cold-rooms/${id}/temperature`}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Thermometer size={18} />
            Log Temp
          </Link>
          <Link
            to={`/cold-rooms/${id}/maintenance`}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Wrench size={18} />
            Maintenance
          </Link>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
            <div className="flex-1">
              <p className="font-medium text-red-800">
                {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-700">
                {activeAlerts[0].message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Temperature Display */}
      <div className="card bg-gradient-to-r from-blue-50 to-white border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Thermometer className="text-blue-600" size={32} />
            </div>
            <div>
              <div className="text-sm text-gray-600">Current Temperature</div>
              <div className={`text-4xl font-bold ${
                coldRoom.currentTemp !== undefined && 
                (coldRoom.currentTemp < coldRoom.minTemp || coldRoom.currentTemp > coldRoom.maxTemp)
                  ? 'text-red-600'
                  : 'text-blue-600'
              }`}>
                {coldRoom.currentTemp !== undefined ? `${coldRoom.currentTemp.toFixed(1)}°C` : '--'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Target Range</div>
            <div className="text-lg font-medium">
              {coldRoom.minTemp}° to {coldRoom.maxTemp}°C
            </div>
            <div className="text-sm text-gray-500">
              Target: {coldRoom.targetTemp}°C
            </div>
          </div>
        </div>
        {coldRoom.lastCheckAt && (
          <div className="mt-4 pt-4 border-t border-blue-100">
            <p className="text-sm text-gray-600">
              Last check: {format(new Date(coldRoom.lastCheckAt), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['overview', 'temperature', 'maintenance'] as const).map((tab) => (
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
          {/* Key Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <MapPin size={20} className="text-gray-400" />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-gray-900">{coldRoom.location}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <Snowflake size={20} className="text-gray-400" />
                <span className="font-medium">Type</span>
              </div>
              <p className="text-gray-900 capitalize">{coldRoom.type.replace('_', ' ')}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <Droplets size={20} className="text-gray-400" />
                <span className="font-medium">Capacity</span>
              </div>
              <p className="text-gray-900">{coldRoom.capacity}</p>
            </div>
          </div>

          {/* Temperature Chart */}
          {chartData.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Temperature History (Last {dateRange} Days)</h3>
                <div className="flex gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setDateRange(days)}
                      className={`px-3 py-1 rounded text-sm ${
                        dateRange === days
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis domain={[coldRoom.minTemp - 5, coldRoom.maxTemp + 5]} />
                    <Tooltip />
                    <ReferenceLine y={coldRoom.minTemp} stroke="red" strokeDasharray="3 3" />
                    <ReferenceLine y={coldRoom.maxTemp} stroke="red" strokeDasharray="3 3" />
                    <ReferenceLine y={coldRoom.targetTemp} stroke="green" strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'temperature' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Temperature Logs</h3>
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setDateRange(days)}
                  className={`px-3 py-1 rounded text-sm ${
                    dateRange === days
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Last {days} days
                </button>
              ))}
            </div>
          </div>
          {logsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tempLogs?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No temperature logs yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {tempLogs?.slice(0, 50).map(log => (
                <TempLogEntry key={log.id} log={log} />
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
              to={`/cold-rooms/${id}/maintenance`}
              className="text-primary-600 hover:underline text-sm flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </Link>
          </div>
          {maintenanceRecords?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No maintenance records yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {maintenanceRecords?.slice(0, 10).map(record => (
                <MaintenanceEntry key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
