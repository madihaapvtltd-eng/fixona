import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, Shield, Bell, Info, Building2, Calculator, Volume2, VolumeX, BellRing } from 'lucide-react';
import { useNotificationSound } from '@/lib/notificationSound';
import { usePushNotifications } from '@/lib/pushNotifications';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    whatsapp: false,
  });
  const { isEnabled, toggle, enable } = useNotificationSound();
  const { isSupported, permission, init } = usePushNotifications();
  const [pushEnabled, setPushEnabled] = useState(permission === 'granted');

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* Banner with Storyset Illustration */}
      <div className="card bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img 
            src="/storyset-illustrations/Working-rafiki.svg" 
            alt="Settings" 
            className="w-24 h-24 object-contain"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Configure your Fixora experience</p>
          </div>
        </div>
      </div>

      {/* Admin Section - Only visible to admins */}
      {(user?.role === 'super_admin' || user?.role === 'dept_admin') && (
        <div className="card max-w-2xl border-l-4 border-primary-500">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold">Administration</h2>
          </div>
          
          <div className="space-y-3">
            <Link 
              to="/admin/settings" 
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Departments & Locations</p>
                  <p className="text-sm text-gray-500">Add/edit departments and locations</p>
                </div>
              </div>
              <span className="text-primary-600">→</span>
            </Link>

            <Link 
              to="/staff/new" 
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add New User</p>
                  <p className="text-sm text-gray-500">Create staff accounts with roles</p>
                </div>
              </div>
              <span className="text-primary-600">→</span>
            </Link>

            <Link 
              to="/staff" 
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Staff</p>
                  <p className="text-sm text-gray-500">View and edit all users</p>
                </div>
              </div>
              <span className="text-primary-600">→</span>
            </Link>

            {user?.role === 'super_admin' && (
              <Link 
                to="/admin/tools" 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calculator className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Admin Tools</p>
                    <p className="text-sm text-gray-500">Recalculate work order costs</p>
                  </div>
                </div>
                <span className="text-primary-600">→</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="card max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                notifications.email ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  notifications.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-500">Receive push notifications</p>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                notifications.push ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  notifications.push ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">WhatsApp Notifications</p>
              <p className="text-sm text-gray-500">Receive updates via WhatsApp</p>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, whatsapp: !notifications.whatsapp })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                notifications.whatsapp ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  notifications.whatsapp ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notification Sound Toggle */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="font-medium">Notification Sounds</p>
              <p className="text-sm text-gray-500">Play sound for new notifications</p>
            </div>
            <button
              onClick={() => {
                toggle();
                if (!isEnabled) {
                  enable();
                  toast.success('Notification sounds enabled');
                } else {
                  toast.success('Notification sounds disabled');
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isEnabled 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isEnabled ? (
                <>
                  <Volume2 className="h-5 w-5" />
                  <span>On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-5 w-5" />
                  <span>Off</span>
                </>
              )}
            </button>
          </div>

          {/* Push Notifications Toggle */}
          {isSupported && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="font-medium">Background Notifications</p>
                <p className="text-sm text-gray-500">Show notifications even when app is closed</p>
              </div>
              <button
                onClick={async () => {
                  if (permission === 'granted') {
                    toast.success('Push notifications already enabled');
                  } else if (permission === 'denied') {
                    toast.error('Please enable notifications in browser settings');
                  } else {
                    const success = await init();
                    if (success) {
                      setPushEnabled(true);
                      toast.success('Push notifications enabled');
                    } else {
                      toast.error('Failed to enable push notifications');
                    }
                  }
                }}
                disabled={permission === 'denied'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  permission === 'granted'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : permission === 'denied'
                    ? 'bg-red-100 text-red-700 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BellRing className="h-5 w-5" />
                <span>
                  {permission === 'granted' ? 'Enabled' : 
                   permission === 'denied' ? 'Blocked' : 'Enable'}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <button onClick={handleSave} className="btn-primary">
            Save Settings
          </button>
        </div>
      </div>

      <div className="card max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">System Information</h2>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Version:</span> 1.0.0</p>
          <p><span className="text-gray-500">User:</span> {user?.name}</p>
          <p><span className="text-gray-500">Role:</span> {user?.role}</p>
        </div>
      </div>
    </div>
  );
}
