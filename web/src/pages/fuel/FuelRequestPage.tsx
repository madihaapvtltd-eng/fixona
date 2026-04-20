import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Fuel, Calendar, Gauge, DollarSign, Car, User, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Vehicle {
  id: string;
  name: string;
  assetCode: string;
  type: string;
  vehicleCategory?: string;
  currentOdometer?: number;
}

interface FuelRequest {
  id?: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCode: string;
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

export function FuelRequestPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [lastRequest, setLastRequest] = useState<FuelRequest | null>(null);
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    previousOdometer: 0,
    currentOdometer: 0,
    totalKm: 0,
    lastFilledDate: '',
    currentDate: format(new Date(), 'yyyy-MM-dd'),
    amountMVR: 0,
    liters: 0,
    fuelType: 'petrol' as 'petrol' | 'diesel' | 'other',
    previousPersonName: '',
    newPersonName: '',
    notes: '',
  });

  // Load vehicles (only vehicle and machinery types) - with company filter
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        // CRITICAL: Filter by company for data isolation
        const { getCompanyId, isSuperAdmin } = useAuthStore.getState();
        const companyId = getCompanyId();
        
        let assetsQuery;
        if (isSuperAdmin() && !companyId) {
          assetsQuery = collection(db, 'assets');
        } else if (companyId) {
          assetsQuery = query(collection(db, 'assets'), where('companyId', '==', companyId));
        } else {
          setVehicles([]);
          return;
        }
        
        const snap = await getDocs(assetsQuery);
        const allAssets = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Vehicle[];
        
        // Filter for vehicle and machinery types
        const vehicleList = allAssets.filter(a => 
          a.type === 'vehicle' || a.type === 'machinery'
        );
        
        setVehicles(vehicleList);
      } catch (error) {
        console.error('Failed to load vehicles:', error);
        toast.error('Failed to load vehicles');
      }
    };
    loadVehicles();
  }, []);

  // Load last fuel request for selected vehicle
  useEffect(() => {
    if (!formData.vehicleId) {
      setLastRequest(null);
      setFormData(prev => ({
        ...prev,
        previousOdometer: 0,
        lastFilledDate: '',
        totalKm: 0
      }));
      return;
    }

    const loadLastRequest = async () => {
      try {
        const q = query(
          collection(db, 'fuel_requests'),
          where('vehicleId', '==', formData.vehicleId),
          where('status', 'in', ['completed', 'approved']),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const lastReq = snap.docs[0].data() as FuelRequest;
          setLastRequest(lastReq);
          setFormData(prev => ({
            ...prev,
            previousOdometer: lastReq.currentOdometer || 0,
            lastFilledDate: lastReq.currentDate || '',
            totalKm: prev.currentOdometer - (lastReq.currentOdometer || 0)
          }));
        } else {
          // No previous request, try to get from vehicle record
          const vehicle = vehicles.find(v => v.id === formData.vehicleId);
          if (vehicle?.currentOdometer) {
            setFormData(prev => ({
              ...prev,
              previousOdometer: vehicle.currentOdometer || 0,
              totalKm: prev.currentOdometer - (vehicle.currentOdometer || 0)
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load last request:', error);
      }
    };
    loadLastRequest();
  }, [formData.vehicleId, vehicles]);

  // Calculate total KM when current odometer changes
  useEffect(() => {
    const total = formData.currentOdometer - formData.previousOdometer;
    setFormData(prev => ({ ...prev, totalKm: total > 0 ? total : 0 }));
  }, [formData.currentOdometer, formData.previousOdometer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }
    
    if (formData.currentOdometer <= formData.previousOdometer) {
      toast.error('Current odometer must be greater than previous odometer');
      return;
    }

    setLoading(true);
    try {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      
      await addDoc(collection(db, 'fuel_requests'), {
        vehicleId: formData.vehicleId,
        vehicleName: selectedVehicle?.name || '',
        vehicleCode: selectedVehicle?.assetCode || '',
        vehicleCategory: selectedVehicle?.vehicleCategory || '',
        previousOdometer: formData.previousOdometer,
        currentOdometer: formData.currentOdometer,
        totalKm: formData.totalKm,
        lastFilledDate: formData.lastFilledDate,
        currentDate: formData.currentDate,
        amountMVR: formData.amountMVR,
        liters: formData.liters,
        fuelType: formData.fuelType,
        previousPersonName: formData.previousPersonName,
        newPersonName: formData.newPersonName,
        requestedBy: user?.name || user?.email || 'Unknown',
        requestedById: user?.id || '',
        notes: formData.notes,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update vehicle's current odometer
      await addDoc(collection(db, 'assets', formData.vehicleId, 'odometer_readings'), {
        reading: formData.currentOdometer,
        date: formData.currentDate,
        fuelRequest: true,
        createdAt: serverTimestamp(),
      });

      toast.success('Fuel request submitted successfully');
      navigate('/fuel-requests');
    } catch (error) {
      console.error('Failed to submit fuel request:', error);
      toast.error('Failed to submit fuel request');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/fuel-requests" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Fuel Request</h1>
          <p className="text-sm text-gray-500">Request fuel for company vehicles</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* Vehicle Selection */}
        <div>
          <label className="label flex items-center gap-2">
            <Car className="h-4 w-4" />
            Select Vehicle *
          </label>
          <select
            required
            className="input"
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
          >
            <option value="">Choose a vehicle...</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.assetCode} - {vehicle.name} ({vehicle.vehicleCategory || vehicle.type})
              </option>
            ))}
          </select>
        </div>

        {selectedVehicle && (
          <div className="p-4 bg-blue-50 rounded-xl">
            <h3 className="font-semibold text-blue-900 mb-2">Selected Vehicle</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Name:</span>
                <p className="font-medium">{selectedVehicle.name}</p>
              </div>
              <div>
                <span className="text-blue-600">Code:</span>
                <p className="font-medium">{selectedVehicle.assetCode}</p>
              </div>
              <div>
                <span className="text-blue-600">Type:</span>
                <p className="font-medium capitalize">{selectedVehicle.vehicleCategory || selectedVehicle.type}</p>
              </div>
            </div>
          </div>
        )}

        {/* Odometer Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Odometer Readings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Previous Odometer */}
            <div>
              <label className="label">Previous Odometer (km) *</label>
              <input
                type="number"
                required
                min="0"
                className="input bg-gray-50"
                value={formData.previousOdometer || ''}
                onChange={(e) => setFormData({ ...formData, previousOdometer: Number(e.target.value) })}
                placeholder="Previous reading"
              />
              {lastRequest && (
                <p className="text-xs text-gray-500 mt-1">
                  Last recorded: {format(new Date(lastRequest.currentDate), 'MMM d, yyyy')}
                </p>
              )}
            </div>

            {/* Current Odometer */}
            <div>
              <label className="label">Current Odometer (km) *</label>
              <input
                type="number"
                required
                min={formData.previousOdometer + 1}
                className="input"
                value={formData.currentOdometer || ''}
                onChange={(e) => setFormData({ ...formData, currentOdometer: Number(e.target.value) })}
                placeholder="Current reading"
              />
            </div>
          </div>

          {/* Total KM (Auto-calculated) */}
          <div className="mt-4 p-4 bg-green-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-green-800 font-medium">Total Distance Traveled:</span>
              <span className="text-2xl font-bold text-green-600">
                {formData.totalKm.toLocaleString()} km
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              {formData.currentOdometer} - {formData.previousOdometer} = {formData.totalKm} km
            </p>
          </div>
        </div>

        {/* Dates Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fuel Fill Dates
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Last Filled Date</label>
              <input
                type="date"
                className="input"
                value={formData.lastFilledDate}
                onChange={(e) => setFormData({ ...formData, lastFilledDate: e.target.value })}
              />
              {formData.lastFilledDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(formData.lastFilledDate), 'MMMM d, yyyy')}
                </p>
              )}
            </div>

            <div>
              <label className="label">Current Fill Date *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.currentDate}
                onChange={(e) => setFormData({ ...formData, currentDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Person Names Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Person Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Previous Person Name</label>
              <input
                type="text"
                className="input"
                value={formData.previousPersonName}
                onChange={(e) => setFormData({ ...formData, previousPersonName: e.target.value })}
                placeholder="Who had the vehicle before?"
              />
            </div>

            <div>
              <label className="label">New Person Name</label>
              <input
                type="text"
                className="input"
                value={formData.newPersonName}
                onChange={(e) => setFormData({ ...formData, newPersonName: e.target.value })}
                placeholder="Who has the vehicle now?"
              />
            </div>
          </div>
        </div>

        {/* Fuel Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Fuel Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount (MVR) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="input"
                value={formData.amountMVR || ''}
                onChange={(e) => setFormData({ ...formData, amountMVR: Number(e.target.value) })}
                placeholder="Enter amount in MVR"
              />
            </div>

            <div>
              <label className="label">Liters (Optional)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="input"
                value={formData.liters || ''}
                onChange={(e) => setFormData({ ...formData, liters: Number(e.target.value) })}
                placeholder="Liters filled"
              />
            </div>

            <div>
              <label className="label">Fuel Type *</label>
              <select
                required
                className="input"
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as 'petrol' | 'diesel' | 'other' })}
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t pt-6">
          <label className="label flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            className="input"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional information..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6 border-t">
          <Link to="/fuel-requests" className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-300 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Fuel Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
