import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/stores/authStore';
import { 
  Book, Search, ChevronRight, ChevronDown, Shield, 
  Building2, Users, Wrench, Thermometer, Zap, Snowflake,
  FileText, Package, Fuel, LayoutDashboard, CheckCircle,
  AlertTriangle, Smartphone, Settings, LogOut, Plus,
  Edit2, Trash2, Filter, BarChart3, Bell,
  BedDouble, Waves, Droplets, Calendar, Anchor, Utensils, Car, Heart
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
    id: 'feature-toggles',
    title: 'Feature Access Control',
    icon: <Settings size={20} />,
    requiredRole: ['super_admin'],
    description: 'Control which features users can access',
    features: [
      {
        title: 'Managing Feature Access',
        description: 'Enable or disable features per user.',
        steps: [
          'Navigate to Admin > All Users',
          'Click Edit on a user',
          'Scroll to "Feature Access" section',
          'Toggle switches ON/OFF for each feature',
          'All features are ON by default',
          'Save changes'
        ],
        tip: 'Super admins always have access to all features regardless of toggles.'
      },
      {
        title: 'Available Features',
        description: 'Features that can be controlled:',
        steps: [
          'Assets Management - Equipment and inventory',
          'Generators - Power generation monitoring',
          'Cold Rooms - Temperature tracking',
          'Work Orders - Maintenance tasks',
          'Housekeeping - Room management',
          'Pool & Spa - Water quality monitoring',
          'Water & Energy - Desalination and solar',
          'Staff Scheduling - Shifts and time-off',
          'Water Sports - Equipment rentals',
          'Food & Beverage - Kitchen and outlets',
          'Fleet - Vehicles and trips',
          'Security - Incidents and patrols',
          'Guest Experience - Requests and feedback'
        ]
      }
    ]
  },
  {
    id: 'housekeeping',
    title: 'Housekeeping & Rooms',
    icon: <BedDouble size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'staff'],
    description: 'Manage room status, cleaning tasks, and inspections',
    features: [
      {
        title: 'Room Management',
        description: 'Track room status and assignments.',
        steps: [
          'View all rooms with status indicators',
          'Statuses: Vacant Clean, Vacant Dirty, Occupied, DND, Maintenance',
          'Quickly mark rooms as clean',
          'Assign housekeepers to rooms',
          'Track last cleaned timestamps'
        ]
      },
      {
        title: 'Cleaning Tasks',
        description: 'Schedule and track cleaning activities.',
        steps: [
          'Create cleaning tasks for rooms',
          'Assign to housekeepers',
          'Track task status: pending, in-progress, completed, verified',
          'Record items replenished',
          'Report issues found during cleaning'
        ]
      },
      {
        title: 'Room Inspections',
        description: 'Quality control inspections.',
        steps: [
          'Perform inspections after cleaning',
          'Score cleanliness, maintenance, amenities',
          'Use detailed checklist',
          'Upload photos of issues',
          'Mark room as clean or needs attention'
        ]
      }
    ]
  },
  {
    id: 'poolspa',
    title: 'Pool & Spa Management',
    icon: <Waves size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician', 'staff'],
    description: 'Monitor water quality, chemical levels, and safety',
    features: [
      {
        title: 'Water Testing',
        description: 'Record chemical parameters.',
        steps: [
          'Test pH level (target: 7.2-7.8)',
          'Test chlorine level (target: 1.0-3.0 ppm)',
          'Check alkalinity (target: 80-120 ppm)',
          'Record water temperature',
          'Note water clarity and color',
          'Record any chemicals added'
        ],
        tip: 'Tests should be performed at least twice daily for main pools.'
      },
      {
        title: 'Water Quality Alerts',
        description: 'Automatic alerts for out-of-range values.',
        steps: [
          'System alerts when pH is too high or low',
          'Chlorine alerts for safety',
          'View all active alerts',
          'Take corrective action',
          'Mark alerts as resolved'
        ]
      },
      {
        title: 'Pool Assets',
        description: 'Manage pools, spas, and equipment.',
        steps: [
          'Track operational status',
          'Record maintenance activities',
          'Monitor filter systems',
          'Schedule deep cleaning',
          'Track safety equipment'
        ]
      }
    ]
  },
  {
    id: 'waterenergy',
    title: 'Water & Energy Management',
    icon: <Droplets size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'technician'],
    description: 'Monitor water tanks, desalination, and solar power',
    features: [
      {
        title: 'Water Tank Monitoring',
        description: 'Track water storage levels.',
        steps: [
          'View current water levels in all tanks',
          'See percentage full for each tank',
          'Record manual readings',
          'Set alert thresholds',
          'Track water quality parameters'
        ]
      },
      {
        title: 'Desalination Units',
        description: 'Monitor water production.',
        steps: [
          'Track daily production volume',
          'Monitor TDS output quality',
          'Record energy consumption',
          'Schedule maintenance',
          'View production trends'
        ]
      },
      {
        title: 'Solar Power',
        description: 'Track renewable energy generation.',
        steps: [
          'Monitor current output',
          'View daily energy generation',
          'Track system efficiency',
          'Monitor battery storage',
          'Calculate CO2 savings'
        ]
      },
      {
        title: 'Alerts',
        description: 'System alerts for issues.',
        steps: [
          'Low water level alerts',
          'High temperature alerts',
          'Equipment fault notifications',
          'Maintenance due reminders'
        ]
      }
    ]
  },
  {
    id: 'staffscheduling',
    title: 'Staff Scheduling',
    icon: <Calendar size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'staff'],
    description: 'Manage shifts, schedules, and time-off requests',
    features: [
      {
        title: 'Shift Management',
        description: 'Create and manage work shifts.',
        steps: [
          'Define shift patterns',
          'Set start and end times',
          'Assign departments',
          'Configure break durations',
          'Set shift colors for calendar'
        ]
      },
      {
        title: 'Weekly Schedule',
        description: 'Plan staff schedules.',
        steps: [
          'View weekly calendar',
          'Assign staff to shifts',
          'Filter by department',
          'Check staff availability',
          'Copy schedules week to week'
        ]
      },
      {
        title: 'Time-Off Requests',
        description: 'Manage leave requests.',
        steps: [
          'Staff submit requests',
          'Supervisors approve/reject',
          'Track annual leave balances',
          'View pending requests',
          'Check department coverage'
        ]
      },
      {
        title: 'Clock In/Out',
        description: 'Track attendance.',
        steps: [
          'Staff clock in at start',
          'Clock out at end',
          'Record break times',
          'Track overtime hours',
          'View attendance reports'
        ]
      }
    ]
  },
  {
    id: 'watersports',
    title: 'Water Sports & Marine',
    icon: <Anchor size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'staff'],
    description: 'Manage rentals, vessels, and marine equipment',
    features: [
      {
        title: 'Equipment Rentals',
        description: 'Track water sports equipment.',
        steps: [
          'View available equipment',
          'Create rental for guest',
          'Record guest details and room',
          'Set expected return time',
          'Charge fees if applicable',
          'Mark as returned when complete'
        ]
      },
      {
        title: 'Marine Vessels',
        description: 'Manage boats and watercraft.',
        steps: [
          'Track vessel status',
          'Schedule trips',
          'Record fuel usage',
          'Monitor safety equipment',
          'Track maintenance schedules'
        ]
      },
      {
        title: 'Trip Management',
        description: 'Coordinate vessel trips.',
        steps: [
          'Schedule guest excursions',
          'Assign captain and crew',
          'Record passenger count',
          'Track departure and return',
          'Log fuel consumption'
        ]
      }
    ]
  },
  {
    id: 'foodbeverage',
    title: 'Food & Beverage',
    icon: <Utensils size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'staff'],
    description: 'Kitchen assets, outlets, inventory, and daily logs',
    features: [
      {
        title: 'Restaurant Outlets',
        description: 'Manage F&B locations.',
        steps: [
          'Configure outlet details',
          'Set operating hours',
          'Track seating capacity',
          'Assign managers and chefs',
          'Monitor open/closed status'
        ]
      },
      {
        title: 'Kitchen Equipment',
        description: 'Track kitchen assets.',
        steps: [
          'Monitor oven, grill, refrigerator status',
          'Record temperatures for cold storage',
          'Schedule maintenance',
          'Track warranty information',
          'Get alerts for temperature issues'
        ]
      },
      {
        title: 'Daily Logs',
        description: 'Record daily operations.',
        steps: [
          'Log covers for each meal period',
          'Record revenue breakdown',
          'Note special events',
          'Track complaints and compliments',
          'Record temperature checks'
        ]
      },
      {
        title: 'Inventory',
        description: 'F&B stock management.',
        steps: [
          'Track food and beverage stock',
          'Monitor expiry dates',
          'Set reorder points',
          'Record stock transfers',
          'Calculate inventory value'
        ]
      }
    ]
  },
  {
    id: 'fleet',
    title: 'Fleet & Transportation',
    icon: <Car size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'staff'],
    description: 'Vehicle management, trips, fuel, and maintenance',
    features: [
      {
        title: 'Vehicle Management',
        description: 'Track all vehicles.',
        steps: [
          'View vehicle fleet',
          'Check availability status',
          'Monitor mileage',
          'Track fuel type and efficiency',
          'Manage assignments'
        ]
      },
      {
        title: 'Trip Management',
        description: 'Coordinate vehicle usage.',
        steps: [
          'Create trip requests',
          'Assign drivers',
          'Record purpose and destination',
          'Track passenger details',
          'Complete trip with mileage'
        ]
      },
      {
        title: 'Fuel Tracking',
        description: 'Monitor fuel consumption.',
        steps: [
          'Record fuel purchases',
          'Track cost per liter',
          'Calculate efficiency',
          'View fuel reports',
          'Identify anomalies'
        ]
      },
      {
        title: 'Maintenance',
        description: 'Schedule vehicle service.',
        steps: [
          'Track service intervals',
          'Record maintenance history',
          'Set reminders for due service',
          'Log repairs and costs',
          'Monitor vehicle condition'
        ]
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Safety',
    icon: <Shield size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'staff'],
    description: 'Incidents, patrols, keys, and safety equipment',
    features: [
      {
        title: 'Incident Reporting',
        description: 'Log security incidents.',
        steps: [
          'Create incident report',
          'Classify by type and severity',
          'Record location and time',
          'Document description',
          'Upload photos if needed',
          'Assign for investigation'
        ]
      },
      {
        title: 'Security Patrols',
        description: 'Manage guard tours.',
        steps: [
          'Schedule patrol routes',
          'Define checkpoints',
          'Record patrol completion',
          'Note issues found',
          'Generate patrol reports'
        ]
      },
      {
        title: 'Key Control',
        description: 'Track key distribution.',
        steps: [
          'Register all keys',
          'Issue keys to staff',
          'Track key history',
          'Record returns',
          'Report lost keys'
        ]
      },
      {
        title: 'Safety Equipment',
        description: 'Monitor safety systems.',
        steps: [
          'Track fire extinguishers',
          'Monitor smoke detectors',
          'Schedule inspections',
          'Record test results',
          'Get alerts for expired items'
        ]
      },
      {
        title: 'Emergency Contacts',
        description: 'Quick access to emergency numbers.',
        steps: [
          'Store police, fire, medical contacts',
          'Add hospital and ambulance numbers',
          'Organize by priority',
          'One-click calling',
          'Keep contacts updated'
        ]
      }
    ]
  },
  {
    id: 'guestexperience',
    title: 'Guest Experience',
    icon: <Heart size={20} />,
    requiredRole: ['super_admin', 'company_admin', 'supervisor', 'staff'],
    description: 'Requests, feedback, VIP guests, and lost & found',
    features: [
      {
        title: 'Guest Requests',
        description: 'Manage guest service requests.',
        steps: [
          'Receive guest requests',
          'Categorize by type',
          'Set priority level',
          'Assign to department',
          'Track completion status',
          'Record guest feedback'
        ]
      },
      {
        title: 'Guest Feedback',
        description: 'Collect and manage feedback.',
        steps: [
          'Record guest comments',
          'Rate overall experience',
          'Categorize complaints vs compliments',
          'Assign follow-up actions',
          'Track resolution status',
          'Analyze trends'
        ]
      },
      {
        title: 'VIP Guest Management',
        description: 'Special handling for VIP guests.',
        steps: [
          'Create VIP profiles',
          'Record preferences',
          'Track stay history',
          'Set VIP level (Silver, Gold, Platinum, Diamond)',
          'Alert staff of VIP arrivals',
          'Manage special requests'
        ]
      },
      {
        title: 'Lost & Found',
        description: 'Track lost items.',
        steps: [
          'Log found items',
          'Take photos',
          'Assign reference number',
          'Store securely',
          'Record claims',
          'Verify ownership'
        ]
      },
      {
        title: 'Concierge Services',
        description: 'Manage guest activities.',
        steps: [
          'List available services',
          'Book excursions',
          'Arrange dining reservations',
          'Coordinate transportation',
          'Track service delivery'
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
