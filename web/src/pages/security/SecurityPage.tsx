import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, AlertTriangle, Plus, Search, Key, 
  CheckCircle2, Clock, MapPin, Phone, 
  ArrowRight, Camera, Flame
} from 'lucide-react';
import { useSecurityIncidents, useOpenIncidentsCount, useKeyControl, useSafetyEquipment, useEmergencyContacts, useSecurityStats } from '@/hooks/useSecurity';
import { useAuthStore } from '@/stores/authStore';
import { 
  incidentTypeLabels, severityLabels, severityColors, incidentStatusLabels, incidentStatusColors,
  keyTypeLabels, safetyEquipmentTypeLabels
} from '@/types/security';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function SecurityPage() {
  const { isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  
  const [incidentFilter, setIncidentFilter] = useState({ status: 'all', severity: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: incidents, isLoading: incidentsLoading } = useSecurityIncidents(companyId, {
    status: incidentFilter.status === 'all' ? undefined : incidentFilter.status,
    severity: incidentFilter.severity === 'all' ? undefined : incidentFilter.severity,
  });
  const { data: openIncidents } = useOpenIncidentsCount(companyId);
  const { data: keys, isLoading: keysLoading } = useKeyControl(companyId);
  const { data: safetyEquipment, isLoading: equipmentLoading } = useSafetyEquipment(companyId, true);
  const { data: emergencyContacts } = useEmergencyContacts(companyId);
  const { data: stats } = useSecurityStats(companyId);

  const isLoading = incidentsLoading || keysLoading || equipmentLoading;

  const filteredIncidents = incidents?.filter(i => 
    i.incidentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary-600" />
            Security & Safety
          </h1>
          <p className="text-gray-600 mt-1">Manage incidents, patrols, keys, and safety equipment</p>
        </div>
        <div className="flex gap-2">
          <Link to="/security/patrol" className="btn btn-secondary flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Patrol
          </Link>
          <Link to="/security/incident/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Report Incident
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">Open Incidents</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-1">{stats.openIncidents + stats.inProgressIncidents}</p>
            <p className="text-xs text-gray-500">{stats.criticalIncidents} critical</p>
          </div>
          <div className="card bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Resolved Today</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.resolvedToday}</p>
            <p className="text-xs text-gray-500">Closed incidents</p>
          </div>
          <div className="card bg-yellow-50">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Inspections Due</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.dueInspections}</p>
            <p className="text-xs text-gray-500">Safety equipment</p>
          </div>
          <div className="card bg-blue-50">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Keys Out</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.issuedKeys}</p>
            <p className="text-xs text-gray-500">{stats.lostKeys} lost</p>
          </div>
        </div>
      )}

      {/* Emergency Contacts */}
      {emergencyContacts && emergencyContacts.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-3">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {emergencyContacts.map((contact) => (
              <a 
                key={contact.id} 
                href={`tel:${contact.phone}`}
                className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="font-medium text-gray-900">{contact.name}</p>
                <p className="text-sm text-gray-500 capitalize">{contact.type.replace('-', ' ')}</p>
                <p className="text-sm font-medium text-primary-600">{contact.phone}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Incidents Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary-600" />
            Security Incidents
            {openIncidents !== undefined && openIncidents > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{openIncidents}</span>
            )}
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-48"
              />
            </div>
            <select
              value={incidentFilter.status}
              onChange={(e) => setIncidentFilter({ ...incidentFilter, status: e.target.value })}
              className="input w-32"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={incidentFilter.severity}
              onChange={(e) => setIncidentFilter({ ...incidentFilter, severity: e.target.value })}
              className="input w-32"
            >
              <option value="all">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No incidents found</p>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{incident.incidentNumber}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severityColors[incident.severity]}`}>
                        {severityLabels[incident.severity]}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${incidentStatusColors[incident.status]}`}>
                        {incidentStatusLabels[incident.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{incidentTypeLabels[incident.type]}</p>
                    <p className="text-sm text-gray-800">{incident.description.substring(0, 100)}...</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {incident.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(incident.occurredAt), 'MMM d, h:mm a')}
                      </span>
                      <span>Reported by: {incident.reportedByName}</span>
                    </div>
                  </div>
                  <Link 
                    to={`/security/incident/${incident.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredIncidents.length > 5 && (
          <div className="mt-4 text-center">
            <Link to="/security/incidents" className="text-primary-600 hover:text-primary-700 text-sm">
              View all {filteredIncidents.length} incidents →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Key Control */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Key className="h-5 w-5 text-primary-600" />
              Key Control
            </h3>
            <Link to="/security/keys" className="text-primary-600 text-sm">Manage →</Link>
          </div>
          {keys && keys.filter(k => k.status === 'issued').length > 0 ? (
            <div className="space-y-2">
              {keys.filter(k => k.status === 'issued').slice(0, 3).map((key) => (
                <div key={key.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{keyTypeLabels[key.keyType]} #{key.keyNumber}</p>
                    <p className="text-xs text-gray-500">{key.issuedToName}</p>
                  </div>
                  <Link 
                    to={`/security/key/${key.id}/return`}
                    className="btn btn-secondary btn-xs"
                  >
                    Return
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No keys currently issued</p>
          )}
        </div>

        {/* Safety Equipment */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary-600" />
              Inspections Due
            </h3>
            <Link to="/security/safety-equipment" className="text-primary-600 text-sm">View All →</Link>
          </div>
          {safetyEquipment && safetyEquipment.length > 0 ? (
            <div className="space-y-2">
              {safetyEquipment.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{safetyEquipmentTypeLabels[item.type]}</p>
                    <p className="text-xs text-gray-500">{item.location}</p>
                  </div>
                  <span className="text-xs text-red-600 font-medium">
                    Due {format(new Date(item.nextInspection), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No inspections due</p>
          )}
        </div>

        {/* CCTV */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary-600" />
              CCTV Check
            </h3>
            <Link to="/security/cctv" className="text-primary-600 text-sm">Check Now →</Link>
          </div>
          <p className="text-sm text-gray-600 mb-3">Record daily CCTV system checks for all cameras.</p>
          <Link 
            to="/security/cctv/check"
            className="btn btn-primary w-full"
          >
            <Camera className="h-4 w-4 mr-2" />
            Record Check
          </Link>
        </div>
      </div>
    </div>
  );
}
