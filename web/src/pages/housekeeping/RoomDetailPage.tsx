import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  BedDouble, ArrowLeft, Edit2, Trash2, AlertCircle,
  CheckCircle2, Clock, User, Calendar, MapPin, Sparkles,
  Wrench, Plus, History
} from 'lucide-react';
import { useRoom, useRoomMutations, useRoomInspections } from '@/hooks/useHousekeeping';
import { useAuthStore } from '@/stores/authStore';
import { 
  roomStatusLabels, roomStatusColors, roomTypeLabels, 
  viewTypeLabels, taskTypeLabels 
} from '@/types/housekeeping';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuthStore();
  const { data: room, isLoading } = useRoom(id!);
  const { data: inspections } = useRoomInspections(id!);
  const { updateRoom, deleteRoom, updateRoomStatus } = useRoomMutations();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteRoom.mutateAsync(id!);
      toast.success('Room deleted successfully');
      navigate('/housekeeping');
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateRoomStatus.mutateAsync({
        id: id!,
        status: newStatus as any,
        lastCleaned: newStatus === 'vacant-clean' ? new Date().toISOString() : undefined,
      });
      toast.success('Room status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
        <p className="text-gray-500">Room not found</p>
        <Link to="/housekeeping" className="btn btn-primary mt-4">
          Back to Housekeeping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/housekeeping" className="btn btn-secondary btn-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BedDouble className="h-8 w-8 text-primary-600" />
              Room {room.roomNumber}
            </h1>
            <p className="text-gray-600">{roomTypeLabels[room.roomType]} • {viewTypeLabels[room.viewType]}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="btn btn-secondary"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-danger"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${roomStatusColors[room.status]}`}>
              {roomStatusLabels[room.status]}
            </span>
            {room.lastCleaned && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last cleaned: {format(new Date(room.lastCleaned), 'MMM d, h:mm a')}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('vacant-clean')}
              className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200"
              disabled={room.status === 'vacant-clean'}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Clean
            </button>
            <button
              onClick={() => handleStatusChange('vacant-dirty')}
              className="btn btn-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              disabled={room.status === 'vacant-dirty'}
            >
              <Sparkles className="h-4 w-4" />
              Needs Cleaning
            </button>
            <button
              onClick={() => handleStatusChange('maintenance')}
              className="btn btn-sm bg-orange-100 text-orange-700 hover:bg-orange-200"
              disabled={room.status === 'maintenance'}
            >
              <Wrench className="h-4 w-4" />
              Maintenance
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{room.location}</p>
                  {room.floor && <p className="text-sm text-gray-500">{room.floor}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BedDouble className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Bed Configuration</p>
                  <p className="font-medium capitalize">{room.bedConfiguration} Bed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Max Occupancy</p>
                  <p className="font-medium">{room.maxOccupancy} Guests</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Condition</p>
                  <p className="font-medium capitalize">{room.condition}</p>
                </div>
              </div>
            </div>

            {room.amenities && room.amenities.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <span key={amenity} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {room.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{room.notes}</p>
              </div>
            )}
          </div>

          {/* Inspection History */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5" />
                Inspection History
              </h3>
              <Link to={`/housekeeping/room/${id}/inspect`} className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" />
                New Inspection
              </Link>
            </div>
            {inspections && inspections.length > 0 ? (
              <div className="space-y-3">
                {inspections.slice(0, 5).map((inspection) => (
                  <div key={inspection.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          inspection.overallStatus === 'passed' ? 'bg-green-100 text-green-800' :
                          inspection.overallStatus === 'needs-attention' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {inspection.overallStatus}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(inspection.inspectionDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">by {inspection.inspectedByName}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Cleanliness: {inspection.cleanlinessScore}/10 • 
                      Maintenance: {inspection.maintenanceScore}/10
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No inspections recorded yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
            {room.assignedHousekeeperName ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium">{room.assignedHousekeeperName}</p>
                  <p className="text-sm text-gray-500">Assigned Housekeeper</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No housekeeper assigned</p>
                <button className="btn btn-primary btn-sm">
                  <Plus className="h-4 w-4" />
                  Assign Housekeeper
                </button>
              </div>
            )}
          </div>

          {/* Current Guest */}
          {room.currentGuest && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Guest</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{room.currentGuest}</p>
                  </div>
                </div>
                {room.checkInDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-medium">{format(new Date(room.checkInDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                {room.checkOutDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-medium">{format(new Date(room.checkOutDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                to={`/housekeeping/cleaning-tasks/new?roomId=${id}`}
                className="btn btn-secondary w-full justify-center"
              >
                <Sparkles className="h-4 w-4" />
                Schedule Cleaning
              </Link>
              <Link 
                to={`/work-orders/new?roomId=${id}`}
                className="btn btn-secondary w-full justify-center"
              >
                <Wrench className="h-4 w-4" />
                Create Work Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Room?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete Room {room.roomNumber}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger flex-1"
                disabled={deleteRoom.isLoading}
              >
                {deleteRoom.isLoading ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
