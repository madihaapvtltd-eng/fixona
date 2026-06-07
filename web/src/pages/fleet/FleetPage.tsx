import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, Plus, Search, Fuel, Wrench, Users, 
  CheckCircle2, AlertCircle, Clock, TrendingUp,
  ArrowRight, Navigation
} from 'lucide-react';
import { useVehicles, useActiveTrips, useDrivers, useFleetStats } from '@/hooks/useFleet';
import { useAuthStore } from '@/stores/authStore';
import { 
  vehicleTypeLabels, vehicleStatusLabels, vehicleStatusColors,
  tripStatusLabels, tripStatusColors
} from '@/types/fleet';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function FleetPage() {
  const { isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles(companyId, {
    type: typeFilter === 'all' ? undefined : typeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { data: activeTrips, isLoading: tripsLoading } = useActiveTrips(companyId);
  const { data: drivers, isLoading: driversLoading } = useDrivers(companyId);
  const { data: stats } = useFleetStats(companyId);

  const isLoading = vehiclesLoading || tripsLoading || driversLoading;

  const filteredVehicles = vehicles?.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="h-8 w-8 text-primary-600" />
            Fleet Management
          </h1>
          <p className="text-gray-600 mt-1">Track vehicles, trips, fuel, and maintenance</p>
        </div>
        <div className="flex gap-2">
          <Link to="/fleet/trip/new" className="btn btn-secondary flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            New Trip
          </Link>
          <Link to="/fleet/fuel-log" className="btn btn-secondary flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Fuel Log
          </Link>
          <Link to="/fleet/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
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
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.availableVehicles}</p>
            <p className="text-xs text-gray-500">Ready to use</p>
          </div>
          <div className="card bg-blue-50">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Active Trips</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.activeTrips}</p>
            <p className="text-xs text-gray-500">In progress</p>
          </div>
          <div className="card bg-yellow-50">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Maintenance</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.maintenanceVehicles}</p>
            <p className="text-xs text-gray-500">In service</p>
          </div>
          <div className="card bg-purple-50">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">Today's Fuel</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-1">${stats.todayFuelCost?.toFixed(0)}</p>
            <p className="text-xs text-gray-500">
              {stats.avgKmPerLiter?.toFixed(1)} km/L avg
            </p>
          </div>
        </div>
      )}

      {/* Active Trips */}
      {activeTrips && activeTrips.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5" />
            Active Trips ({activeTrips.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTrips.map((trip) => (
              <div key={trip.id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{trip.vehicleName}</p>
                    <p className="text-sm text-gray-500">{trip.driverName}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${tripStatusColors[trip.status]}`}>
                    {tripStatusLabels[trip.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {trip.startLocation} → {trip.destination}
                </p>
                {trip.guestName && (
                  <p className="text-xs text-gray-500">Guest: {trip.guestName}</p>
                )}
                {trip.status === 'in-progress' && (
                  <Link 
                    to={`/fleet/trip/${trip.id}/complete`}
                    className="mt-2 btn btn-primary btn-sm w-full"
                  >
                    Complete Trip
                  </Link>
                )}
              </div>
            ))}
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
              placeholder="Search vehicles, registration, make..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Types</option>
              <option value="car">Cars</option>
              <option value="van">Vans</option>
              <option value="truck">Trucks</option>
              <option value="bus">Buses</option>
              <option value="golf-cart">Golf Carts</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No vehicles found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{vehicle.name}</h4>
                  <p className="text-sm text-gray-500">{vehicleTypeLabels[vehicle.vehicleType]}</p>
                  <p className="text-xs text-gray-400">{vehicle.registrationNumber}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${vehicleStatusColors[vehicle.status]}`}>
                  {vehicleStatusLabels[vehicle.status]}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p>{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                <p>Color: {vehicle.color} • Capacity: {vehicle.capacity} pax</p>
                <p>Mileage: {vehicle.currentMileage?.toLocaleString()} km</p>
                <p>Location: {vehicle.currentLocation || vehicle.homeLocation}</p>
                {vehicle.assignedDriver && <p>Driver: {vehicle.assignedDriver}</p>}
              </div>
              
              <div className="mt-4 flex gap-2">
                {vehicle.status === 'available' && (
                  <Link 
                    to={`/fleet/trip/new?vehicle=${vehicle.id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <Navigation className="h-4 w-4" />
                    Trip
                  </Link>
                )}
                <Link 
                  to={`/fleet/vehicle/${vehicle.id}/fuel`}
                  className="btn btn-secondary btn-sm"
                >
                  <Fuel className="h-4 w-4" />
                </Link>
                <Link 
                  to={`/fleet/vehicle/${vehicle.id}`}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/fleet/drivers" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Drivers</h3>
              <p className="text-sm text-gray-500">{drivers?.length || 0} registered drivers</p>
            </div>
          </div>
        </Link>
        
        <Link to="/fleet/maintenance" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Maintenance</h3>
              <p className="text-sm text-gray-500">Service history & schedules</p>
            </div>
          </div>
        </Link>
        
        <Link to="/fleet/reports" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reports</h3>
              <p className="text-sm text-gray-500">Fleet analytics & costs</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
