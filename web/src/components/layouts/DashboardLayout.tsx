import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useRealtimeNotifications } from '@/hooks/useNotifications';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import {
  LayoutDashboard,
  Wrench,
  Package,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  Building2,
  Smartphone,
  CheckCircle,
  AlertCircle,
  User,
  CheckSquare,
  Briefcase
} from 'lucide-react';

interface DashboardLayoutProps {
  children?: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Assets', href: '/assets', icon: Building2 },
  { name: 'Work Orders', href: '/work-orders', icon: Wrench },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Technician', href: '/technician', icon: Smartphone },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications();

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-gray-900/50 transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 overflow-y-auto">
                <nav className="px-2 py-4 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href ||
                      location.pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                          isActive
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon
                          className={`mr-4 flex-shrink-0 h-6 w-6 ${
                            isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900">Fixora</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href ||
                  location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header - Mobile */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center px-4">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900">Fixora</span>
            </Link>
          </div>
          
          {/* Mobile: Notification Bell */}
          <div className="flex items-center">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 relative mr-2"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown - Mobile */}
              {showNotifications && (
                <div className="fixed inset-x-4 top-16 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[400px] overflow-hidden sm:absolute sm:right-0 sm:left-auto sm:w-96 sm:inset-x-auto">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-[300px]">
                    {notifications.length === 0 ? (
                      <p className="p-8 text-center text-gray-500 text-sm">No notifications yet</p>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            navigate(`/work-orders/${notif.workOrderId}`);
                            setShowNotifications(false);
                          }}
                          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !notif.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              notif.type === 'workorder_created' ? 'bg-purple-100 text-purple-600' :
                              notif.type === 'workorder_assigned' ? 'bg-blue-100 text-blue-600' :
                              notif.type === 'workorder_completed' ? 'bg-green-100 text-green-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {notif.type === 'workorder_created' ? <CheckCircle className="h-4 w-4" /> :
                               notif.type === 'workorder_assigned' ? <User className="h-4 w-4" /> :
                               notif.type === 'workorder_completed' ? <CheckSquare className="h-4 w-4" /> :
                               <AlertCircle className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Just now'}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile: Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
              aria-label="Logout"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:px-8 lg:py-4 bg-white border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-500 relative"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-[400px]">
                    {notifications.length === 0 ? (
                      <p className="p-8 text-center text-gray-500 text-sm">No notifications yet</p>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            navigate(`/work-orders/${notif.workOrderId}`);
                            setShowNotifications(false);
                          }}
                          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !notif.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              notif.type === 'workorder_created' ? 'bg-purple-100 text-purple-600' :
                              notif.type === 'workorder_assigned' ? 'bg-blue-100 text-blue-600' :
                              notif.type === 'workorder_completed' ? 'bg-green-100 text-green-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {notif.type === 'workorder_created' ? <CheckCircle className="h-4 w-4" /> :
                               notif.type === 'workorder_assigned' ? <User className="h-4 w-4" /> :
                               notif.type === 'workorder_completed' ? <CheckSquare className="h-4 w-4" /> :
                               <AlertCircle className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Just now'}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="relative group pt-2">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <div className="absolute right-0 top-full w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children ?? <Outlet />}</main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
