# Fixora User Manual

Complete guide on how to use Fixora for each user role.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Role: Regular User](#user-role-regular-user)
3. [User Role: Technician](#user-role-technician)
4. [User Role: Supervisor](#user-role-supervisor)
5. [User Role: Admin](#user-role-admin)
6. [User Role: Purchasing](#user-role-purchasing)
7. [User Role: Super Admin](#user-role-super-admin)
8. [Work Orders](#work-orders)
9. [Assets](#assets)
10. [Purchase Workflow](#purchase-workflow)
11. [Notifications](#notifications)

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

## User Role: Regular User

As a regular user, you can create work orders and track their progress.

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

## User Role: Admin

As an admin, you oversee the system, approve purchases, and manage users.

### Managing Work Orders

- View all work orders in the system
- Reassign work orders if needed
- Delete work orders if required (admin only)

### Approving Purchase Quotations

1. Receive notification when quotation submitted
2. Review item list and costs
3. Click **"Approve & Sign"** or **"Reject & Return"**
4. Approved items move to payment stage

### Processing Payments

1. After quotation approval
2. Click **"Mark as Paid"** when payment processed
3. System notifies next person in workflow

### Managing Assets

1. Go to "Assets" page
2. View asset details, maintenance history, QR codes
3. Edit asset information
4. Delete assets if needed (admin only)

---

## User Role: Purchasing

As purchasing staff, you handle quotations and procurement.

### Acknowledging Purchase Requests

1. Receive notification when assigned
2. Open the work order
3. Click **"Acknowledge & Start Quotation"**
4. Status updates to "Quotation In Progress"

### Getting Quotations

1. Contact suppliers for prices
2. Collect multiple quotations if needed
3. Compare prices and quality

### Submitting Quotations

1. Click **"Submit Quotation for Signature"**
2. Add supplier details and pricing
3. Attach quotation documents if needed
4. Supervisor/Admin will review

### Handling Rejections

If quotation rejected:

1. Review rejection comments
2. Get new quotations
3. Click **"Get New Quotation"** to resubmit

### Collecting Items

After payment is done:

1. Receive assignment notification
2. Collect items from supplier
3. Click **"Mark Items Collected"**
4. Hand over to technician
5. Technician confirms receipt

---

## User Role: Super Admin

As super admin, you have full system control.

### System Administration

- Manage all users and roles
- Delete work orders and assets
- View system-wide analytics
- Configure system settings

### Managing Users

1. Access user management panel
2. Create new users
3. Assign roles
4. Deactivate accounts if needed

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
