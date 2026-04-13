import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Star, MessageSquare, Plus, Search, Gift,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  ArrowRight, Package, Crown
} from 'lucide-react';
import { useGuestRequests, useGuestFeedback, useLostFound, useVipGuests, useGuestExperienceStats } from '@/hooks/useGuestExperience';
import { useAuthStore } from '@/stores/authStore';
import { 
  requestTypeLabels, requestPriorityColors, requestStatusLabels, requestStatusColors,
  feedbackTypeLabels, feedbackTypeColors, vipLevelLabels, vipLevelColors
} from '@/types/guestexperience';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function GuestExperiencePage() {
  const { isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'feedback'>('overview');
  const [requestFilter, setRequestFilter] = useState({ status: 'all', type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: requests, isLoading: requestsLoading } = useGuestRequests(companyId, {
    status: requestFilter.status === 'all' ? undefined : requestFilter.status,
    type: requestFilter.type === 'all' ? undefined : requestFilter.type,
  });
  const { data: feedback, isLoading: feedbackLoading } = useGuestFeedback(companyId);
  const { data: lostFound, isLoading: lostFoundLoading } = useLostFound(companyId, 'held');
  const { data: vipGuests, isLoading: vipLoading } = useVipGuests(companyId, true);
  const { data: stats } = useGuestExperienceStats(companyId);

  const isLoading = requestsLoading || feedbackLoading || lostFoundLoading || vipLoading;

  const filteredRequests = requests?.filter(r => 
    r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary-600" />
            Guest Experience
          </h1>
          <p className="text-gray-600 mt-1">Manage requests, feedback, VIP guests, and lost & found</p>
        </div>
        <div className="flex gap-2">
          <Link to="/guest-experience/request" className="btn btn-secondary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Link>
          <Link to="/guest-experience/feedback/new" className="btn btn-primary flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Record Feedback
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-yellow-50">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Pending Requests</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pendingRequests + stats.inProgressRequests}</p>
            <p className="text-xs text-gray-500">{stats.urgentRequests} urgent</p>
          </div>
          <div className="card bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Completed Today</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.completedToday}</p>
            <p className="text-xs text-gray-500">Guest requests</p>
          </div>
          <div className="card bg-blue-50">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.avgRating}</p>
            <p className="text-xs text-gray-500">{stats.newFeedback} new feedback</p>
          </div>
          <div className="card bg-purple-50">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">VIP Guests</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-1">{stats.currentVipGuests}</p>
            <p className="text-xs text-gray-500">Currently staying</p>
          </div>
        </div>
      )}

      {/* VIP Guests Alert */}
      {vipGuests && vipGuests.length > 0 && (
        <div className="card bg-purple-50 border-purple-200">
          <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5" />
            Current VIP Guests ({vipGuests.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vipGuests.map((guest) => (
              <div key={guest.id} className={`bg-white p-3 rounded-lg shadow-sm border-2 ${vipLevelColors[guest.vipLevel]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{guest.name}</p>
                    <p className="text-sm text-gray-500">Room {guest.currentRoom}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${vipLevelColors[guest.vipLevel]}`}>
                    {vipLevelLabels[guest.vipLevel]}
                  </span>
                </div>
                {guest.specialRequests && (
                  <p className="text-xs text-gray-600 mt-2">{guest.specialRequests}</p>
                )}
                <Link 
                  to={`/guest-experience/vip/${guest.id}`}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  View Profile →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lost & Found */}
      {lostFound && lostFound.length > 0 && (
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-orange-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Held Lost & Found Items ({lostFound.length})
            </h3>
            <Link to="/guest-experience/lost-found" className="text-orange-600 text-sm">View All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {lostFound.slice(0, 4).map((item) => (
              <div key={item.id} className="bg-white p-2 rounded text-sm">
                <p className="font-medium truncate">{item.description}</p>
                <p className="text-gray-500 text-xs">Ref: {item.storageRefNumber}</p>
                <p className="text-gray-500 text-xs">Found: {format(new Date(item.foundDate), 'MMM d')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['overview', 'requests', 'feedback'] as const).map((tab) => (
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

      {/* Requests Section */}
      {(activeTab === 'overview' || activeTab === 'requests') && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Guest Requests</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-48"
                />
              </div>
              <select
                value={requestFilter.status}
                onChange={(e) => setRequestFilter({ ...requestFilter, status: e.target.value })}
                className="input w-32"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={requestFilter.type}
                onChange={(e) => setRequestFilter({ ...requestFilter, type: e.target.value })}
                className="input w-32"
              >
                <option value="all">All Types</option>
                {Object.entries(requestTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No requests found</p>
          ) : (
            <div className="space-y-3">
              {filteredRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{request.title}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${requestPriorityColors[request.priority]}`}>
                          {request.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${requestStatusColors[request.status]}`}>
                          {requestStatusLabels[request.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{requestTypeLabels[request.requestType]}</p>
                      <p className="text-sm text-gray-700 mt-1">{request.description.substring(0, 100)}...</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Guest: {request.guestName} (Room {request.roomNumber})</span>
                        <span>Requested: {format(new Date(request.requestedAt), 'MMM d, h:mm a')}</span>
                        {request.assignedToName && <span>Assigned: {request.assignedToName}</span>}
                      </div>
                    </div>
                    <Link 
                      to={`/guest-experience/request/${request.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Section */}
      {activeTab === 'feedback' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Feedback</h3>
          {feedbackLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : feedback && feedback.length > 0 ? (
            <div className="space-y-3">
              {feedback.slice(0, 5).map((item) => (
                <div key={item.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{item.title}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${feedbackTypeColors[item.feedbackType]}`}>
                          {feedbackTypeLabels[item.feedbackType]}
                        </span>
                        <span className="flex items-center text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="ml-1 text-sm">{item.overallRating}/10</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{item.description.substring(0, 150)}...</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Guest: {item.guestName}</span>
                        <span>Submitted: {format(new Date(item.submittedAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <Link 
                      to={`/guest-experience/feedback/${item.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No feedback found</p>
          )}
        </div>
      )}
    </div>
  );
}
