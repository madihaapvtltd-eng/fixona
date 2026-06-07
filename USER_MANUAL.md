# Fixora User Manual

Complete guide on how to use Fixora for each user role.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Role: Viewer](#user-role-viewer)
3. [User Role: Staff](#user-role-staff)
4. [User Role: Technician](#user-role-technician)
5. [User Role: Supervisor](#user-role-supervisor)
6. [User Role: Company Admin](#user-role-company-admin)
7. [User Role: Super Admin](#user-role-super-admin)
8. [Company Management](#company-management)
9. [Work Orders](#work-orders)
10. [Assets](#assets)
11. [Cold Rooms & Temperature Logging](#cold-rooms--temperature-logging)
12. [Purchase Workflow](#purchase-workflow)
13. [Notifications](#notifications)

---

## Getting Started

### Login

1. Navigate to the Fixora login page
2. Enter your email and password
3. Click "Sign In"
4. You will be redirected to your role-specific dashboard

### Navigation

The main navigation menu includes:
- **Dashboard** - Overview of your tasks and notifications
- **Work Orders** - View and manage work orders
- **Assets** - View assets and their maintenance history
- **Profile** - Manage your account settings

---

## User Role: Viewer

As a viewer, you have read-only access to view work orders and assets within your company.

### Viewing Work Orders

1. Go to "Work Orders" page
2. See all work orders in your company
3. Use filters to find specific work orders:
   - By status (Open, In Progress, Completed)
   - By date range
   - By priority
4. Click on a work order to see full details and activity history

### Viewing Assets

1. Go to "Assets" page
2. View all company assets and their status
3. See asset details, maintenance history, and QR codes
4. Cannot edit or delete assets

### Tracking Progress

- Check the "Activity History" section to see updates
- View assigned staff and their comments
- Receive notifications when status changes

---

## User Role: Staff

As a staff member, you can create work orders and track their progress within your company.

### Creating a Work Order

1. Click "New Work Order" button
2. Fill in the details:
   - **Title**: Brief description of the issue
   - **Type**: Maintenance, Repair, Installation, or Inspection
   - **Priority**: Low, Medium, High, or Critical
   - **Description**: Detailed explanation of the problem
   - **Due Date**: When the work should be completed
   - **Asset (Optional)**: Select if this relates to an existing asset
3. Upload images if needed
4. Click "Create Work Order"

### Viewing Your Work Orders

1. Go to "Work Orders" page
2. Use filters to find specific work orders:
   - By status (Open, In Progress, Completed)
   - By date range
   - By priority
3. Click on a work order to see full details and activity history

### Tracking Progress

- Check the "Activity History" section to see updates
- View assigned staff and their comments
- Receive notifications when status changes

---

## User Role: Technician

As a technician, you handle assigned work orders and update their status.

### Viewing Assigned Work

1. Dashboard shows all work orders assigned to you
2. Click on any work order to view details
3. See the full description and any images attached

### Starting Work

1. Open the assigned work order
2. Click **"Start Work"** button
3. Status changes to "In Progress"
4. Activity is logged with your name and timestamp

### Updating Progress

1. Click **"Update Progress"** button
2. Enter completion percentage (0-100%)
3. Add a comment about current status
4. Progress is tracked in the activity history

### Marking Work as Fixed

1. When work is complete, click **"Mark as Fixed"**
2. Add completion comments
3. Upload completion photos if required
4. Work order moves to verification stage

### When You Need Parts

If the work requires purchasing parts:

1. Click **"Need Parts"** button
2. Add items needed:
   - Item name
   - Quantity
   - Estimated cost
3. Submit the purchase request
4. **Supervisor and Admin will be notified automatically**

### After Parts Are Purchased

1. You will be notified when parts are available
2. Click **"Receive Items"** to confirm receipt
3. Click **"Start Work with Items"** to continue
4. Complete the repair and mark as fixed

---

## User Role: Supervisor

As a supervisor, you assign work to technicians and manage the purchase workflow.

### Assigning Work Orders

1. Open an unassigned work order
2. Click **"Assign Technician"**
3. Select a technician from the list
4. Add assignment comments/instructions
5. Click "Assign"
6. Technician receives notification

### Handling Purchase Requests

When a technician requests parts:

1. You receive a notification
2. Open the work order and review the items needed
3. Choose how to proceed:
   - **"Buy by Tech & Submit Bill"** - Technician buys and submits receipt
   - **"Assign to Purchasing"** - Purchasing team handles the purchase

### Requesting Quotations

If assigned to purchasing:

1. Purchasing team will get quotations
2. You will be notified when quotation is submitted
3. Review and approve or reject

### Approving Quotations

1. Open work order with "Submitted for Signature" status
2. Review the quotation details
3. Click **"Approve & Sign"** to proceed
4. Or click **"Reject & Return"** with comments if issues found

### Marking Payment Done

After approving quotation:

1. Process the payment
2. Click **"Mark as Paid"**
3. Assign someone to collect the items

### Verifying Completed Work

1. When technician marks work as fixed
2. Review completion photos and comments
3. Click **"Complete Work Order"** to close
4. Or return to technician if issues found

---

## User Role: Company Admin

As a company admin, you oversee your company's system, manage company users, approve purchases, and view company reports.

### Managing Company Work Orders

- View all work orders in your company
- Reassign work orders if needed
- Delete work orders if required
- Filter by company context automatically

### Managing Company Users

1. Go to "Users" page (accessible if you have permissions)
2. View all users in your company
3. Create new users and assign roles:
   - Staff, Viewer, Technician, Supervisor, Company Admin
4. Deactivate user accounts if needed
5. Edit user information and role assignments

### Approving Purchase Quotations

1. Receive notification when quotation submitted
2. Review item list and costs
3. Click **"Approve & Sign"** or **"Reject & Return"**
4. Approved items move to payment stage

### Processing Payments

1. After quotation approval
2. Click **"Mark as Paid"** when payment processed
3. System notifies next person in workflow

### Managing Company Assets

1. Go to "Assets" page
2. View asset details, maintenance history, QR codes for your company
3. Edit asset information
4. Delete assets if needed
5. All assets automatically tagged with your company ID

### Data Isolation

- You only see data from your company
- Assets, users, and work orders are filtered by company
- Cannot access other companies' data

---

## User Role: Super Admin

As super admin, you have full system control across all companies.

### System Administration

- Manage all companies in the system
- Manage all users across all companies
- View data across all companies
- Delete work orders and assets from any company
- Configure system settings

### Login

1. Navigate to `/superadmin/login`
2. Enter your super admin credentials
3. Click "Sign In to Super Admin"
4. You will be redirected to the Companies management page

### Managing Companies

1. Access **Companies** page from the menu
2. View all companies in the system
3. Create new companies:
   - Click "Add Company"
   - Enter company name and code
   - Add address and contact information
   - Set company status (Active/Inactive)
4. Edit existing companies
5. Activate or deactivate companies
6. Search and filter companies

### Managing Users Across Companies

1. Access **Users** page from the menu
2. View all users across all companies
3. Filter users by company
4. Create new users:
   - Select company assignment
   - Choose role (Company Admin, Supervisor, Technician, Staff, Viewer)
   - Set user status (Active/Inactive)
5. Edit user information and role
6. Change user company assignment
7. Activate or deactivate users

### Company Context Switching

- Use the **Company Selector** dropdown to switch between companies
- View data filtered by selected company
- All assets, users, and work orders show based on selected company
- Switch company to manage different company data

### Cross-Company Visibility

- View work orders from all companies
- View assets from all companies
- View users from all companies
- Generate system-wide reports

### Deleting Records

**Work Orders:**
1. Open work order
2. Click **"Delete"** button
3. Confirm deletion
4. Work order is permanently removed

**Assets:**
1. Go to asset detail page
2. Click **"Delete Asset"** button
3. Confirm deletion
4. Asset and all history removed

**Companies:**
1. Go to Companies page
2. Click "Delete" on the company
3. Confirm deletion
4. Note: Deleting a company may affect associated users

**Users:**
1. Go to Users page
2. Click "Delete" on the user
3. Confirm deletion
4. User account is permanently removed

---

## Company Management

### Overview

Fixora supports multiple companies with complete data isolation. Each company has its own:
- Assets and inventory
- Users and staff
- Work orders and maintenance history
- Reports and analytics

### Creating a Company (Super Admin Only)

1. Login as Super Admin at `/superadmin/login`
2. Go to **Companies** page
3. Click **"Add Company"**
4. Fill in company details:
   - **Company Name**: Full legal name
   - **Company Code**: Short unique identifier
   - **Address**: Physical location
   - **Contact Info**: Phone, email, website
   - **Status**: Active or Inactive
5. Click **"Create"**

### Managing Company Users

**Assigning Users to a Company:**
1. Go to **Users** page
2. Click **"Add User"**
3. Select company from dropdown
4. Assign role based on responsibilities:
   - **Company Admin**: Full company management
   - **Supervisor**: Assign work and approve purchases
   - **Technician**: Execute maintenance work
   - **Staff**: Create work orders
   - **Viewer**: Read-only access
5. Set user as Active
6. User can now login and see only their company data

**Changing User Company:**
1. Find user in Users list
2. Click **"Edit"**
3. Change company assignment
4. Save changes
5. User will now see data from new company

### Data Isolation Features

**Automatic Filtering:**
- Users see only their company's assets
- Work orders filtered by user's company
- Reports show only company-specific data
- QR codes include company context

**Cross-Company Protection:**
- Company admins cannot see other companies
- Users cannot access data outside their company
- Assets are tagged with company ID on creation
- All queries filtered by company context

### Company Selector (Super Admin)

When logged in as Super Admin:
1. See **Company Selector** dropdown in header
2. Switch between companies to manage data
3. Create assets for specific company
4. View reports by company
5. All actions apply to selected company context

### Best Practices

**For Super Admin:**
- Create companies before adding users
- Assign at least one Company Admin per company
- Use company codes that are easy to identify
- Deactivate (don't delete) companies when not in use

**For Company Admin:**
- Assign appropriate roles based on job function
- Keep user list updated - deactivate old employees
- Use consistent naming for assets
- Train users on company-specific procedures

---

## Work Orders

### Status Meanings

| Status | Meaning |
|--------|---------|
| **Raised** | Issue reported, waiting for assignment |
| **Assigned to Supervisor** | Supervisor assigned, reviewing |
| **Assigned to Technician** | Technician assigned, ready to start |
| **In Progress** | Technician working on issue |
| **Need to Buy** | Parts required, purchase workflow started |
| **Purchase Assigned to Technician** | Technician will buy and submit bill |
| **Purchase Assigned to Purchasing** | Purchasing team handling purchase |
| **Quotation In Progress** | Getting supplier quotations |
| **Submitted for Signature** | Waiting for approval |
| **Quotation Approved** | Approved, ready for payment |
| **Payment Done** | Payment processed |
| **Items Collection Assigned** | Assigned to collect items |
| **Items Purchased** | Items collected from supplier |
| **Items Received** | Technician received items |
| **Work Started with Items** | Continuing work with new parts |
| **Fixed** | Work completed, waiting verification |
| **Completed** | Work order closed |

### Activity History

Every action is logged with:
- **Who** performed the action (user name)
- **When** it happened (timestamp)
- **What** was done (status change, comment, assignment)
- **How long ago** (relative time like "10 minutes ago")

---

## Assets

### Viewing Assets

1. Go to "Assets" page
2. See list of all assets with status
3. Click on asset to view details:
   - Asset information
   - QR code for mobile access
   - Maintenance history
   - Associated work orders

### Asset Actions

- **View QR Code** - Generate and download QR code
- **Edit Asset** - Update asset information
- **Delete Asset** - Remove asset (Super Admin only)

### Asset Work Orders

View all work orders related to a specific asset to track its maintenance history.

---

## Cold Rooms & Temperature Logging

### Overview

Cold Rooms feature allows monitoring of refrigeration units with **3x daily temperature checks**:
- **Morning (AM)**: 8:00 - 10:00
- **Midday (MID)**: 12:00 - 14:00  
- **Evening (PM)**: 16:00 - 18:00

### Cold Room Status Dashboard

**Stats Cards** (clickable to filter):
- **Normal** - Units within temperature range
- **Warning** - Units near limit
- **Critical** - Units out of range (red alerts)
- **Today's Checks** - Shows completed checks (e.g., "3/24" means 3 out of 24 total checks done)

**Notifications Banner**:
- Displays warnings for units near limit
- Displays critical alerts for out-of-range temperatures
- Shows current temperature and allowed range
- Click "View Details" to see full unit information

### Today's Temperature Check Status

Mini cards show per-unit status:
- **AM/MID/PM indicators** - Green checkmark when logged, gray when pending
- **3 Temperature badges** - Shows actual logged temps:
  - Blue badge: Morning temp
  - Orange badge: Midday temp
  - Purple badge: Evening temp

### Logging Temperature

1. Click **"Log Temperature"** button
2. Select cold room from dropdown
3. Choose check time (Morning/Afternoon/Night)
4. Enter temperature reading
5. Optional: Add humidity, visual checks, notes
6. Click **"Save Temperature Log"**

### Visual Check Items

When logging, you can verify:
- Door seal intact
- Condenser coils clean
- Interior clean
- No excessive ice buildup
- Lights working
- Compressor running normally

### Temperature Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| **Normal** | Green | Within range |
| **Warning** | Yellow | Near limit (needs attention) |
| **Critical** | Red | Out of range (immediate action) |

### Cold Room Detail Page

Shows:
- Current temperature with gauge
- Min/Max/Target temperature settings
- **All 3 daily temperatures** with timestamps
- Temperature history graph
- Maintenance records
- QR code for mobile access

---

## Purchase Workflow

### Overview

When parts are needed, the system follows this workflow:

```
Technician Needs Parts
    ↓
Admin/Supervisor Notified
    ↓
Decision: Buy by Tech OR Assign Purchasing
    ↓
[If Tech]: Submit Bill → Approval → Payment → Collect
[If Purchasing]: Quotation → Approval → Payment → Collect
    ↓
Items Received by Technician
    ↓
Work Continues
```

### Notifications

Everyone involved receives notifications at each stage:
- **Technician** - When parts assigned, when items ready
- **Supervisor** - When purchase requested, when quotation submitted
- **Admin** - When approval needed, when payment required
- **Purchasing** - When assigned, when to collect items

### Rejection and Retry

If quotation is rejected:
1. Purchasing gets notified with comments
2. Gets new quotation
3. Resubmits for approval
4. Loop continues until approved

---

## Notifications

### Notification Types

| Type | When Received |
|------|---------------|
| **Work Order Assigned** | When you are assigned to a work order |
| **Status Changed** | When work order status updates |
| **Purchase Request** | When technician needs parts |
| **Quotation Submitted** | When quotation ready for review |
| **Comment Added** | When someone comments on your work order |

### Managing Notifications

1. Click notification bell icon to see all
2. Unread notifications show badge count
3. Click notification to go to relevant work order
4. Notifications marked as read automatically when viewed

### Notification Settings

Users receive notifications based on:
- Their role (supervisor, admin, purchasing, technician)
- Direct assignments
- Broadcast notifications to all users

---

## Tips & Best Practices

### For All Users

- **Check notifications regularly** - Stay updated on work order changes
- **Add detailed comments** - Help others understand context
- **Upload clear images** - Makes diagnosis easier
- **Update progress regularly** - Keeps everyone informed

### For Technicians

- Start work immediately when assigned
- Update progress frequently (at least daily)
- Upload completion photos
- Request parts early if needed

### For Supervisors

- Assign work orders promptly
- Provide clear instructions in comments
- Review purchase requests quickly
- Verify completed work thoroughly

### For Purchasing

- Get multiple quotations when possible
- Submit detailed pricing information
- Collect items promptly after payment
- Keep records of all purchases

---

## Troubleshooting

### Cannot See Work Orders

- Check your role permissions
- Ensure filters are not hiding them
- Refresh the page
- Contact admin if issue persists

### Buttons Not Visible

- Check if you have the correct role for that action
- Verify work order status allows that action
- Ensure you are assigned to the work order

### Notifications Not Received

- Check notification settings
- Verify you are assigned to the work order or have the correct role
- Check browser notification permissions

---

## Support

For additional help:
- Contact your system administrator
- Refer to the HANDBOOK.md for detailed technical information
- Check CHANGELOG.md for recent updates
