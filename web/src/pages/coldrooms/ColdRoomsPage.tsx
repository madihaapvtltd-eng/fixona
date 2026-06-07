import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useColdRooms, useTodayCheckStatus } from '@/hooks/useColdRooms';
import { useAuthStore } from '@/stores/authStore';
import { Modal } from '@/components/ui/Modal';
import type { ColdRoomAsset } from '@/types/coldroom';
import { 
  Thermometer, Plus, Search, CheckCircle, AlertTriangle, 
  Clock, Droplets, Snowflake, Calendar, ChevronRight, Bell, X
} from 'lucide-react';
import { format } from 'date-fns';

// Status Badge Component
function ColdRoomStatusBadge({ status, currentTemp, minTemp, maxTemp }: { 
  status: ColdRoomAsset['status']; 
  currentTemp?: number;
  minTemp: number;
  maxTemp: number;
}) {
  const getColors = () => {
    if (currentTemp !== undefined) {
      if (currentTemp < minTemp || currentTemp > maxTemp) {
        return 'bg-red-100 text-red-700 border-red-200';
      }
    }
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'maintenance': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'offline': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLabel = () => {
    if (currentTemp !== undefined) {
      if (currentTemp < minTemp) return 'Too Cold';
      if (currentTemp > maxTemp) return 'Too Warm';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getColors()}`}>
      {getLabel()}
    </span>
  );
}

// Temperature Gauge Component
function TemperatureGauge({ temp, min, max, target }: { temp?: number; min: number; max: number; target: number }) {
  if (temp === undefined) return <span className="text-gray-400">--</span>;
  
  const isOutOfRange = temp < min || temp > max;
  const isCritical = temp < min - 5 || temp > max + 5;
  
  return (
    <div className="flex items-center gap-2">
      <Thermometer size={16} className={isOutOfRange ? 'text-red-500' : 'text-blue-500'} />
      <span className={`font-medium ${isCritical ? 'text-red-600' : isOutOfRange ? 'text-yellow-600' : 'text-gray-900'}`}>
        {temp.toFixed(1)}°C
      </span>
      <span className="text-xs text-gray-500">
        (Target: {target}°C)
      </span>
    </div>
  );
}

// Check Status Indicator
function CheckStatus({ morningDone, middayDone, eveningDone }: { morningDone: boolean; middayDone: boolean; eveningDone: boolean }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <div className="flex items-center gap-0.5">
        <CheckCircle size={12} className={morningDone ? 'text-green-500' : 'text-gray-300'} />
        <span className={morningDone ? 'text-green-700' : 'text-gray-400'}>AM</span>
      </div>
      <div className="flex items-center gap-0.5">
        <CheckCircle size={12} className={middayDone ? 'text-green-500' : 'text-gray-300'} />
        <span className={middayDone ? 'text-green-700' : 'text-gray-400'}>MID</span>
      </div>
      <div className="flex items-center gap-0.5">
        <CheckCircle size={12} className={eveningDone ? 'text-green-500' : 'text-gray-300'} />
        <span className={eveningDone ? 'text-green-700' : 'text-gray-400'}>PM</span>
      </div>
    </div>
  );
}

export function ColdRoomsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ColdRoomAsset | null>(null);
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');
  const [showNotifications, setShowNotifications] = useState(true);
  
  const { data: coldRooms, isLoading } = useColdRooms();
  const { data: checkStatus } = useTodayCheckStatus();
  const { user } = useAuthStore();
  
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin' || user?.role === 'technician';

  const filteredRooms = coldRooms?.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Notifications for critical and warning
  const criticalRooms = coldRooms?.filter(r => r.status === 'critical') || [];
  const warningRooms = coldRooms?.filter(r => r.status === 'warning') || [];
  const hasNotifications = criticalRooms.length > 0 || warningRooms.length > 0;

  // Stats
  const normalCount = coldRooms?.filter(r => r.status === 'normal').length || 0;
  const warningCount = coldRooms?.filter(r => r.status === 'warning').length || 0;
  const criticalCount = coldRooms?.filter(r => r.status === 'critical').length || 0;
  const totalChecks = checkStatus?.length || 0;
  const completedChecks = checkStatus?.filter((s: any) => s.morningDone && s.middayDone && s.eveningDone).length || 0;

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
            <Snowflake className="text-blue-500" />
            Cold Rooms & Refrigeration
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor temperatures, maintenance, and compliance
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/cold-rooms/temperature-log"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Thermometer size={18} />
            Log Temperature
          </Link>
          {canManage && (
            <Link
              to="/cold-rooms/new"
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Unit
            </Link>
          )}
        </div>
      </div>

      {/* Notifications Banner */}
      {showNotifications && hasNotifications && (
        <div className="space-y-2">
          {criticalRooms.map(room => (
            <div key={room.id} className="card bg-red-50 border-red-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bell className="text-red-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-red-800">Critical Alert: {room.name}</p>
                  <p className="text-sm text-red-600">
                    Temperature {room.currentTemp}°C is out of range ({room.minTemp}°C - {room.maxTemp}°C)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link 
                  to={`/cold-rooms/${room.id}`}
                  className="btn btn-sm btn-primary"
                >
                  View Details
                </Link>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
          {warningRooms.map(room => (
            <div key={room.id} className="card bg-yellow-50 border-yellow-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-yellow-800">Warning: {room.name}</p>
                  <p className="text-sm text-yellow-600">
                    Temperature {room.currentTemp}°C is near limit ({room.minTemp}°C - {room.maxTemp}°C)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link 
                  to={`/cold-rooms/${room.id}`}
                  className="btn btn-sm btn-primary"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button 
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'normal' ? 'all' : 'normal')}
          className={`card text-left cursor-pointer transition-all hover:shadow-md active:scale-95 ${statusFilter === 'normal' ? 'ring-2 ring-green-500' : 'bg-green-50 border-green-200'}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Thermometer className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Normal</p>
              <p className="text-2xl font-bold text-green-700">{normalCount}</p>
            </div>
          </div>
          {statusFilter === 'normal' && <p className="text-xs text-green-600 mt-2">Click to show all</p>}
        </button>

        <button 
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
          className={`card text-left cursor-pointer transition-all hover:shadow-md active:scale-95 ${statusFilter === 'warning' ? 'ring-2 ring-yellow-500' : 'bg-yellow-50 border-yellow-200'}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Warning</p>
              <p className="text-2xl font-bold text-yellow-700">{warningCount}</p>
            </div>
          </div>
          {statusFilter === 'warning' && <p className="text-xs text-yellow-600 mt-2">Click to show all</p>}
        </button>

        <button 
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          className={`card text-left cursor-pointer transition-all hover:shadow-md active:scale-95 ${statusFilter === 'critical' ? 'ring-2 ring-red-500' : 'bg-red-50 border-red-200'}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Thermometer className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
            </div>
          </div>
          {statusFilter === 'critical' && <p className="text-xs text-red-600 mt-2">Click to show all</p>}
        </button>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Checks</p>
              <p className="text-2xl font-bold text-blue-700">{completedChecks}/{totalChecks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Indicator */}
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Filtered by:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusFilter === 'normal' ? 'bg-green-100 text-green-700' :
            statusFilter === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </span>
          <button 
            onClick={() => setStatusFilter('all')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Today's Status */}
      {checkStatus && checkStatus.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Today's Temperature Check Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {checkStatus.map((status) => (
              <div 
                key={status.coldRoomId}
                className={`p-3 rounded-lg border ${
                  status.morningDone && status.middayDone && status.eveningDone 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 truncate">{status.coldRoomName}</div>
                <CheckStatus morningDone={status.morningDone} middayDone={status.middayDone} eveningDone={status.eveningDone} />
                {/* 3 Temperatures */}
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                  {status.morningTemp !== undefined && (
                    <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded">AM: {status.morningTemp.toFixed(1)}°C</span>
                  )}
                  {status.middayTemp !== undefined && (
                    <span className="px-1 py-0.5 bg-orange-100 text-orange-700 rounded">MID: {status.middayTemp.toFixed(1)}°C</span>
                  )}
                  {status.eveningTemp !== undefined && (
                    <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded">PM: {status.eveningTemp.toFixed(1)}°C</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search cold rooms by name, code, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Cold Rooms Grid */}
      {filteredRooms?.length === 0 ? (
        <div className="card text-center py-12">
          <Snowflake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No cold rooms found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Add your first cold room to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRooms?.map((room) => {
            const status = checkStatus?.find(s => s.coldRoomId === room.id);
            
            return (
              <div 
                key={room.id} 
                className={`card hover:shadow-lg transition-shadow ${
                  room.status === 'critical' ? 'border-red-300' : 
                  room.status === 'warning' ? 'border-yellow-300' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{room.name}</h3>
                    <p className="text-sm text-gray-500">{room.assetCode}</p>
                  </div>
                  <ColdRoomStatusBadge 
                    status={room.status} 
                    currentTemp={room.currentTemp}
                    minTemp={room.minTemp}
                    maxTemp={room.maxTemp}
                  />
                </div>

                {/* Temperature */}
                <div className="mb-4">
                  <TemperatureGauge 
                    temp={room.currentTemp}
                    min={room.minTemp}
                    max={room.maxTemp}
                    target={room.targetTemp}
                  />
                  {room.lastCheckAt && !isNaN(new Date(room.lastCheckAt).getTime()) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last check: {format(new Date(room.lastCheckAt), 'MMM d, HH:mm')}
                    </p>
                  )}
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Droplets size={14} className="text-gray-400" />
                    <span className="text-gray-600">Range: {room.minTemp}° to {room.maxTemp}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-gray-600">{room.location}</span>
                  </div>
                </div>

                {/* Today's Check Status */}
                {status && (
                  <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                    <CheckStatus 
                      morningDone={status.morningDone} 
                      middayDone={status.middayDone} 
                      eveningDone={status.eveningDone} 
                    />
                    {/* 3 Temperatures */}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {status.morningTemp !== undefined && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">AM: {status.morningTemp.toFixed(1)}°C</span>
                      )}
                      {status.middayTemp !== undefined && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">MID: {status.middayTemp.toFixed(1)}°C</span>
                      )}
                      {status.eveningTemp !== undefined && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">PM: {status.eveningTemp.toFixed(1)}°C</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowQuickCheck(true);
                    }}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Thermometer size={16} />
                    Log Temp
                  </button>
                  <Link
                    to={`/cold-rooms/${room.id}`}
                    className="btn btn-secondary flex items-center gap-1"
                  >
                    Details
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
