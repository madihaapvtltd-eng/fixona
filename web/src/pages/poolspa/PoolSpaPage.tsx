import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Waves, Plus, Search, Filter, RefreshCw, 
  Thermometer, AlertTriangle, CheckCircle2, 
  Beaker, Calendar, ArrowRight
} from 'lucide-react';
import { usePoolSpaAssets, usePoolAlerts, useTodayWaterTests } from '@/hooks/usePoolSpa';
import { useAuthStore } from '@/stores/authStore';
import { 
  assetTypeLabels, assetStatusLabels, assetStatusColors,
  waterQualityStandards, getWaterQualityStatus 
} from '@/types/poolspa';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function PoolSpaPage() {
  const { isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  
  const { data: assets, isLoading } = usePoolSpaAssets(companyId);
  const { data: alerts } = usePoolAlerts(companyId, true);
  const { data: todayTests } = useTodayWaterTests(companyId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const assetAlerts = (assetId: string) => alerts?.filter(a => a.assetId === assetId) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Waves className="h-8 w-8 text-primary-600" />
            Pool & Spa Management
          </h1>
          <p className="text-gray-600 mt-1">Monitor water quality, schedule maintenance, ensure guest safety</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/pool-spa/water-test"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Beaker className="h-4 w-4" />
            Record Water Test
          </Link>
          <Link
            to="/pool-spa/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-green-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Operational</span>
          </div>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {assets?.filter(a => a.status === 'operational').length || 0}
          </p>
        </div>
        <div className="card bg-blue-50">
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Tests Today</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{todayTests?.length || 0}</p>
        </div>
        <div className="card bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-600">Alerts</span>
          </div>
          <p className="text-2xl font-bold text-red-700 mt-1">{alerts?.length || 0}</p>
        </div>
        <div className="card bg-orange-50">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-gray-600">Target Temp</span>
          </div>
          <p className="text-2xl font-bold text-orange-700 mt-1">26-30°C</p>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5" />
            Active Water Quality Alerts
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <span className="font-medium">{alert.assetName}</span>
                  <span className="text-sm text-gray-600">- {alert.message}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                </span>
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
              placeholder="Search pools, spas, locations..."
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
              <option value="main-pool">Main Pool</option>
              <option value="infinity-pool">Infinity Pool</option>
              <option value="kids-pool">Kids Pool</option>
              <option value="private-pool">Private Pool</option>
              <option value="jacuzzi">Jacuzzi</option>
              <option value="spa">Spa</option>
              <option value="steam-room">Steam Room</option>
              <option value="sauna">Sauna</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className="btn btn-secondary"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="card text-center py-12">
          <Waves className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No pool or spa assets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const assetAlertList = assetAlerts(asset.id!);
            const hasAlerts = assetAlertList.length > 0;
            
            return (
              <div key={asset.id} className={`card hover:shadow-md transition-shadow ${hasAlerts ? 'border-red-200' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{assetTypeLabels[asset.type]}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${assetStatusColors[asset.status]}`}>
                    {assetStatusLabels[asset.status]}
                  </span>
                </div>

                {hasAlerts && (
                  <div className="mb-3 p-2 bg-red-50 rounded">
                    <p className="text-sm text-red-700 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {assetAlertList.length} active alert{assetAlertList.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Location:</span>
                    <span>{asset.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Water Source:</span>
                    <span className="capitalize">{asset.waterSource}</span>
                  </div>
                  {asset.volumeLiters && (
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Volume:</span>
                      <span>{(asset.volumeLiters / 1000).toFixed(1)} m³</span>
                    </div>
                  )}
                  {asset.lastSafetyInspection && (
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Last Inspection:</span>
                      <span>{format(new Date(asset.lastSafetyInspection), 'MMM d')}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/pool-spa/${asset.id}/water-test`}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    <Beaker className="h-4 w-4" />
                    Test Water
                  </Link>
                  <Link
                    to={`/pool-spa/${asset.id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    Details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Water Quality Standards Reference */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Beaker className="h-5 w-5" />
          Water Quality Standards (WHO/FDA Guidelines)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-gray-600">pH Level</p>
            <p className="font-semibold">7.2 - 7.8</p>
            <p className="text-xs text-gray-500">Ideal: 7.4</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-gray-600">Chlorine</p>
            <p className="font-semibold">1.0 - 3.0 ppm</p>
            <p className="text-xs text-gray-500">Ideal: 1.5 ppm</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-gray-600">Alkalinity</p>
            <p className="font-semibold">80 - 120 ppm</p>
            <p className="text-xs text-gray-500">Ideal: 100 ppm</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-gray-600">Temperature</p>
            <p className="font-semibold">26 - 30°C</p>
            <p className="text-xs text-gray-500">Tropical standard</p>
          </div>
        </div>
      </div>
    </div>
  );
}
