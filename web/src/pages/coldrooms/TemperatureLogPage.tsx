import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useColdRooms, useLogTemperature } from '@/hooks/useColdRooms';
import { useAuthStore } from '@/stores/authStore';
import { Modal } from '@/components/ui/Modal';
import type { ColdRoomAsset } from '@/types/coldroom';
import { CHECK_TIMES, isTempInRange } from '@/types/coldroom';
import { 
  Thermometer, ArrowLeft, Clock, Camera, AlertTriangle, 
  CheckCircle, Snowflake, Building2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface TemperatureFormData {
  coldRoomId: string;
  checkTime: 'morning' | 'midday' | 'evening';
  temperature: string;
  humidity: string;
  recordedBy: string;
  
  // Visual checks
  doorSealOk: boolean;
  condenserClean: boolean;
  interiorClean: boolean;
  noIceBuildup: boolean;
  lightsWorking: boolean;
  compressorRunning: boolean;
  
  // Issues
  issuesFound: boolean;
  issueDescription: string;
  actionTaken: string;
}

const initialFormData: TemperatureFormData = {
  coldRoomId: '',
  checkTime: 'morning',
  temperature: '',
  humidity: '',
  recordedBy: '',
  doorSealOk: true,
  condenserClean: true,
  interiorClean: true,
  noIceBuildup: true,
  lightsWorking: true,
  compressorRunning: true,
  issuesFound: false,
  issueDescription: '',
  actionTaken: '',
};

export function TemperatureLogPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { data: coldRooms, isLoading } = useColdRooms();
  const { user } = useAuthStore();
  const logMutation = useLogTemperature();
  
  const [formData, setFormData] = useState<TemperatureFormData>({
    ...initialFormData,
    recordedBy: user?.name || '',
  });
  const [selectedRoom, setSelectedRoom] = useState<ColdRoomAsset | null>(null);
  
  // Pre-select cold room if ID is provided in URL
  useEffect(() => {
    if (id && coldRooms) {
      const room = coldRooms.find(r => r.id === id);
      if (room) {
        setSelectedRoom(room);
        setFormData(prev => ({ ...prev, coldRoomId: room.id }));
      }
    }
  }, [id, coldRooms]);
  
  const now = new Date();
  const hour = now.getHours();
  const defaultCheckTime = hour >= 15 ? 'evening' : hour >= 11 ? 'midday' : 'morning';
  
  // Set default check time on mount
  useState(() => {
    setFormData(prev => ({ ...prev, checkTime: defaultCheckTime }));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.coldRoomId) {
      toast.error('Please select a cold room');
      return;
    }
    
    if (!formData.temperature) {
      toast.error('Please enter temperature');
      return;
    }
    
    const room = coldRooms?.find(r => r.id === formData.coldRoomId);
    if (!room) return;
    
    const temp = parseFloat(formData.temperature);
    const isOutOfRange = temp < room.minTemp || temp > room.maxTemp;
    
    await logMutation.mutateAsync({
      coldRoomId: room.id,
      coldRoomName: room.name,
      coldRoomAssetCode: room.assetCode,
      companyId: room.companyId,
      checkTime: formData.checkTime,
      recordedAt: new Date(),
      recordedBy: formData.recordedBy || user?.name || 'Unknown',
      recordedById: user?.id,
      temperature: temp,
      humidity: formData.humidity ? parseFloat(formData.humidity) : null,
      doorSealOk: formData.doorSealOk,
      condenserClean: formData.condenserClean,
      interiorClean: formData.interiorClean,
      noIceBuildup: formData.noIceBuildup,
      lightsWorking: formData.lightsWorking,
      compressorRunning: formData.compressorRunning,
      issuesFound: formData.issuesFound,
      issueDescription: formData.issuesFound ? formData.issueDescription : '',
      actionTaken: formData.issuesFound ? formData.actionTaken : '',
      isOutOfRange,
    });
    
    toast.success(`Temperature logged for ${room.name}`);
    
    // Reset form but keep check time and recorded by
    setFormData({
      ...initialFormData,
      checkTime: formData.checkTime,
      recordedBy: formData.recordedBy,
    });
    setSelectedRoom(null);
  };

  const handleRoomSelect = (roomId: string) => {
    const room = coldRooms?.find(r => r.id === roomId);
    setSelectedRoom(room || null);
    setFormData({ ...formData, coldRoomId: roomId });
  };

  const tempValue = parseFloat(formData.temperature);
  const isTempOutOfRange = selectedRoom && !isNaN(tempValue) 
    ? tempValue < selectedRoom.minTemp || tempValue > selectedRoom.maxTemp 
    : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/cold-rooms')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Thermometer className="text-blue-500" />
            Temperature Log
          </h1>
          <p className="text-gray-500">Record morning/afternoon/night temperature checks</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Snowflake size={20} />
            Select Cold Room
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coldRooms?.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => handleRoomSelect(room.id)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  formData.coldRoomId === room.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="font-medium">{room.name}</div>
                <div className="text-sm text-gray-500">{room.assetCode}</div>
                <div className="text-sm text-gray-500">{room.location}</div>
                {room.currentTemp !== undefined && (
                  <div className="mt-2 text-sm">
                    Current: {room.currentTemp.toFixed(1)}°C
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Check Details */}
        {selectedRoom && (
          <>
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Check Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Check Time *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, checkTime: 'morning' })}
                      className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${
                        formData.checkTime === 'morning'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="font-medium">Morning</div>
                      <div className="text-xs text-gray-500">8:00 - 10:00</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, checkTime: 'midday' })}
                      className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${
                        formData.checkTime === 'midday'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="font-medium">Afternoon</div>
                      <div className="text-xs text-gray-500">12:00 - 14:00</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, checkTime: 'evening' })}
                      className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${
                        formData.checkTime === 'evening'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="font-medium">Night</div>
                      <div className="text-xs text-gray-500">16:00 - 18:00</div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {CHECK_TIMES[formData.checkTime.toUpperCase() as keyof typeof CHECK_TIMES].time} - {CHECK_TIMES[formData.checkTime.toUpperCase() as keyof typeof CHECK_TIMES].endTime}
                  </p>
                </div>
                <div>
                  <label className="label">Recorded By *</label>
                  <input
                    type="text"
                    value={formData.recordedBy}
                    onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                    className="input"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Temperature Reading */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Thermometer size={20} />
                Temperature Reading
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Temperature (°C) *
                    <span className="text-sm text-gray-500 ml-2">
                      (Range: {selectedRoom.minTemp}° to {selectedRoom.maxTemp}°)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      className={`input text-lg ${
                        isTempOutOfRange ? 'border-red-500 bg-red-50' : ''
                      }`}
                      placeholder="e.g., -18.5"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">°C</span>
                  </div>
                  {isTempOutOfRange && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <AlertTriangle size={16} />
                      <span className="text-sm">
                        Temperature is out of range! ({selectedRoom.minTemp}° to {selectedRoom.maxTemp}°)
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Humidity (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.humidity}
                      onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                      className="input"
                      placeholder="e.g., 65"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Inspection */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle size={20} />
                Visual Inspection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'doorSealOk', label: 'Door seal intact' },
                  { key: 'condenserClean', label: 'Condenser coils clean' },
                  { key: 'interiorClean', label: 'Interior clean' },
                  { key: 'noIceBuildup', label: 'No excessive ice buildup' },
                  { key: 'lightsWorking', label: 'Interior lights working' },
                  { key: 'compressorRunning', label: 'Compressor running normally' },
                ].map((check) => (
                  <div key={check.key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={check.key}
                      checked={formData[check.key as keyof TemperatureFormData] as boolean}
                      onChange={(e) => setFormData({ ...formData, [check.key]: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <label htmlFor={check.key} className="text-sm text-gray-700">
                      {check.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} />
                Issues Found
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="issuesFound"
                  checked={formData.issuesFound}
                  onChange={(e) => setFormData({ ...formData, issuesFound: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <label htmlFor="issuesFound" className="text-gray-700">
                  Issues were found during this check
                </label>
              </div>
              
              {formData.issuesFound && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Issue Description</label>
                    <textarea
                      value={formData.issueDescription}
                      onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Describe the issue(s) found..."
                      required={formData.issuesFound}
                    />
                  </div>
                  <div>
                    <label className="label">Action Taken</label>
                    <textarea
                      value={formData.actionTaken}
                      onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="What was done to address the issue..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/cold-rooms')}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={logMutation.isLoading}
                className="btn btn-primary flex-1"
              >
                {logMutation.isLoading ? 'Saving...' : 'Log Temperature'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
