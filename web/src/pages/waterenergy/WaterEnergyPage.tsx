import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, Zap, Sun, Wind, Plus, AlertTriangle, 
  TrendingUp, TrendingDown, Gauge, Beaker, ArrowRight
} from 'lucide-react';
import { useWaterTanks, useDesalinationUnits, useSolarInstallations, useWaterEnergyStats, useWaterEnergyAlerts } from '@/hooks/useWaterEnergy';
import { useAuthStore } from '@/stores/authStore';
import { tankTypeLabels, tankStatusColors, desalTechLabels, alertSeverityColors, alertTypeLabels, getTankLevelColor } from '@/types/waterenergy';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function WaterEnergyPage() {
  const { isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  
  const { data: tanks, isLoading: tanksLoading } = useWaterTanks(companyId);
  const { data: desalUnits, isLoading: desalLoading } = useDesalinationUnits(companyId);
  const { data: solarUnits, isLoading: solarLoading } = useSolarInstallations(companyId);
  const { data: stats } = useWaterEnergyStats(companyId);
  const { data: alerts } = useWaterEnergyAlerts(companyId, true);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'water' | 'energy'>('overview');

  const isLoading = tanksLoading || desalLoading || solarLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="h-8 w-8 text-primary-600" />
            Water & Energy Management
          </h1>
          <p className="text-gray-600 mt-1">Monitor water storage, desalination, and solar power systems</p>
        </div>
        <div className="flex gap-2">
          <Link to="/water-energy/reading" className="btn btn-secondary flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Record Reading
          </Link>
          <Link to="/water-energy/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Asset
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-blue-50">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Water Storage</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.waterPercentage}%
            </p>
            <p className="text-xs text-gray-500">
              {(stats.currentWaterLevel / 1000).toFixed(1)} / {(stats.totalWaterCapacity / 1000).toFixed(1)} m³
            </p>
          </div>
          <div className="card bg-cyan-50">
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-cyan-600" />
              <span className="text-sm text-gray-600">Desalination</span>
            </div>
            <p className="text-2xl font-bold text-cyan-700 mt-1">
              {(stats.currentDesalProduction / 1000).toFixed(1)} m³
            </p>
            <p className="text-xs text-gray-500">
              Today's production / {(stats.totalDailyDesalCapacity / 1000).toFixed(0)} m³/day capacity
            </p>
          </div>
          <div className="card bg-yellow-50">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Solar Power</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">
              {(stats.currentSolarProduction).toFixed(1)} kWh
            </p>
            <p className="text-xs text-gray-500">
              Today's generation / {(stats.totalSolarCapacity).toFixed(1)} kW capacity
            </p>
          </div>
          <div className="card bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">Alerts</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-1">{stats.lowTanks}</p>
            <p className="text-xs text-gray-500">
              {stats.lowTanks > 0 ? 'Tanks below 20%' : 'All tanks normal'}
            </p>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${alertSeverityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                  <span className="font-medium">{alert.assetName}</span>
                  <span className="text-sm text-gray-600">- {alertTypeLabels[alert.alertType]}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['overview', 'water', 'energy'] as const).map((tab) => (
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

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Water Tanks */}
          {(activeTab === 'overview' || activeTab === 'water') && tanks && tanks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                Water Storage Tanks ({tanks.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tanks.map((tank) => (
                  <div key={tank.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{tank.name}</h4>
                        <p className="text-sm text-gray-500">{tankTypeLabels[tank.tankType]}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${tankStatusColors[tank.status]}`}>
                        {tank.status}
                      </span>
                    </div>
                    
                    {/* Level Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Water Level</span>
                        <span className={`font-medium ${tank.percentageFull <= 20 ? 'text-red-600' : 'text-gray-900'}`}>
                          {tank.percentageFull}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getTankLevelColor(tank.percentageFull)}`}
                          style={{ width: `${tank.percentageFull}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {(tank.currentLevel / 1000).toFixed(1)} / {(tank.capacity / 1000).toFixed(1)} m³
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Location: {tank.location}</span>
                      <Link 
                        to={`/water-energy/tank/${tank.id}`}
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        Details <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desalination Units */}
          {(activeTab === 'overview' || activeTab === 'water') && desalUnits && desalUnits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Beaker className="h-5 w-5 text-cyan-600" />
                Desalination Units ({desalUnits.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {desalUnits.map((unit) => (
                  <div key={unit.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                        <p className="text-sm text-gray-500">{desalTechLabels[unit.technology]}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        unit.status === 'running' ? 'bg-green-100 text-green-800' :
                        unit.status === 'standby' ? 'bg-blue-100 text-blue-800' :
                        unit.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {unit.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span>{(unit.capacity / 1000).toFixed(0)} m³/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Today's Production:</span>
                        <span className="font-medium">{(unit.dailyProduction / 1000).toFixed(1)} m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">TDS Output:</span>
                        <span className={unit.tdsOutput > 500 ? 'text-yellow-600' : 'text-green-600'}>
                          {unit.tdsOutput} ppm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Power:</span>
                        <span>{unit.powerConsumption} kW • {unit.energySource}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solar Installations */}
          {(activeTab === 'overview' || activeTab === 'energy') && solarUnits && solarUnits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-600" />
                Solar Power Systems ({solarUnits.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {solarUnits.map((solar) => (
                  <div key={solar.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{solar.name}</h4>
                        <p className="text-sm text-gray-500">{solar.systemType}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        solar.status === 'operational' ? 'bg-green-100 text-green-800' :
                        solar.status === 'fault' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {solar.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span>{solar.totalCapacity} kW ({solar.panelCount} panels)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Today's Generation:</span>
                        <span className="font-medium text-yellow-600">{solar.dailyProduction} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Output:</span>
                        <span>{solar.currentOutput} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Efficiency:</span>
                        <span>{solar.efficiency}%</span>
                      </div>
                      {solar.batteryStorage && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Battery Storage:</span>
                          <span>{solar.batteryStorage} kWh</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
