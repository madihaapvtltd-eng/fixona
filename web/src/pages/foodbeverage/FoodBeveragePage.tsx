import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Utensils, ChefHat, Wine, Plus, Thermometer, 
  TrendingUp, Users, AlertCircle, DollarSign,
  ArrowRight, Package
} from 'lucide-react';
import { useKitchenAssets, useRestaurantOutlets, useFBInventory, useFBStats } from '@/hooks/useFoodBeverage';
import { useAuthStore } from '@/stores/authStore';
import { 
  kitchenAssetTypeLabels, outletTypeLabels, inventoryCategoryLabels 
} from '@/types/foodbeverage';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function FoodBeveragePage() {
  const { isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'kitchen' | 'inventory'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { data: assets, isLoading: assetsLoading } = useKitchenAssets(companyId);
  const { data: outlets, isLoading: outletsLoading } = useRestaurantOutlets(companyId);
  const { data: inventory, isLoading: inventoryLoading } = useFBInventory(companyId, selectedCategory === 'all' ? undefined : selectedCategory);
  const { data: stats } = useFBStats(companyId);

  const isLoading = assetsLoading || outletsLoading || inventoryLoading;

  // Filter assets with temperature issues
  const tempAlertAssets = assets?.filter(a => {
    if (!a.currentTemp || !a.targetTempMin || !a.targetTempMax) return false;
    return a.currentTemp < a.targetTempMin || a.currentTemp > a.targetTempMax;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="h-8 w-8 text-primary-600" />
            Food & Beverage
          </h1>
          <p className="text-gray-600 mt-1">Manage kitchen equipment, outlets, inventory, and daily operations</p>
        </div>
        <div className="flex gap-2">
          <Link to="/food-beverage/daily-log" className="btn btn-secondary flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Daily Log
          </Link>
          <Link to="/food-beverage/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Asset
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-green-50">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Kitchen Assets</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.operationalAssets}/{stats.totalAssets}</p>
            <p className="text-xs text-gray-500">Operational</p>
          </div>
          <div className="card bg-blue-50">
            <div className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Outlets Open</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.openOutlets}/{stats.totalOutlets}</p>
            <p className="text-xs text-gray-500">Restaurants & Bars</p>
          </div>
          <div className="card bg-yellow-50">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Today's Revenue</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">${stats.todayRevenue?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{stats.todayCovers} covers</p>
          </div>
          <div className="card bg-purple-50">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">Inventory Value</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-1">${stats.inventoryValue?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{stats.inventoryItems} items</p>
          </div>
        </div>
      )}

      {/* Temperature Alerts */}
      {tempAlertAssets.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-3">
            <Thermometer className="h-5 w-5" />
            Temperature Alerts ({tempAlertAssets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tempAlertAssets.map((asset) => (
              <div key={asset.id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.location}</p>
                  </div>
                  <span className={`text-lg font-bold ${
                    asset.currentTemp && asset.targetTempMax && asset.currentTemp > asset.targetTempMax 
                      ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {asset.currentTemp}°C
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Target: {asset.targetTempMin}°C - {asset.targetTempMax}°C
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['overview', 'kitchen', 'inventory'] as const).map((tab) => (
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
          {/* Outlets */}
          {(activeTab === 'overview' || activeTab === 'kitchen') && outlets && outlets.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wine className="h-5 w-5 text-primary-600" />
                Restaurant Outlets ({outlets.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outlets.map((outlet) => (
                  <div key={outlet.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{outlet.name}</h4>
                        <p className="text-sm text-gray-500">{outletTypeLabels[outlet.outletType]}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        outlet.status === 'open' ? 'bg-green-100 text-green-800' :
                        outlet.status === 'closed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {outlet.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Location: {outlet.location}</p>
                      <p>Hours: {outlet.openingTime} - {outlet.closingTime}</p>
                      <p>Capacity: {outlet.seatingCapacity} seats</p>
                      {outlet.manager && <p>Manager: {outlet.manager}</p>}
                      {outlet.headChef && <p>Head Chef: {outlet.headChef}</p>}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Link 
                        to={`/food-beverage/outlet/${outlet.id}/log`}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        Daily Log
                      </Link>
                      <Link 
                        to={`/food-beverage/outlet/${outlet.id}`}
                        className="btn btn-secondary btn-sm flex-1"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kitchen Assets */}
          {(activeTab === 'overview' || activeTab === 'kitchen') && assets && assets.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary-600" />
                Kitchen Equipment ({assets.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                        <p className="text-sm text-gray-500">{kitchenAssetTypeLabels[asset.assetType]}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        asset.status === 'operational' ? 'bg-green-100 text-green-800' :
                        asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {asset.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Location: {asset.location}</p>
                      {asset.currentTemp && asset.targetTempMin && (
                        <p className={asset.currentTemp < asset.targetTempMin || asset.currentTemp > (asset.targetTempMax || 999) ? 'text-red-600 font-medium' : ''}>
                          Temp: {asset.currentTemp}°C (Target: {asset.targetTempMin}-{asset.targetTempMax}°C)
                        </p>
                      )}
                      {asset.lastServiceDate && (
                        <p>Last Service: {format(new Date(asset.lastServiceDate), 'MMM d, yyyy')}</p>
                      )}
                      {asset.nextServiceDue && (
                        <p>Next Due: {format(new Date(asset.nextServiceDue), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      {asset.targetTempMin && (
                        <Link 
                          to={`/food-beverage/asset/${asset.id}/temp`}
                          className="btn btn-secondary btn-sm flex-1"
                        >
                          <Thermometer className="h-4 w-4" />
                          Record Temp
                        </Link>
                      )}
                      <Link 
                        to={`/food-beverage/asset/${asset.id}`}
                        className="btn btn-secondary btn-sm flex-1"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory */}
          {activeTab === 'inventory' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary-600" />
                  Inventory ({inventory?.length || 0} items)
                </h3>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input w-48"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(inventoryCategoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              {inventory && inventory.length > 0 ? (
                <div className="card overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inventory.map((item) => {
                        const isLow = item.currentStock <= item.reorderPoint;
                        return (
                          <tr key={item.id} className={isLow ? 'bg-red-50' : ''}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.storageLocation}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{inventoryCategoryLabels[item.category]}</td>
                            <td className="px-4 py-3">
                              <span className={`font-medium ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                                {item.currentStock}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">/ {item.maxStock}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">${item.totalValue?.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {isLow ? 'Low Stock' : 'OK'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No inventory items found</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
