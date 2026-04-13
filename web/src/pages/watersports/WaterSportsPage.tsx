import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Anchor, Ship, Plus, Search, LifeBuoy, 
  CheckCircle2, AlertCircle, Clock, TrendingUp,
  ArrowRight, Waves
} from 'lucide-react';
import { useWaterSportsEquipment, useMarineVessels, useActiveRentals, useWaterSportsStats } from '@/hooks/useWaterSports';
import { useAuthStore } from '@/stores/authStore';
import { 
  equipmentTypeLabels, equipmentStatusLabels, equipmentStatusColors,
  vesselTypeLabels, vesselStatusLabels, vesselStatusColors
} from '@/types/watersports';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function WaterSportsPage() {
  const { isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'vessels'>('overview');
  const [equipmentFilter, setEquipmentFilter] = useState({ type: 'all', status: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: equipment, isLoading: equipLoading } = useWaterSportsEquipment(companyId, equipmentFilter);
  const { data: vessels, isLoading: vesselLoading } = useMarineVessels(companyId);
  const { data: activeRentals } = useActiveRentals(companyId);
  const { data: stats } = useWaterSportsStats(companyId);

  const filteredEquipment = equipment?.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.assetCode.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredVessels = vessels?.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Waves className="h-8 w-8 text-primary-600" />
            Water Sports & Marine
          </h1>
          <p className="text-gray-600 mt-1">Manage equipment rentals, vessels, and marine operations</p>
        </div>
        <div className="flex gap-2">
          <Link to="/water-sports/rental" className="btn btn-secondary flex items-center gap-2">
            <LifeBuoy className="h-4 w-4" />
            New Rental
          </Link>
          <Link to="/water-sports/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Equipment
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.availableEquipment}</p>
            <p className="text-xs text-gray-500">Equipment ready to rent</p>
          </div>
          <div className="card bg-blue-50">
            <div className="flex items-center gap-2">
              <Anchor className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Active Rentals</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.activeRentals}</p>
            <p className="text-xs text-gray-500">Currently with guests</p>
          </div>
          <div className="card bg-cyan-50">
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-cyan-600" />
              <span className="text-sm text-gray-600">Vessels</span>
            </div>
            <p className="text-2xl font-bold text-cyan-700 mt-1">{stats.operationalVessels}/{stats.totalVessels}</p>
            <p className="text-xs text-gray-500">Operational vessels</p>
          </div>
          <div className="card bg-yellow-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Active Trips</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.activeTrips}</p>
            <p className="text-xs text-gray-500">At sea or scheduled</p>
          </div>
        </div>
      )}

      {/* Active Rentals Alert */}
      {activeRentals && activeRentals.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5" />
            Active Rentals ({activeRentals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeRentals.slice(0, 6).map((rental) => (
              <div key={rental.id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{rental.equipmentName}</p>
                    <p className="text-sm text-gray-500">{rental.guestName} • Room {rental.guestRoom}</p>
                  </div>
                  <Link 
                    to={`/water-sports/rental/${rental.id}/return`}
                    className="btn btn-primary btn-sm"
                  >
                    Return
                  </Link>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Due: {format(new Date(rental.expectedReturnTime), 'MMM d, h:mm a')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['overview', 'equipment', 'vessels'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment, vessels, asset codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          {activeTab === 'equipment' && (
            <div className="flex gap-2">
              <select
                value={equipmentFilter.type}
                onChange={(e) => setEquipmentFilter({ ...equipmentFilter, type: e.target.value })}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="kayak">Kayaks</option>
                <option value="paddleboard">Paddleboards</option>
                <option value="jetski">Jet Skis</option>
                <option value="snorkel">Snorkeling</option>
                <option value="diving">Diving</option>
              </select>
              <select
                value={equipmentFilter.status}
                onChange={(e) => setEquipmentFilter({ ...equipmentFilter, status: e.target.value })}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {equipLoading || vesselLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Equipment */}
          {(activeTab === 'overview' || activeTab === 'equipment') && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-primary-600" />
                Water Sports Equipment
              </h3>
              {filteredEquipment.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No equipment found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEquipment.map((item) => (
                    <div key={item.id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">{equipmentTypeLabels[item.equipmentType]}</p>
                          <p className="text-xs text-gray-400">{item.assetCode}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${equipmentStatusColors[item.status]}`}>
                          {equipmentStatusLabels[item.status]}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Location: {item.storageLocation}</p>
                        <p>Capacity: {item.capacity} people</p>
                        {item.rentalPricePerHour && (
                          <p>Rate: ${item.rentalPricePerHour}/hour</p>
                        )}
                        <p>Condition: {item.condition}</p>
                        {item.requiresLicense && (
                          <p className="text-yellow-600">⚠️ License required</p>
                        )}
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        {item.status === 'available' && (
                          <Link 
                            to={`/water-sports/rental?equipment=${item.id}`}
                            className="btn btn-primary btn-sm flex-1"
                          >
                            Rent Out
                          </Link>
                        )}
                        <Link 
                          to={`/water-sports/equipment/${item.id}`}
                          className="btn btn-secondary btn-sm flex-1"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vessels */}
          {(activeTab === 'overview' || activeTab === 'vessels') && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary-600" />
                Marine Vessels
              </h3>
              {filteredVessels.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No vessels found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVessels.map((vessel) => (
                    <div key={vessel.id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{vessel.name}</h4>
                          <p className="text-sm text-gray-500">{vesselTypeLabels[vessel.vesselType]}</p>
                          <p className="text-xs text-gray-400">{vessel.registrationNumber}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${vesselStatusColors[vessel.status]}`}>
                          {vesselStatusLabels[vessel.status]}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Length: {vessel.length}m • Capacity: {vessel.capacity} pax</p>
                        <p>Speed: {vessel.maxSpeed} knots</p>
                        <p>Fuel: {vessel.fuelType} • {vessel.fuelCapacity}L</p>
                        <p>Location: {vessel.currentLocation || vessel.mooringLocation}</p>
                        {vessel.captain && <p>Captain: {vessel.captain}</p>}
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        {vessel.status === 'operational' && (
                          <Link 
                            to={`/water-sports/trip/new?vessel=${vessel.id}`}
                            className="btn btn-primary btn-sm flex-1"
                          >
                            Schedule Trip
                          </Link>
                        )}
                        <Link 
                          to={`/water-sports/vessel/${vessel.id}`}
                          className="btn btn-secondary btn-sm flex-1"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
