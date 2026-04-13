import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BedDouble, Plus, Search, Filter, RefreshCw, 
  CheckCircle2, AlertCircle, Wrench, Home, 
  UserX, Sparkles, ArrowRight
} from 'lucide-react';
import { useRooms, useRoomStats, useRoomMutations } from '@/hooks/useHousekeeping';
import { useAuthStore } from '@/stores/authStore';
import { roomStatusLabels, roomStatusColors, roomTypeLabels, viewTypeLabels } from '@/types/housekeeping';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function HousekeepingPage() {
  const { user, isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  const { data: rooms, isLoading } = useRooms(companyId);
  const { data: stats } = useRoomStats(companyId);
  const { updateRoomStatus } = useRoomMutations();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredRooms = rooms?.filter(room => {
    const matchesSearch = 
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.assignedHousekeeperName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesType = typeFilter === 'all' || room.roomType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleQuickClean = async (roomId: string) => {
    try {
      await updateRoomStatus.mutateAsync({
        id: roomId,
        status: 'vacant-clean',
        lastCleaned: new Date().toISOString(),
      });
      toast.success('Room marked as clean');
    } catch (error) {
      toast.error('Failed to update room status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BedDouble className="h-8 w-8 text-primary-600" />
            Housekeeping & Rooms
          </h1>
          <p className="text-gray-600 mt-1">Manage room status, cleaning tasks, and inspections</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/housekeeping/cleaning-tasks"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Cleaning Tasks
          </Link>
          <Link
            to="/housekeeping/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Room
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Vacant Clean</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.vacantClean}</p>
          </div>
          <div className="card bg-yellow-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Vacant Dirty</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.vacantDirty}</p>
          </div>
          <div className="card bg-blue-50">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.occupied}</p>
          </div>
          <div className="card bg-red-50">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">DND</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-1">{stats.doNotDisturb}</p>
          </div>
          <div className="card bg-orange-50">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-gray-600">Maintenance</span>
            </div>
            <p className="text-2xl font-bold text-orange-700 mt-1">{stats.maintenance}</p>
          </div>
          <div className="card bg-gray-50">
            <div className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-700 mt-1">{stats.total}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms, locations, housekeepers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="vacant-clean">Vacant Clean</option>
              <option value="vacant-dirty">Vacant Dirty</option>
              <option value="occupied">Occupied</option>
              <option value="occupied-do-not-disturb">Do Not Disturb</option>
              <option value="maintenance">Maintenance</option>
              <option value="out-of-order">Out of Order</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Types</option>
              <option value="villa">Villa</option>
              <option value="suite">Suite</option>
              <option value="bungalow">Bungalow</option>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="presidential">Presidential</option>
            </select>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="btn btn-secondary"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="card text-center py-12">
          <BedDouble className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No rooms found matching your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <div key={room.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Room {room.roomNumber}</h3>
                  <p className="text-sm text-gray-500">{roomTypeLabels[room.roomType]}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${roomStatusColors[room.status]}`}>
                  {roomStatusLabels[room.status]}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Home className="h-4 w-4" />
                  <span>{room.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Sparkles className="h-4 w-4" />
                  <span>{viewTypeLabels[room.viewType]}</span>
                </div>
                {room.assignedHousekeeperName && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Housekeeper: {room.assignedHousekeeperName}
                    </span>
                  </div>
                )}
                {room.lastCleaned && (
                  <div className="text-xs text-gray-500">
                    Last cleaned: {format(new Date(room.lastCleaned), 'MMM d, h:mm a')}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {room.status === 'vacant-dirty' && (
                  <button
                    onClick={() => handleQuickClean(room.id!)}
                    className="btn btn-primary btn-sm flex-1"
                    disabled={updateRoomStatus.isLoading}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Clean
                  </button>
                )}
                <Link
                  to={`/housekeeping/room/${room.id}`}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  Details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
