import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Fuel, Search, Filter, CheckCircle, XCircle, Clock, Car, Gauge, DollarSign, User, Printer } from 'lucide-react';
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
  previousPersonName?: string;
  newPersonName?: string;
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

  const handlePrintSlip = (req: FuelRequest) => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups to print.');
      return;
    }

    const safe = (value: unknown) => {
      if (value === undefined || value === null) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const money = (value: unknown) => {
      const num = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(num)) return `MVR ${num.toLocaleString()}`;
      return 'MVR 0';
    };

    const dateLabel = (value: string) => {
      if (!value) return '';
      const dt = new Date(value);
      if (Number.isNaN(dt.getTime())) return safe(value);
      return format(dt, 'MMM d, yyyy');
    };

    const html = `
      <html>
        <head>
          <title>Fuel Slip - ${safe(req.vehicleCode)}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
            .page { padding: 24px; }
            .slip { max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
            .title { display: flex; justify-content: space-between; align-items: start; gap: 12px; }
            .title h1 { margin: 0; font-size: 18px; }
            .muted { color: #6b7280; font-size: 12px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; background: #f3f4f6; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
            .row { border-top: 1px dashed #e5e7eb; margin-top: 16px; padding-top: 16px; }
            .kv { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; }
            .k { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
            .v { font-size: 14px; font-weight: 600; word-break: break-word; }
            .v.normal { font-weight: 500; }
            .big { font-size: 18px; }
            .actions { margin-top: 16px; display: flex; justify-content: center; }
            button { padding: 10px 16px; border-radius: 10px; border: 1px solid #e5e7eb; background: #111827; color: white; cursor: pointer; }
            @media print {
              .actions { display: none; }
              body { margin: 0; }
              .page { padding: 0; }
              .slip { border: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="slip">
              <div class="title">
                <div>
                  <h1>Fuel Request Slip</h1>
                  <div class="muted">Printed: ${safe(format(new Date(), 'MMM d, yyyy p'))}</div>
                </div>
                <div class="badge">${safe(req.status?.toUpperCase?.() ? req.status.toUpperCase() : req.status)}</div>
              </div>

              <div class="grid">
                <div class="kv">
                  <div class="k">Vehicle</div>
                  <div class="v">${safe(req.vehicleName)}</div>
                  <div class="muted">${safe(req.vehicleCode)}${req.vehicleCategory ? ` • ${safe(req.vehicleCategory)}` : ''}</div>
                </div>
                <div class="kv">
                  <div class="k">Fuel Type</div>
                  <div class="v">${safe(req.fuelType)}</div>
                  <div class="muted">${req.liters ? `${safe(req.liters)} L` : ''}</div>
                </div>
              </div>

              <div class="row">
                <div class="grid">
                  <div class="kv">
                    <div class="k">Previous Odometer</div>
                    <div class="v big">${safe(req.previousOdometer?.toLocaleString?.() ? req.previousOdometer.toLocaleString() : req.previousOdometer)} km</div>
                  </div>
                  <div class="kv">
                    <div class="k">Current Odometer</div>
                    <div class="v big">${safe(req.currentOdometer?.toLocaleString?.() ? req.currentOdometer.toLocaleString() : req.currentOdometer)} km</div>
                  </div>
                  <div class="kv" style="grid-column: 1 / -1;">
                    <div class="k">Total KM</div>
                    <div class="v big">+${safe(req.totalKm?.toLocaleString?.() ? req.totalKm.toLocaleString() : req.totalKm)} km</div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="grid">
                  <div class="kv">
                    <div class="k">Last Filled Date</div>
                    <div class="v normal">${safe(dateLabel(req.lastFilledDate))}</div>
                  </div>
                  <div class="kv">
                    <div class="k">Current Fill Date</div>
                    <div class="v normal">${safe(dateLabel(req.currentDate))}</div>
                  </div>
                  <div class="kv" style="grid-column: 1 / -1;">
                    <div class="k">Amount</div>
                    <div class="v big">${safe(money(req.amountMVR))}</div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="grid">
                  <div class="kv">
                    <div class="k">Requested By</div>
                    <div class="v normal">${safe(req.requestedBy)}</div>
                  </div>
                  <div class="kv">
                    <div class="k">Person Transfer</div>
                    <div class="v normal">${safe(req.previousPersonName || '')}${req.previousPersonName && req.newPersonName ? ' → ' : ''}${safe(req.newPersonName || '')}</div>
                  </div>
                </div>
              </div>

              ${req.notes ? `
                <div class="row">
                  <div class="kv">
                    <div class="k">Notes</div>
                    <div class="v normal">${safe(req.notes)}</div>
                  </div>
                </div>
              ` : ''}

              <div class="actions">
                <button onclick="window.print()">Print</button>
              </div>
            </div>
          </div>

          <script>
            setTimeout(() => { try { window.print(); } catch(e) {} }, 250);
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const { user, getCompanyId, isSuperAdmin } = useAuthStore();
  const companyId = getCompanyId();

  const { data: requests, isLoading, refetch } = useQuery(['fuelRequests', companyId], async () => {
    let q;
    if (isSuperAdmin() && !companyId) {
      q = query(collection(db, 'fuel_requests'), orderBy('createdAt', 'desc'));
    } else if (companyId) {
      q = query(
        collection(db, 'fuel_requests'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    } else {
      return [];
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) })) as FuelRequest[];
  }, {
    enabled: !!user && (!!companyId || isSuperAdmin()),
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

                    <button
                      onClick={() => handlePrintSlip(req)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="Print Slip"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    
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
                  {(req.previousPersonName || req.newPersonName) && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {req.previousPersonName && <span>From: {req.previousPersonName}</span>}
                      {req.previousPersonName && req.newPersonName && <span> → </span>}
                      {req.newPersonName && <span>To: {req.newPersonName}</span>}
                    </div>
                  )}
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
