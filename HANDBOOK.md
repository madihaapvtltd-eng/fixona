# Fixora Handbook

Comprehensive technical guide for Fixora administrators and developers.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Workflow Engine](#workflow-engine)
5. [Notification System](#notification-system)
6. [File Structure](#file-structure)
7. [Key Components](#key-components)
8. [API Endpoints](#api-endpoints)
9. [Security](#security)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Client    │     │  Mobile Client  │     │  Admin Client   │
│   (React/Vite)  │     │ (React Native)  │     │   (React/Vite)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Firebase Services    │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │  Firestore DB   │    │
                    │  └─────────────────┘    │
                    │  ┌─────────────────┐    │
                    │  │  Authentication │   │
                    │  └─────────────────┘    │
                    │  ┌─────────────────┐    │
                    │  │ Cloud Functions │   │
                    │  └─────────────────┘    │
                    │  ┌─────────────────┐    │
                    │  │ Cloud Storage   │    │
                    │  └─────────────────┘    │
                    └─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    External Services    │
                    │  ┌─────────────────┐    │
                    │  │  Cloudinary   │    │
                    │  │  (Images)     │    │
                    │  └─────────────────┘    │
                    │  ┌─────────────────┐    │
                    │  │  WhatsApp API   │    │
                    │  │(Future Feature)│   │
                    │  └─────────────────┘    │
                    └─────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Lucide Icons |
| **State Management** | Zustand |
| **Data Fetching** | React Query (TanStack Query) |
| **Backend** | Firebase (Firestore, Auth, Functions) |
| **Image Storage** | Cloudinary |
| **Mobile** | React Native (Expo) |

---

## Database Schema

### Collections

#### users
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'supervisor' | 'technician' | 'purchasing' | 'user';
  department?: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}
```

#### work_orders
```typescript
{
  id: string;
  woNumber: string;           // Auto-generated: WO-YYYYMMDD-XXXX
  title: string;
  description: string;
  type: 'maintenance' | 'repair' | 'installation' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;              // See Workflow Stages
  
  // Assignment
  supervisorId?: string;
  supervisorName?: string;
  supervisorAssignedAt?: string;
  supervisorComment?: string;
  
  technicianId?: string;
  technicianName?: string;
  technicianAssignedAt?: string;
  technicianComment?: string;
  
  // Asset Reference
  assetId?: string;
  assetName?: string;
  location?: string;
  
  // Purchase Workflow
  needsPurchase: boolean;
  purchaseItems: Array<{
    name: string;
    quantity: number;
    estimatedCost: number;
  }>;
  purchaseCost: number;
  
  // Progress
  progress: number;            // 0-100
  progressComment?: string;
  progressUpdatedAt?: string;
  
  // Media
  images: string[];            // Issue images
  completionImages: string[];  // Completion photos
  
  // Workflow Tracking
  workflowHistory: Array<{
    stage: string;
    timestamp: string;
    userId: string;
    userName: string;
    comment?: string;
    progress?: number;
  }>;
  
  stageTimestamps: Record<string, string>;
  stageDurations: Record<string, number>;  // Days per stage
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  
  // Created by
  createdBy: string;
  createdByName: string;
}
```

#### assets
```typescript
{
  id: string;
  name: string;
  type: string;
  location: string;
  department?: string;
  description?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: Timestamp;
  warrantyExpiry?: Timestamp;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  qrCode?: string;              // Generated QR code URL
  images?: string[];
  lastMaintenance?: Timestamp;
  nextScheduledMaintenance?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### notifications
```typescript
{
  id: string;
  type: 'workorder_created' | 'workorder_assigned' | 'workorder_updated' | 
        'workorder_completed' | 'status_changed' | 'comment_added' | 'purchase_request';
  title: string;
  message: string;
  workOrderId: string;
  workOrderNumber: string;
  recipientId?: string;         // Specific user ID
  recipientRole?: string;       // Or broadcast to role
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  read: boolean;
  readAt?: Timestamp;
}
```

---

## User Roles & Permissions

### Role Hierarchy

```
super_admin (all permissions)
    ↓
admin (work orders, users, approvals)
    ↓
supervisor (assignments, quotations)
    ↓
purchasing (procurement)
    ↓
technician (work execution)
    ↓
user (create requests)
```

### Permission Matrix

| Permission | Super Admin | Admin | Supervisor | Technician | Purchasing | User |
|------------|-------------|-------|------------|------------|------------|------|
| Create Work Order | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View All Work Orders | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Own Work Orders | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assign Supervisor | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Assign Technician | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Start Work | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Update Progress | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Request Purchase | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Approve Quotation | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Process Payment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Get Quotations | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| Complete Work Order | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Work Order | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Assets | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Delete Asset | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## Workflow Engine

### Workflow Stages

Defined in `web/src/lib/workflow.ts`:

```typescript
export const WORKFLOW_STAGES = {
  RAISED: { code: 'raised', assignedTo: 'user', ... },
  ASSIGNED_TO_SUPERVISOR: { code: 'assigned_to_supervisor', assignedTo: 'supervisor', ... },
  ASSIGNED_TO_TECHNICIAN: { code: 'assigned_to_technician', assignedTo: 'technician', ... },
  IN_PROGRESS: { code: 'in_progress', assignedTo: 'technician', ... },
  NEED_TO_BUY: { code: 'need_to_buy', assignedTo: 'supervisor', ... },
  PURCHASE_ASSIGNED_TECHNICIAN: { code: 'purchase_assigned_technician', assignedTo: 'technician', ... },
  PURCHASE_ASSIGNED_PURCHASING: { code: 'purchase_assigned_purchasing', assignedTo: 'purchasing', ... },
  QUOTATION_IN_PROGRESS: { code: 'quotation_in_progress', assignedTo: 'purchasing', ... },
  QUOTATION_SUBMITTED_FOR_SIGNATURE: { code: 'quotation_submitted_for_signature', assignedTo: 'admin', ... },
  QUOTATION_APPROVED: { code: 'quotation_approved', assignedTo: 'supervisor', ... },
  PAYMENT_DONE: { code: 'payment_done', assignedTo: 'supervisor', ... },
  ITEMS_COLLECTION_ASSIGNED: { code: 'items_collection_assigned', assignedTo: 'purchasing', ... },
  ITEMS_PURCHASED: { code: 'items_purchased', assignedTo: 'technician', ... },
  ITEMS_RECEIVED: { code: 'items_received', assignedTo: 'technician', ... },
  WORK_STARTED_WITH_ITEMS: { code: 'work_started_with_items', assignedTo: 'technician', ... },
  FIXED: { code: 'fixed', assignedTo: 'technician', ... },
  COMPLETED: { code: 'completed', assignedTo: 'supervisor', ... },
  REJECTED: { code: 'rejected', assignedTo: 'supervisor', ... },
  QUOTATION_REJECTED: { code: 'quotation_rejected', assignedTo: 'purchasing', ... },
  NEED_TO_BUY_AGAIN: { code: 'need_to_buy_again', assignedTo: 'supervisor', ... },
};
```

### Workflow Transitions

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   RAISED    │────▶│ ASSIGNED_TO_SUP  │────▶│ ASSIGNED_TO_TECH  │
└─────────────┘     └──────────────────┘     └─────────┬─────────┘
                                                       │
                              ┌────────────────────────┼────────────────────────┐
                              │                        │                        │
                              ▼                        ▼                        ▼
                       ┌─────────────┐        ┌──────────────┐        ┌──────────────┐
                       │ IN_PROGRESS │        │  NEED_TO_BUY │        │ NEED_TO_BUY  │
                       │             │        │              │        │    AGAIN     │
                       └──────┬──────┘        └──────┬───────┘        └──────┬───────┘
                              │                        │                        │
                              │         ┌──────────────┴──────────────┐        │
                              │         │                             │        │
                              │    ┌────▼─────┐              ┌────────▼───┐   │
                              │    │ BUY BY   │              │ PURCHASING │   │
                              │    │   TECH   │              │   TEAM     │   │
                              │    └────┬─────┘              └─────┬──────┘   │
                              │         │                        │          │
                              │    ┌────▼────────────────────────▼────┐     │
                              │    │                                   │     │
                              │    ▼                                   ▼     │
                              │ ┌──────────────┐              ┌─────────────┐
                              │ │ BILL_SUBMITTED│             │ QUOTATION_IN │
                              │ │              │              │   PROGRESS   │
                              │ └──────────────┘              └──────┬──────┘
                              │                                      │
                              │                             ┌────────▼────────┐
                              │                             │  SUBMITTED_FOR  │
                              │                             │   SIGNATURE     │
                              │                             └────────┬────────┘
                              │                                      │
                              │                             ┌────────┴────────┐
                              │                             │                 │
                              │                        ┌────▼────┐      ┌────▼────┐
                              │                        │APPROVED │      │REJECTED │
                              │                        └────┬────┘      └────┬────┘
                              │                             │                │
                              │                        ┌────▼────┐      ┌────▼────┐
                              │                        │PAYMENT  │      │NEW_QUOTE│
                              │                        │  DONE   │      └────┬────┘
                              │                        └────┬────┘           │
                              │                        ┌────▼────┐      ┌────┴────┐
                              │                        │COLLECT  │      │ LOOP    │
                              │                        │ASSIGNED │      │ BACK    │
                              │                        └────┬────┘      └─────────┘
                              │                        ┌────▼────┐
                              │                        │ ITEMS   │
                              │                        │PURCHASED│
                              │                        └────┬────┘
                              │                        ┌────▼────┐
                              │                        │ RECEIVED│
                              │                        └────┬────┘
                              │                        ┌────▼──────────────┐
                              │                        │ WORK_STARTED_WITH │
                              │                        │      ITEMS        │
                              │                        └────────┬──────────┘
                              │                                 │
                              │                        ┌────────▼─────────┐
                              │                        │                  │
                              │                   ┌─────▼────┐       ┌────▼─────┐
                              │                   │  FIXED   │       │ NEED_TO  │
                              └──────────────────▶│          │       │BUY_AGAIN │
                                                  └─────┬────┘       └─────────┘
                                                        │
                                                   ┌────▼────┐
                                                   │COMPLETED│
                                                   └─────────┘
```

---

## Notification System

### Notification Types

| Type | Trigger | Recipients |
|------|---------|------------|
| workorder_created | New work order created | Supervisors, Admins |
| workorder_assigned | Staff assigned | Assigned user |
| workorder_updated | Status changes | Assigned users, Creator |
| workorder_completed | Work order finished | All involved parties |
| status_changed | Any status transition | Relevant role holders |
| comment_added | New comment | Work order participants |
| purchase_request | Technician needs parts | Supervisors, Admins |

### Notification Routing

```typescript
// User-specific notification
{
  recipientId: 'user_id',
  recipientRole: null,
  // Only this user receives
}

// Role-based notification
{
  recipientId: 'all',
  recipientRole: 'supervisor',
  // All supervisors receive
}

// Broadcast notification
{
  recipientId: 'all',
  recipientRole: null,
  // Everyone receives
}
```

### Real-time Updates

Notifications use Firestore `onSnapshot` for real-time updates:

```typescript
// Separate queries to avoid composite index requirement
const userQuery = query(
  collection(db, 'notifications'),
  where('recipientId', '==', user.id),
  orderBy('createdAt', 'desc'),
  limit(25)
);

const broadcastQuery = query(
  collection(db, 'notifications'),
  where('recipientId', '==', 'all'),
  orderBy('createdAt', 'desc'),
  limit(25)
);
```

---

## File Structure

### Web Application

```
web/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Generic UI components
│   │   └── layout/          # Layout components
│   ├── pages/               # Page components
│   │   ├── dashboard/
│   │   ├── workOrders/
│   │   ├── assets/
│   │   └── auth/
│   ├── lib/                 # Utility functions
│   │   ├── firebase.ts      # Firebase config
│   │   ├── workflow.ts      # Workflow definitions
│   │   ├── notificationHelpers.ts
│   │   └── utils.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   └── useWorkOrders.ts
│   ├── stores/              # State management (Zustand)
│   │   ├── authStore.ts
│   │   └── workOrderStore.ts
│   ├── types/               # TypeScript types
│   └── styles/              # Global styles
├── public/                  # Static assets
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Key Files

| File | Purpose |
|------|---------|
| `workflow.ts` | Workflow stage definitions |
| `notificationHelpers.ts` | Notification creation functions |
| `usePermissions.ts` | Role-based permission checks |
| `WorkOrderDetailPage.tsx` | Main work order management UI |
| `AssetDetailPage.tsx` | Asset management with QR/edit/delete |
| `CreateWorkOrderPage.tsx` | Work order creation with optional asset |
| `WorkOrdersPage.tsx` | Work order listing with role-based filtering |

---

## Key Components

### WorkOrderDetailPage

Main work order management page with:
- Status badge with color coding
- Workflow action buttons (role-based)
- Purchase workflow UI
- Activity history with user names and relative time
- Assignment management
- Progress tracking
- Image galleries

### AssetDetailPage

Asset management page with:
- Asset information display
- QR code generation and download
- Edit asset modal
- Delete asset (super admin only)
- Associated work orders list

### NotificationBell

Real-time notification component:
- Shows unread count
- Lists recent notifications
- Click to navigate to work order
- Auto-mark as read

---

## Security

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.role in ['admin', 'super_admin']);
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.role in ['admin', 'super_admin']);
    }
    
    // Work orders - role-based access
    match /work_orders/{workOrderId} {
      allow read: if request.auth != null && 
        (request.auth.token.role in ['admin', 'super_admin', 'supervisor'] ||
         resource.data.createdBy == request.auth.uid ||
         resource.data.technicianId == request.auth.uid ||
         resource.data.supervisorId == request.auth.uid);
      
      allow create: if request.auth != null;
      
      allow update: if request.auth != null && 
        (request.auth.token.role in ['admin', 'super_admin', 'supervisor'] ||
         resource.data.technicianId == request.auth.uid);
      
      allow delete: if request.auth != null && 
        request.auth.token.role == 'super_admin';
    }
    
    // Notifications - user or role-based
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        (resource.data.recipientId == request.auth.uid ||
         resource.data.recipientId == 'all' ||
         request.auth.token.role == resource.data.recipientRole);
      
      allow create: if request.auth != null;
      
      allow update: if request.auth != null && 
        (resource.data.recipientId == request.auth.uid);
    }
  }
}
```

### Authentication

- Firebase Authentication with email/password
- Custom claims for role storage
- Token refresh handled automatically
- Role-based route protection in React Router

---

## Deployment

### Build

```bash
cd web
npm run build
```

### Deploy to Firebase Hosting

```bash
cd web
npm run build
firebase deploy --only hosting
```

### Environment Variables

Create `.env` in `web/`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## Troubleshooting

### Common Issues

**Issue**: Blank/white page after refreshing (solved in v1.2.2)
**Solution**: Auth loading state now starts as `false`. If still stuck:
1. Click the red "Stuck? Click to Reset" button on loading screen
2. Or open DevTools → Application → Storage → Clear site data → Refresh

**Issue**: "Minified React error #31" with component keys (solved in v1.2.2)
**Solution**: Fixed StatCard icon rendering. If error persists:
1. Clear browser cache completely
2. Hard refresh with Ctrl+Shift+R
3. Check that all icon imports are from 'lucide-react'

**Issue**: 404 error when editing projects directly via URL (solved in v1.2.2)
**Solution**: Router order fixed and Vercel rewrites updated. Access `/projects/:id/edit` directly now works.

**Issue**: Technician can't see assigned work orders
**Solution**: Check WorkOrdersPage.tsx query - ensure it filters by assigned technicianId client-side if needed

**Issue**: Notifications not appearing
**Solution**: Verify Firestore indexes for notifications collection, check recipientId/recipientRole fields

**Issue**: Purchase workflow buttons not showing
**Solution**: Check workOrder.status matches workflow stage codes exactly

**Issue**: Activity history not showing user names
**Solution**: Ensure workflowHistory entries include userName field when updating status

**Issue**: Images not uploading
**Solution**: Verify Cloudinary cloud name and upload preset in environment variables

### Firestore Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recipientId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recipientRole", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "work_orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'cmms:*');
```

---

## Maintenance

### Regular Tasks

- **Weekly**: Check notification delivery rates
- **Monthly**: Review and optimize Firestore indexes
- **Quarterly**: Update dependencies (`npm update`)
- **Annually**: Security audit and role review

### Backup

Firestore provides automatic backups. For additional safety:

```bash
# Export Firestore data
firebase firestore:export ./backups/$(date +%Y%m%d)
```

---

## Support & Contact

- **System Admin**: [Contact Information]
- **Technical Lead**: [Contact Information]
- **Documentation**: See README.md, USER_MANUAL.md

---

## Version

Current Version: **1.2.2**

Last Updated: March 31, 2026
