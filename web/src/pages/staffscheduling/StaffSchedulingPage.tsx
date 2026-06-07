import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Users, Clock, Plus, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Briefcase, CalendarDays, 
  Calendar as CalendarIcon, ArrowRight
} from 'lucide-react';
import { useSchedules, useShifts, useSchedulingStats, usePendingTimeOffCount } from '@/hooks/useStaffScheduling';
import { useAuthStore } from '@/stores/authStore';
import { shiftStatusLabels, shiftStatusColors, getDayName } from '@/types/staffscheduling';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export function StaffSchedulingPage() {
  const { isSuperAdmin, getCompanyId } = useAuthStore();
  const companyId = isSuperAdmin() ? undefined : getCompanyId();
  
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const { data: shifts } = useShifts(companyId);
  const { data: stats } = useSchedulingStats(companyId);
  const { data: pendingTimeOff } = usePendingTimeOffCount(companyId);
  
  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  
  // Get schedules for the current week
  const weekStart = format(currentWeek, 'yyyy-MM-dd');
  const { data: schedules, isLoading } = useSchedules(companyId, { 
    date: weekStart 
  });

  const getSchedulesForDay = (date: Date) => {
    if (!schedules) return [];
    return schedules.filter(s => s.date === format(date, 'yyyy-MM-dd'));
  };

  const departments = ['Housekeeping', 'F&B', 'Maintenance', 'Security', 'Front Desk', 'Water Sports', 'Spa'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary-600" />
            Staff Scheduling
          </h1>
          <p className="text-gray-600 mt-1">Manage shifts, track attendance, handle time-off requests</p>
        </div>
        <div className="flex gap-2">
          <Link to="/staff-scheduling/time-off" className="btn btn-secondary flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Time Off
            {pendingTimeOff && pendingTimeOff > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingTimeOff}</span>
            )}
          </Link>
          <Link to="/staff-scheduling/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Schedule
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-blue-50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Scheduled Today</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.scheduledToday}</p>
          </div>
          <div className="card bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Checked In</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.checkedIn}</p>
          </div>
          <div className="card bg-yellow-50">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.completed}</p>
          </div>
          <div className="card bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">Absent</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-1">{stats.absent}</p>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                Week of {format(currentWeek, 'MMMM d')} - {format(addDays(currentWeek, 6), 'MMMM d, yyyy')}
              </h2>
            </div>
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="input w-40"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Calendar */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const daySchedules = getSchedulesForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className={`card p-3 ${isToday ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="text-center mb-3">
                  <p className="text-sm text-gray-500 uppercase">{format(day, 'EEE')}</p>
                  <p className={`text-lg font-semibold ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {daySchedules.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No shifts</p>
                  ) : (
                    daySchedules.map((schedule) => (
                      <div 
                        key={schedule.id} 
                        className={`p-2 rounded text-xs ${shiftStatusColors[schedule.status]}`}
                      >
                        <p className="font-medium truncate">{schedule.staffName}</p>
                        <p className="opacity-75">{schedule.shiftName}</p>
                        <p className="opacity-75">{schedule.startTime} - {schedule.endTime}</p>
                        {schedule.status === 'in-progress' && (
                          <p className="mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Working
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <Link
                  to={`/staff-scheduling/day/${format(day, 'yyyy-MM-dd')}`}
                  className="mt-3 text-xs text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1"
                >
                  View Details <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/staff-scheduling/shifts" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Shifts</h3>
              <p className="text-sm text-gray-500">Configure shift patterns</p>
            </div>
          </div>
        </Link>
        
        <Link to="/staff-scheduling/availability" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CalendarDays className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Staff Availability</h3>
              <p className="text-sm text-gray-500">Set working preferences</p>
            </div>
          </div>
        </Link>
        
        <Link to="/staff-scheduling/templates" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Schedule Templates</h3>
              <p className="text-sm text-gray-500">Create recurring patterns</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
