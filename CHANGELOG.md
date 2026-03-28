# Fixora Changelog

All notable changes to Fixora are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.0] - 2026-03-28

### Added

#### Purchase Workflow Enhancement
- **Detailed Purchase Stages**: Complete multi-stage purchase workflow
  - `need_to_buy` - Technician requests parts
  - `purchase_assigned_technician` - Technician buys and submits bill
  - `purchase_assigned_purchasing` - Purchasing team handles purchase
  - `quotation_in_progress` - Getting supplier quotations
  - `quotation_submitted_for_signature` - Waiting for approval
  - `quotation_approved` - Approved and ready for payment
  - `payment_done` - Payment processed
  - `items_collection_assigned` - Assigned to collect items
  - `items_purchased` - Items collected from supplier
  - `items_received` - Technician receives items
  - `work_started_with_items` - Continuing work with new parts
  - `need_to_buy_again` - Loop back for additional parts

- **Purchase Notifications**: Automatic notifications to relevant roles
  - Supervisors and admins notified when technician needs parts
  - Purchasing team notified when assigned
  - All stakeholders notified at each workflow stage

- **Role-Based Purchase Actions**: Different actions available based on user role
  - Admin/Supervisor: Assign to purchasing or buy by technician
  - Purchasing: Acknowledge, submit quotations, collect items
  - Technician: Submit bills, receive items, mark work complete

#### Activity History Improvements
- **User Names in History**: Activity history now shows who performed each action
- **Relative Timestamps**: Display time as "10 minutes ago", "2 hours ago", etc.
- **Enhanced UI**: Better visual representation of workflow stages

#### Asset Management
- **Delete Asset Option**: Super admins can delete assets with confirmation modal
- **QR Code Functionality**: Generate and download QR codes for assets
- **Edit Asset**: Update asset information directly from asset detail page

#### Work Order Enhancements
- **Optional Asset Selection**: When creating work orders, users can optionally select an existing asset
- **Asset Auto-Fill**: Selecting an asset automatically fills location information
- **Technician Work Orders Fix**: Technicians can now see all assigned work orders in their list
- **Start Work Button**: Fixed visibility issue for "Start Work" button on technician dashboard

### Changed

- **Workflow Stages**: Replaced simplified purchase workflow with detailed 12-stage process
- **Status Badges**: Updated colors and labels for new workflow stages
- **Notification System**: Expanded notification types to include `purchase_request`

### Fixed

- QR code button not working on asset detail page
- Edit button not working on asset detail page
- Technician work orders page showing empty list despite notifications
- Missing user names in activity history
- Activity timestamps not showing relative time

---

## [1.1.0] - 2026-03-20

### Added

- **Work Order System**: Complete work order lifecycle management
  - Create, assign, track, and complete work orders
  - Multiple status stages: raised, assigned, in-progress, fixed, completed
  - Priority levels: Low, Medium, High, Critical
  - Types: Maintenance, Repair, Installation, Inspection

- **Multi-Role Support**: Role-based access control
  - Super Admin: Full system access
  - Admin: Manage work orders and users
  - Supervisor: Assign and oversee work
  - Technician: Execute work orders
  - User: Create and track requests
  - Purchasing: Handle procurement

- **Asset Management**: Track equipment and machinery
  - Asset registration with details
  - QR code generation for mobile access
  - Maintenance history tracking
  - Work order association

- **Real-time Notifications**: Firebase-powered notification system
  - Work order assignments
  - Status changes
  - Comments added
  - Role-based notification routing

- **Activity History**: Complete audit trail
  - Timestamp for all actions
  - User tracking
  - Status transitions
  - Comment history

- **Image Uploads**: Cloudinary integration
  - Upload issue photos
  - Upload completion photos
  - Image galleries in work orders

- **Progress Tracking**: Work completion percentage
  - Update progress from 0-100%
  - Progress comments
  - Visual progress bars

- **Assignment System**: Staff assignment workflow
  - Assign supervisors to work orders
  - Assign technicians to work orders
  - Assignment comments and timestamps

- **Mobile Responsive**: Works on all devices
  - Desktop optimized
  - Tablet compatible
  - Mobile responsive design

### Technical

- React + TypeScript frontend
- Firebase backend (Firestore, Auth, Functions)
- Vite build tool
- Tailwind CSS styling
- React Query for data fetching
- Zustand for state management

---

## [1.0.0] - 2026-03-01

### Added

- **Initial Release**: Base CMMS system
- **User Authentication**: Firebase Auth integration
- **Dashboard**: Overview of system activity
- **Basic Work Orders**: Create and view work orders
- **User Management**: Add and manage system users
- **Profile Management**: User profile settings

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.2.0 | 2026-03-28 | Detailed purchase workflow, activity history improvements, asset management fixes |
| 1.1.0 | 2026-03-20 | Complete work order system, multi-role support, notifications, asset management |
| 1.0.0 | 2026-03-01 | Initial release with basic functionality |

---

## Planned Features

### Upcoming in v1.3.0
- WhatsApp integration for notifications
- AI-powered predictive maintenance
- Advanced analytics dashboard
- Offline mobile app capability
- Barcode scanning for assets
- Inventory management for spare parts
- Preventive maintenance scheduling
- Vendor management module

### Future Enhancements
- Mobile app for technicians (React Native)
- Voice notes in work orders
- Time tracking per work order
- Cost analysis and reporting
- SLA management
- Multi-location support
- Integration with accounting systems
- Custom workflow builder
- API for third-party integrations

---

## Migration Notes

### v1.1.0 to v1.2.0
- Workflow status codes updated - old `quotation_requested` and `quotation_received` replaced with new detailed stages
- Notifications collection may need index updates for new `purchase_request` type
- No data migration required - existing work orders remain functional

### v1.0.0 to v1.1.0
- Firestore security rules updated for new collections
- New indexes required for work_orders queries
- User roles updated - may need to reassign roles to existing users

---

## Documentation

Documentation files added/updated in each version:

### v1.2.0
- Created USER_MANUAL.md
- Created HANDBOOK.md
- Updated README.md with new features
- Created CHANGELOG.md

### v1.1.0
- Created SETUP_GUIDE.md
- Created initial README.md

---

## Contributors

- System Administrator
- Development Team
- Quality Assurance Team

---

## License

MIT License - See LICENSE file for details.
