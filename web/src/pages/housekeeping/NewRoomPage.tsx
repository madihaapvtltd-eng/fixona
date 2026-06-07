import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BedDouble, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useRoomMutations } from '@/hooks/useHousekeeping';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface RoomFormData {
  roomNumber: string;
  roomType: 'villa' | 'suite' | 'bungalow' | 'standard' | 'deluxe' | 'presidential';
  bedConfiguration: 'king' | 'queen' | 'twin' | 'double' | 'bunk';
  maxOccupancy: number;
  floor: string;
  location: string;
  viewType: 'ocean' | 'lagoon' | 'garden' | 'beach' | 'pool' | 'partial-ocean';
  amenities: string[];
  status: 'vacant-clean' | 'vacant-dirty' | 'occupied' | 'occupied-do-not-disturb' | 'maintenance' | 'out-of-order';
  condition: 'excellent' | 'good' | 'fair' | 'needs-repair';
  notes: string;
}

const initialFormData: RoomFormData = {
  roomNumber: '',
  roomType: 'standard',
  bedConfiguration: 'king',
  maxOccupancy: 2,
  floor: '',
  location: '',
  viewType: 'garden',
  amenities: [],
  status: 'vacant-clean',
  condition: 'excellent',
  notes: '',
};

const amenityOptions = [
  'WiFi', 'Air Conditioning', 'Mini Bar', 'Safe', 'TV', 'Coffee Machine',
  'Bathtub', 'Rain Shower', 'Ocean View', 'Private Pool', 'Jacuzzi', 'Balcony',
  'Butler Service', 'Beach Access', 'Water Sports Equipment'
];

export function NewRoomPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, getCompanyId } = useAuthStore();
  const { createRoom } = useRoomMutations();
  const [formData, setFormData] = useState<RoomFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomNumber || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    const companyId = getCompanyId();
    if (!companyId && !isSuperAdmin()) {
      toast.error('Company ID is required');
      return;
    }

    setSubmitting(true);
    try {
      await createRoom.mutateAsync({
        ...formData,
        companyId: companyId || '',
        companyName: user?.companyName || '',
        cleaningPriority: 'normal',
        maxOccupancy: Number(formData.maxOccupancy),
      });
      toast.success('Room created successfully');
      navigate('/housekeeping');
    } catch (error) {
      toast.error('Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleRoomTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, roomType: value as RoomFormData['roomType'] }));
  };

  const handleBedChange = (value: string) => {
    setFormData(prev => ({ ...prev, bedConfiguration: value as RoomFormData['bedConfiguration'] }));
  };

  const handleViewChange = (value: string) => {
    setFormData(prev => ({ ...prev, viewType: value as RoomFormData['viewType'] }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as RoomFormData['status'] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/housekeeping" className="btn btn-secondary btn-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BedDouble className="h-8 w-8 text-primary-600" />
          Add New Room
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Room Number *</label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              className="input"
              placeholder="e.g., 101, Villa-01"
              required
            />
          </div>

          <div>
            <label className="label">Room Type *</label>
            <select
              value={formData.roomType}
              onChange={(e) => handleRoomTypeChange(e.target.value)}
              className="input"
              required
            >
              <option value="standard">Standard Room</option>
              <option value="deluxe">Deluxe Room</option>
              <option value="suite">Suite</option>
              <option value="villa">Private Villa</option>
              <option value="bungalow">Bungalow</option>
              <option value="presidential">Presidential Suite</option>
            </select>
          </div>

          <div>
            <label className="label">Bed Configuration</label>
            <select
              value={formData.bedConfiguration}
              onChange={(e) => handleBedChange(e.target.value)}
              className="input"
            >
              <option value="king">King Bed</option>
              <option value="queen">Queen Bed</option>
              <option value="twin">Twin Beds</option>
              <option value="double">Double Bed</option>
              <option value="bunk">Bunk Beds</option>
            </select>
          </div>

          <div>
            <label className="label">Max Occupancy</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxOccupancy}
              onChange={(e) => setFormData({ ...formData, maxOccupancy: parseInt(e.target.value) })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Floor / Level</label>
            <input
              type="text"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              className="input"
              placeholder="e.g., Ground Floor, Water Villa"
            />
          </div>

          <div>
            <label className="label">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
              placeholder="e.g., Beach Wing, Overwater Villas"
              required
            />
          </div>

          <div>
            <label className="label">View Type</label>
            <select
              value={formData.viewType}
              onChange={(e) => handleViewChange(e.target.value)}
              className="input"
            >
              <option value="ocean">Ocean View</option>
              <option value="lagoon">Lagoon View</option>
              <option value="garden">Garden View</option>
              <option value="beach">Beach Front</option>
              <option value="pool">Pool View</option>
              <option value="partial-ocean">Partial Ocean View</option>
            </select>
          </div>

          <div>
            <label className="label">Initial Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input"
            >
              <option value="vacant-clean">Vacant Clean</option>
              <option value="vacant-dirty">Vacant Dirty</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="out-of-order">Out of Order</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="label">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  formData.amenities.includes(amenity)
                    ? 'bg-primary-100 border-primary-500 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {formData.amenities.includes(amenity) ? '✓ ' : '+ '}
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="label">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={3}
            placeholder="Additional notes about the room..."
          />
        </div>

        <div className="mt-6 flex gap-3">
          <Link to="/housekeeping" className="btn btn-secondary flex-1">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create Room
          </button>
        </div>
      </form>
    </div>
  );
}
