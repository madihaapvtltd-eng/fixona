# Fixora - Built for Zero Downtime

Fixora is a comprehensive, multi-tenant maintenance management system (CMMS) for tracking work orders, assets, and maintenance operations across multiple companies. Built for Zero Downtime.

## Overview

This Fixora CMMS system provides a complete multi-tenant solution for managing maintenance workflows across multiple organizations. It features company-based data isolation, role-based access control, real-time notifications, asset tracking with QR codes, and a detailed purchase workflow for maintenance parts.

## Features

- **Multi-Tenant Architecture**: Support for multiple companies with complete data isolation
- **Company Management**: Super admin can create and manage multiple companies
- **User Management**: Company-specific user assignment with role-based permissions
- **Multi-Role Support**: Super Admin, Company Admin, Supervisor, Technician, Staff, Viewer
- **Work Order Management**: Full lifecycle from creation to completion
- **Asset Management**: Company-specific asset tracking with QR codes
- **Vehicle Management**: Vehicle categories and fuel request system with odometer tracking
- **Purchase Workflow**: Detailed multi-stage purchase approval process
- **Real-time Notifications**: Instant updates for assignments and status changes
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Activity History**: Complete audit trail with user names and timestamps
- **Image Uploads**: Attach photos to work orders and completion reports
- **Data Isolation**: Each company sees only their own data (assets, users, work orders)

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Mobile**: React Native (Expo)
- **Build Tool**: Vite

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fixora
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase (see SETUP_GUIDE.md for detailed instructions)

4. Start the development server:
```bash
cd web
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
cmms/
├── web/                    # Web application (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utility functions and configs
│   │   ├── hooks/          # Custom React hooks
│   │   └── stores/         # State management
│   └── package.json
├── mobile/                 # Mobile application (React Native)
├── firebase/               # Firebase functions and config
├── shared/                 # Shared types and utilities
├── SETUP_GUIDE.md          # Detailed setup instructions
├── USER_MANUAL.md          # How to use the system
├── HANDBOOK.md             # Comprehensive guide
└── CHANGELOG.md            # Version history
```

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access, manage all companies and users, cross-company visibility |
| **Company Admin** | Manage company users, view company assets and work orders, approve purchases |
| **Supervisor** | Assign technicians, request quotations, approve purchases |
| **Technician** | Start work, mark status, submit purchase requests |
| **Staff** | Create work orders, view company data, limited access |
| **Viewer** | Read-only access to view work orders and assets |

## Multi-Tenant System

### Company Management

The super admin can:
- Create and manage multiple companies
- Assign users to specific companies
- Switch between companies to manage data
- View data across all companies

### Data Isolation

Each company's data is completely isolated:
- **Assets**: Company-specific asset inventory with unique QR codes
- **Users**: Users belong to a single company (except super admin)
- **Work Orders**: Work orders are linked to the user's company
- **Reports**: All reports filtered by company context

### Company Admin Portal

- **URL**: `/superadmin/login`
- **Credentials**: Provided during setup
- **Features**: Company CRUD, User management, Role assignment

## Project Structure

```
cmms/
├── web/                    # Web application (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   │   └── admin/      # Super admin pages
│   │   │       ├── SuperAdminLogin.tsx
│   │   │       ├── CompaniesPage.tsx
│   │   │       └── UsersPage.tsx
│   │   ├── lib/            # Utility functions and configs
│   │   ├── hooks/          # Custom React hooks
│   │   └── stores/         # State management (auth, company)
│   └── package.json
├── mobile/                 # Mobile application (React Native)
├── firebase/               # Firebase functions and config
├── shared/                 # Shared types and utilities
├── SETUP_GUIDE.md          # Detailed setup instructions
├── USER_MANUAL.md          # How to use the system
├── HANDBOOK.md             # Comprehensive guide
└── CHANGELOG.md            # Version history

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[USER_MANUAL.md](USER_MANUAL.md)** - How to use each feature
- **[HANDBOOK.md](HANDBOOK.md)** - Comprehensive system guide
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and updates

## License

MIT License - See LICENSE file for details.

## Support

For support and questions, please contact the system administrator or refer to the documentation files above.
