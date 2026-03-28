# Fixora - Built for Zero Downtime

Fixora is a comprehensive maintenance management system for tracking work orders, assets, and maintenance operations. Built for Zero Downtime.

## Overview

This Fixora CMMS system provides a complete solution for managing maintenance workflows across organizations. It supports multiple user roles, real-time notifications, asset tracking with QR codes, and a detailed purchase workflow for maintenance parts.

## Features

- **Multi-Role Support**: Super Admin, Admin, Supervisor, Technician, Purchasing, User
- **Work Order Management**: Full lifecycle from creation to completion
- **Asset Management**: Track assets with QR codes and maintenance history
- **Purchase Workflow**: Detailed multi-stage purchase approval process
- **Real-time Notifications**: Instant updates for assignments and status changes
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Activity History**: Complete audit trail with user names and timestamps
- **Image Uploads**: Attach photos to work orders and completion reports

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
| **Super Admin** | Full system access, can delete work orders and assets |
| **Admin** | Manage work orders, approve quotations, process payments |
| **Supervisor** | Assign technicians, request quotations, approve purchases |
| **Technician** | Start work, mark status, submit purchase requests |
| **Purchasing** | Get quotations, purchase items, collect from suppliers |
| **User** | Create work orders, view own requests |

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[USER_MANUAL.md](USER_MANUAL.md)** - How to use each feature
- **[HANDBOOK.md](HANDBOOK.md)** - Comprehensive system guide
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and updates

## License

MIT License - See LICENSE file for details.

## Support

For support and questions, please contact the system administrator or refer to the documentation files above.
