import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Fuel, Search, Filter, CheckCircle, XCircle, Clock, Car, Gauge, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface FuelRequest {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCode: string;
  vehicleCategory?: string;
  previousOdometer: number;
  currentOdometer: number;
  totalKm: number;
  lastFilledDate: string;
  currentDate: string;
  amountMVR: number;
  liters?: number;
  fuelType: 'petrol' | 'diesel' | 'other';
  requestedBy: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: any;
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
  completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
};

const fuelTypeConfig = {
  petrol: { color: 'bg-red-100 text-red-700', label: 'Petrol' },
  diesel: { color: 'bg-amber-100 text-amber-700', label: 'Diesel' },
  other: { color: 'bg-gray-100 text-gray-700', label: 'Other' },
};

export function FuelRequestsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: requests, isLoading, refetch } = useQuery('fuelRequests', async () => {
    const q = query(collection(db, 'fuel_requests'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as FuelRequest[];
  });

  const filteredRequests = requests?.filter(req => {
    const matchesSearch = 
      req.vehicleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.vehicleCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedBy?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    setUpdating(id);
    try {
      await updateDoc(doc(db, 'fuel_requests', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Request ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const totalAmount = filteredRequests?.reduce((sum, req) => sum + (req.amountMVR || 0), 0) || 0;
  const totalKm = filteredRequests?.reduce((sum, req) => sum + (req.totalKm || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Requests</h1>
          <p className="text-sm text-gray-500">Manage vehicle fuel requests and odometer tracking</p>
        </div>
        <Link 
          to="/fuel-requests/new" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Fuel Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Fuel className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-xl font-bold">{filteredRequests?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-bold">MVR {totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Gauge className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total KM</p>
              <p className="text-xl font-bold">{totalKm.toLocaleString()} km</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, code, or requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="p-8 text-center">Loading...</div>
      ) : filteredRequests?.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <Fuel className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No fuel requests found</p>
          <Link 
            to="/fuel-requests/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const status = statusConfig[req.status];
            const fuelType = fuelTypeConfig[req.fuelType];
            const StatusIcon = status.icon;
            
            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Vehicle Info */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Car className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{req.vehicleName}</h3>
                      <p className="text-sm text-gray-500">{req.vehicleCode}</p>
                      {req.vehicleCategory && (
                        <p className="text-xs text-gray-400 capitalize">{req.vehicleCategory}</p>
                      )}
                    </div>
                  </div>

                  {/* Odometer Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Previous</p>
                      <p className="font-medium">{req.previousOdometer?.toLocaleString()} km</p>
                    </div>
                    <div className="text-gray-300">→</div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Current</p>
                      <p className="font-medium">{req.currentOdometer?.toLocaleString()} km</p>
                    </div>
                    <div className="px-3 py-1 bg-green-50 rounded-lg">
                      <p className="text-green-700 font-semibold">+{req.totalKm?.toLocaleString()} km</p>
                    </div>
                  </div>

                  {/* Amount & Fuel Type */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">MVR {req.amountMVR?.toLocaleString()}</p>
                      {req.liters && <p className="text-sm text-gray-500">{req.liters} L</p>}
                    </div>
                    <span className={`badge ${fuelType.color}`}>
                      {fuelType.label}
                    </span>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    <span className={`badge ${status.color} flex items-center gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                    
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(req.id, 'approved')}
                          disabled={updating === req.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(req.id, 'rejected')}
                          disabled={updating === req.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    {req.status === 'approved' && (
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'completed')}
                        disabled={updating === req.id}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {req.requestedBy}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Fill Date:</span>
                    <span className="font-medium">{format(new Date(req.currentDate), 'MMM d, yyyy')}</span>
                  </div>
                  {req.lastFilledDate && (
                    <div className="flex items-center gap-1">
                      <span>Last Fill:</span>
                      <span className="font-medium">{format(new Date(req.lastFilledDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {req.notes && (
                    <div className="w-full text-gray-400 italic">
                      Note: {req.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
