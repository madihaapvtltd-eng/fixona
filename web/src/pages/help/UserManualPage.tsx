import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/stores/authStore';
import { 
  Book, Search, ChevronRight, ChevronDown, Shield, 
  Building2, Users, Wrench, Thermometer, Zap, Snowflake,
  FileText, Package, Fuel, LayoutDashboard, CheckCircle,
  AlertTriangle, Smartphone, Settings, LogOut, Plus,
  Edit2, Trash2, Filter, BarChart3, Bell
} from 'lucide-react';

interface ManualSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  requiredRole: User['role'][];
  description: string;
  features: {
    title: string;
    description: string;
    steps?: string[];
    tip?: string;
  }[];
}

const manualSections: ManualSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <LayoutDashboard size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician', 'staff', 'viewer'],
    description: 'Essential information for all users',
    features: [
      {
        title: 'Logging In',
        description: 'Access your account using your email and password.',
        steps: [
          'Enter your email address',
          'Enter your password',
          'Click "Sign In"',
          'If you forget your password, contact your administrator'
        ]
      },
      {
        title: 'Navigation',
        description: 'Use the left sidebar to navigate between different modules.',
        tip: 'Only modules you have permission to access will be shown.'
      },
      {
        title: 'Notifications',
        description: 'Click the bell icon in the top right to view alerts and notifications.',
        tip: 'Unread notifications are shown with a red badge.'
      },
      {
        title: 'Your Profile',
        description: 'View your account details and recent activity.',
        tip: 'Contact an administrator to update your information.'
      }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician', 'staff', 'viewer'],
    description: 'Overview of your facilities and quick actions',
    features: [
      {
        title: 'Dashboard Overview',
        description: 'The dashboard shows key metrics and quick access to important features.',
        steps: [
          'View total assets, work orders, and pending tasks',
          'See recent activity and notifications',
          'Access quick links to frequently used pages'
        ]
      },
      {
        title: 'Quick Actions',
        description: 'Perform common tasks directly from the dashboard.',
        tip: 'Available actions depend on your role and permissions.'
      }
    ]
  },
  {
    id: 'super-admin',
    title: 'Super Admin Features',
    icon: <Shield size={20} />,
    requiredRole: ['super_admin'],
    description: 'System-wide administration and management',
    features: [
      {
        title: 'Company Management',
        description: 'Create and manage companies in the system.',
        steps: [
          'Navigate to "Companies" in the Super Admin section',
          'Click "Add Company" to create a new company',
          'Enter company details: name, code, address, contact info',
          'Save the company',
          'Company code is used to identify the company throughout the system'
        ],
        tip: 'Each company has isolated data - users can only see their company data.'
      },
      {
        title: 'User Management',
        description: 'Create and manage users across all companies.',
        steps: [
          'Navigate to "All Users" in the Super Admin section',
          'Click "Add User"',
          'Select the company for the user',
          'Choose the appropriate role (see Roles guide below)',
          'Enter user details and set a temporary password',
          'User will receive email to log in (if email verification enabled)'
        ],
        tip: 'Users can only access features permitted by their role.'
      },
      {
        title: 'Data Migration',
        description: 'Assign existing data to companies.',
        steps: [
          'Go to "Data Migration" in the Super Admin section',
          'Select the target company',
          'Review the data that will be migrated',
          'Click "Run Migration" to assign all orphaned data to the selected company'
        ],
        tip: 'Use this after creating companies to organize existing data.'
      },
      {
        title: 'Super Admin Login',
        description: 'Special login for system administrators.',
        steps: [
          'Use the URL: /superadmin or click "Super Admin Login"',
          'Enter super admin credentials',
          'Access company and user management features'
        ]
      }
    ]
  },
  {
    id: 'roles',
    title: 'User Roles & Permissions',
    icon: <Users size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician', 'staff', 'viewer'],
    description: 'Understanding access levels in the system',
    features: [
      {
        title: 'Super Admin',
        description: 'Full system access. Can manage companies, all users, and all data across the entire system.',
        tip: 'Only for system administrators.'
      },
      {
        title: 'Company Admin',
        description: 'Full access within their company. Can manage users, assets, work orders, and settings for their company only.',
        tip: 'Typically assigned to facility managers or operations managers.'
      },
      {
        title: 'Supervisor',
        description: 'Can manage work orders, assign tasks, view reports, and oversee operations within their company.',
        tip: 'For team leads and department supervisors.'
      },
      {
        title: 'Technician',
        description: 'Can view and update work orders assigned to them, update asset status, and log maintenance activities.',
        tip: 'For maintenance staff and technicians.'
      },
      {
        title: 'Staff',
        description: 'Read-only access to basic information. Can view assets and work orders but cannot make changes.',
        tip: 'For general staff who need visibility but not editing rights.'
      },
      {
        title: 'Viewer',
        description: 'View-only access for reports and basic data. Cannot access sensitive information or make changes.',
        tip: 'For auditors or external stakeholders.'
      }
    ]
  },
  {
    id: 'assets',
    title: 'Assets Management',
    icon: <Building2 size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician', 'staff'],
    description: 'Manage all facility assets and equipment',
    features: [
      {
        title: 'Viewing Assets',
        description: 'Browse and search all assets in your company.',
        steps: [
          'Click "Assets" in the sidebar',
          'Use the search bar to find specific assets',
          'Filter by category, status, or location',
          'Click on an asset to view details'
        ]
      },
      {
        title: 'Adding New Assets',
        description: 'Register new equipment and facilities.',
        steps: [
          'Navigate to Assets and click "New Asset"',
          'Enter asset code, name, and category',
          'Add location, purchase details, and specifications',
          'Upload photos and documents',
          'Generate QR code for physical tagging'
        ],
        tip: 'Each asset gets a unique QR code for easy identification.'
      },
      {
        title: 'Asset Details',
        description: 'View comprehensive information about an asset.',
        steps: [
          'View maintenance history and upcoming service',
          'See assigned work orders',
          'Check warranty and purchase information',
          'Download asset reports'
        ]
      },
      {
        title: 'QR Codes',
        description: 'Use QR codes for quick asset identification.',
        steps: [
          'Print the QR code from the asset detail page',
          'Attach to physical equipment',
          'Scan with mobile device to quickly access asset information'
        ]
      }
    ]
  },
  {
    id: 'cold-rooms',
    title: 'Cold Rooms & Refrigeration',
    icon: <Snowflake size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician', 'staff'],
    description: 'Temperature monitoring for refrigeration units',
    features: [
      {
        title: 'Temperature Logging',
        description: 'Record temperature checks twice daily (AM/PM).',
        steps: [
          'Navigate to Cold Rooms',
          'Click "Log Temperature" or select a room and click "Log Temp"',
          'Select morning or evening check',
          'Enter temperature reading',
          'Perform visual inspection checks',
          'Report any issues found',
          'Submit the log'
        ],
        tip: 'Temperature checks are required twice daily: 8-10 AM and 4-6 PM.'
      },
      {
        title: 'Temperature Alerts',
        description: 'System alerts when temperatures are out of range.',
        steps: [
          'View alerts on the Cold Rooms list page',
          'Alerts appear when temperature exceeds min/max thresholds',
          'Acknowledge alerts after taking corrective action',
          'Temperature history charts show trends'
        ],
        tip: 'Critical alerts are sent immediately when temperature is dangerously high or low.'
      },
      {
        title: 'Visual Inspection',
        description: 'Checklist for daily visual inspections.',
        steps: [
          'Verify door seal is intact',
          'Check condenser coils are clean',
          'Confirm interior is clean',
          'Check for ice buildup (freezers)',
          'Verify interior lights are working',
          'Confirm compressor is running normally'
        ]
      },
      {
        title: 'Compliance Reports',
        description: 'Generate temperature logs for audits.',
        steps: [
          'Go to a cold room detail page',
          'Select date range (7, 14, or 30 days)',
          'View temperature history chart',
          'Export temperature logs for compliance documentation'
        ],
        tip: 'Keep temperature logs for regulatory compliance and food safety audits.'
      },
      {
        title: 'Adding Cold Rooms',
        description: 'Register new refrigeration units.',
        steps: [
          'Navigate to Cold Rooms and click "Add Unit"',
          'Select category: Cold Room, Refrigerator, Freezer, Blast Freezer, or Chiller',
          'Set temperature ranges (min, max, target)',
          'Temperature defaults are set automatically based on category',
          'Adjust ranges if needed for specific requirements'
        ]
      }
    ]
  },
  {
    id: 'generators',
    title: 'Power Generators',
    icon: <Zap size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician'],
    description: 'Generator runtime tracking and maintenance',
    features: [
      {
        title: 'Starting a Generator',
        description: 'Begin runtime tracking when starting a generator.',
        steps: [
          'Navigate to Generators',
          'Find the generator and click "Start"',
          'System begins tracking runtime automatically',
          'Monitor fuel level and load percentage'
        ]
      },
      {
        title: 'Stopping a Generator',
        description: 'Log runtime data when stopping.',
        steps: [
          'Click "Stop" on the running generator',
          'Enter total runtime hours for this session',
          'Log fuel consumed',
          'Record average load percentage',
          'Add any notes about operation',
          'System updates total runtime hours automatically'
        ]
      },
      {
        title: 'Fuel Management',
        description: 'Track fuel levels and consumption.',
        steps: [
          'View current fuel level on generator card',
          'System calculates remaining runtime based on consumption rate',
          'Request fuel when level drops below 25%',
          'Fuel consumption is calculated per running hour'
        ],
        tip: 'Low fuel alerts are sent automatically when fuel drops below 25%.'
      },
      {
        title: 'Maintenance by Hours',
        description: 'Service based on runtime hours, not just calendar.',
        steps: [
          'View current total runtime hours',
          'Check hours until next service',
          'Service intervals: 250 hours (oil change), 500 hours (major service)',
          'Log maintenance activities',
          'System updates next service due hours'
        ]
      }
    ]
  },
  {
    id: 'work-orders',
    title: 'Work Orders',
    icon: <Wrench size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician', 'staff'],
    description: 'Maintenance and repair task management',
    features: [
      {
        title: 'Creating Work Orders',
        description: 'Create maintenance or repair requests.',
        steps: [
          'Navigate to Work Orders',
          'Click "Create Work Order"',
          'Select the asset needing service',
          'Describe the issue or required work',
          'Set priority level (low, medium, high, urgent)',
          'Assign to a technician',
          'Set due date'
        ]
      },
      {
        title: 'Managing Work Orders',
        description: 'Track and update work order status.',
        steps: [
          'View all work orders by status (pending, in progress, completed)',
          'Update status as work progresses',
          'Add notes and time spent',
          'Upload photos of completed work',
          'Close work order when complete'
        ]
      },
      {
        title: 'For Technicians',
        description: 'How to use work orders as a technician.',
        steps: [
          'View assigned work orders',
          'Update status to "In Progress" when starting',
          'Add progress notes',
          'Update to "Completed" when finished',
          'Add photos and documentation'
        ]
      }
    ]
  },
  {
    id: 'fuel',
    title: 'Fuel Requests',
    icon: <Fuel size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician'],
    description: 'Request and track fuel deliveries',
    features: [
      {
        title: 'Requesting Fuel',
        description: 'Submit fuel requests for generators or vehicles.',
        steps: [
          'Navigate to Fuel Requests',
          'Click "New Fuel Request"',
          'Select equipment needing fuel',
          'Enter quantity needed',
          'Set priority level',
          'Add any special instructions',
          'Submit request'
        ]
      },
      {
        title: 'Tracking Fuel Requests',
        description: 'Monitor fuel request status.',
        steps: [
          'View pending, approved, and completed requests',
          'Check delivery status',
          'View fuel consumption history'
        ]
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: <Package size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'staff'],
    description: 'Spare parts and supplies management',
    features: [
      {
        title: 'Inventory Items',
        description: 'Track spare parts and supplies.',
        steps: [
          'View inventory by category',
          'Check stock levels',
          'Set minimum stock alerts',
          'Track item locations'
        ]
      },
      {
        title: 'Stock Management',
        description: 'Update inventory levels.',
        steps: [
          'Add new inventory items',
          'Update quantities when receiving stock',
          'Deduct items when used for maintenance',
          'View stock movement history'
        ]
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <BarChart3 size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'viewer'],
    description: 'Analytics and reporting features',
    features: [
      {
        title: 'Viewing Reports',
        description: 'Access various system reports.',
        steps: [
          'Navigate to Reports',
          'Select report type: Assets, Work Orders, Maintenance, etc.',
          'Set date range',
          'View charts and statistics',
          'Export reports to PDF or Excel'
        ]
      },
      {
        title: 'Available Reports',
        description: 'Types of reports available.',
        steps: [
          'Asset Status Report - overview of all assets',
          'Work Order Summary - completed vs pending',
          'Maintenance History - past services',
          'Temperature Compliance - cold room logs',
          'Fuel Consumption - usage tracking'
        ]
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: <AlertTriangle size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician', 'staff', 'viewer'],
    description: 'Common issues and solutions',
    features: [
      {
        title: 'Cannot Log In',
        description: 'Solutions for login problems.',
        steps: [
          'Verify email address is correct',
          'Check Caps Lock is not on',
          'Try resetting password (contact admin)',
          'Clear browser cache and try again',
          'Ensure you are using the correct login page'
        ],
        tip: 'If you see "400 Bad Request", your account may not be fully created. Contact your administrator.'
      },
      {
        title: 'Page Not Loading',
        description: 'Fix loading issues.',
        steps: [
          'Check internet connection',
          'Refresh the page',
          'Clear browser cache',
          'Try a different browser',
          'Contact support if problem persists'
        ]
      },
      {
        title: 'Data Not Showing',
        description: 'Why you might not see expected data.',
        steps: [
          'Check you have selected the correct company',
          'Verify you have permission to view that data',
          'Check filters are not hiding the data',
          'Contact administrator if you need access'
        ],
        tip: 'Each company has isolated data. Users can only see data for their assigned company.'
      },
      {
        title: 'Mobile Access',
        description: 'Using the system on mobile devices.',
        steps: [
          'Open browser on smartphone/tablet',
          'Navigate to the application URL',
          'Log in with your credentials',
          'System is optimized for mobile use',
          'Technician mobile page available for field staff'
        ]
      }
    ]
  }
];

export function UserManualPage() {
  const { user, isSuperAdmin } = useAuthStore();
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Filter sections based on user role
  const accessibleSections = manualSections.filter(section => 
    section.requiredRole.includes(user?.role || 'staff')
  );

  // Filter by search query
  const filteredSections = searchQuery 
    ? accessibleSections.filter(section => 
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.features.some(f => 
          f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : accessibleSections;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Book className="text-primary-600" />
            User Manual
          </h1>
          <p className="text-gray-500 mt-1">
            Complete guide to using Fixora - showing features for {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search the manual..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Your Role Info */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-600" size={24} />
          <div>
            <p className="font-medium text-blue-900">Your Role: {user?.role?.replace('_', ' ').toUpperCase()}</p>
            <p className="text-sm text-blue-700">
              {user?.companyName && `Company: ${user.companyName}`}
              {user?.companyName && ' • '}
              This manual shows features available to your role
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      {!searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-green-50">
            <CheckCircle className="text-green-600 mb-2" size={24} />
            <p className="font-medium text-green-900">Daily Tasks</p>
            <p className="text-sm text-green-700">Check temperature logs twice daily (AM/PM)</p>
          </div>
          <div className="card p-4 bg-yellow-50">
            <AlertTriangle className="text-yellow-600 mb-2" size={24} />
            <p className="font-medium text-yellow-900">Alerts</p>
            <p className="text-sm text-yellow-700">Respond to temperature and maintenance alerts quickly</p>
          </div>
          <div className="card p-4 bg-blue-50">
            <Bell className="text-blue-600 mb-2" size={24} />
            <p className="font-medium text-blue-900">Notifications</p>
            <p className="text-sm text-blue-700">Check the bell icon for important updates</p>
          </div>
        </div>
      )}

      {/* Manual Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => (
          <div key={section.id} className="card overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                  {section.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              {expandedSections.includes(section.id) ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>
            
            {expandedSections.includes(section.id) && (
              <div className="border-t border-gray-100 p-4 space-y-6">
                {section.features.map((feature, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="font-medium text-gray-900 text-lg">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                    
                    {feature.steps && (
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        {feature.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="text-gray-700 text-sm">{step}</li>
                        ))}
                      </ol>
                    )}
                    
                    {feature.tip && (
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">
                          <strong>Tip:</strong> {feature.tip}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="card bg-gray-50">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} className="text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">Need Help?</p>
            <p className="text-sm text-gray-600">
              Contact your system administrator or supervisor for assistance. 
              Super admins can access additional help resources in the Admin section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
