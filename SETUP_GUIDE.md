# Fixora Setup Guide

Complete setup instructions for Fixora - Multi-Tenant CMMS System.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Firebase account (free tier)

---

## 1. Firebase Setup (Free Tier)

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project"
3. Name: `fixora-yourcompany`
4. Enable Google Analytics (optional)
5. Accept terms and create

### Enable Services
1. **Authentication**:
   - Go to Build → Authentication
   - Click "Get Started"
   - Enable "Email/Password" provider
   - Enable "Google" provider (optional)

2. **Firestore Database**:
   - Go to Build → Firestore Database
   - Click "Create Database"
   - Start in production mode
   - Choose region closest to you

3. **Storage** (for images backup):
   - Go to Build → Storage
   - Click "Get Started"
   - Start in production mode

4. **Cloud Functions**:
   - Go to Build → Functions
   - Click "Get Started"
   - Upgrade to Blaze plan (pay-as-you-go, needed for functions)
   - Set budget alerts to stay on free tier

### Get Firebase Config
1. Go to Project Settings (gear icon)
2. Under "Your apps", click "</>" (web app)
3. Name: `cmms-web`
4. Copy the config object

### Create .env files:

**`web/.env`:**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_CLOUDINARY_API_KEY=your_cloudinary_key
VITE_WHATSAPP_API_KEY=your_whatsapp_key_or_mock
```

**`mobile/.env`:**
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
WHATSAPP_API_KEY=your_whatsapp_key_or_mock
```

**`firebase/.env`:**
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
WHATSAPP_API_KEY=your_whatsapp_key_or_mock
WHATSAPP_PHONE_ID=your_phone_number_id
```

---

## 2. Cloudinary Setup (Free Tier)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Get your credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret
4. Add to `.env` files above

---

## 3. WhatsApp API Setup (Optional)

### Option A: Meta WhatsApp Business API (Free tier: 1000 conversations/month)
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create app → Business → WhatsApp
3. Add phone number
4. Get:
   - Phone Number ID
   - Access Token
5. Add to `firebase/.env`

### Option B: Mock (Default)
The system will use Firebase notifications as fallback with console logs for WhatsApp.

---

## 4. Installation

```bash
# Install root dependencies
npm install

# Install web dependencies
cd web && npm install && cd ..

# Install mobile dependencies
cd mobile && npm install && cd ..

# Install firebase dependencies
cd firebase && npm install && cd ..

# Install shared dependencies
cd shared && npm install && cd ..
```

---

## 5. Firebase Emulators (Local Development)

```bash
cd firebase
npm run emulators
```

This starts:
- Auth Emulator: `http://localhost:9099`
- Firestore Emulator: `http://localhost:8080`
- Functions Emulator: `http://localhost:5001`
- UI: `http://localhost:4000`

---

## 6. Running the Applications

### Web Dashboard (Vite)
```bash
npm run dev:web
# Opens at http://localhost:5173
```

### Mobile App (Expo)
```bash
npm run dev:mobile
# Scan QR with Expo Go app
# Or press 'i' for iOS simulator, 'a' for Android
```

---

## 7. Deployment

### Deploy Web to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd web
vercel --prod
```

Or connect GitHub repo to Vercel for auto-deploy.

### Deploy Firebase Functions
```bash
cd firebase
npm run deploy
```

### Deploy Firebase Rules
```bash
cd firebase
npm run deploy:rules
```

---

## 8. Initial Setup (Super Admin & First Company)

### 8.1 Super Admin Setup

The super admin login is configured in the application code. To set your super admin credentials:

1. Edit `web/src/pages/admin/SuperAdminLogin.tsx`
2. Update the credentials check:
```typescript
if (email === 'your-email@domain.com' && password === 'your-password') {
```
3. Or use environment variables for production

**Default Super Admin Portal:**
- URL: `/superadmin/login`
- Credentials: As configured in step above

### 8.2 Create First Company

1. Login as Super Admin at `/superadmin/login`
2. Go to **Companies** page
3. Click **"Add Company"**
4. Fill company details:
   - Company Name (e.g., "Acme Corp")
   - Company Code (e.g., "ACME")
   - Address and contact info
   - Status: Active
5. Click **Create**

### 8.3 Create Company Admin

1. Go to **Users** page
2. Click **"Add User"**
3. Fill user details:
   - Email, name, phone
   - Select the company you just created
   - Role: Company Admin
   - Status: Active
4. Click **Create**
5. Note the user credentials for company admin login

### 8.4 Run Seed Data (Optional)

```bash
cd firebase
npm run seed
```

This creates sample data for testing:
- Sample assets (tagged with company)
- Sample inventory items
- Sample maintenance logs
- Demo users per company

---

## 9. Testing Multi-Tenant Setup

### Test Company Isolation:
1. **Login as Super Admin** at `/superadmin/login`
2. **Create Company A**:
   - Company Name: "Test Company A"
   - Code: "TCA"
3. **Create Company Admin A** assigned to Company A
4. **Create Company B**:
   - Company Name: "Test Company B"
   - Code: "TCB"
5. **Create Company Admin B** assigned to Company B
6. **Login as Company Admin A** at regular `/login`
7. **Create assets** - they will be tagged with Company A
8. **Login as Company Admin B** at `/login`
9. **Verify**: Assets from Company A are NOT visible
10. **Login as Super Admin** and use Company Selector to switch between companies

### Test Work Flow:
1. Login as Company Admin
2. Create an asset (automatically tagged with company)
3. Set maintenance due date to today
4. System auto-generates work order
5. Assign to technician (same company only)
6. Login as Technician on mobile
7. Accept and complete task
8. Verify company context maintained throughout

### Test WhatsApp (Mock):
Check Firebase Functions logs:
```bash
cd firebase
npm run logs
```

---

## 10. Troubleshooting

### Firebase Emulator Issues:
```bash
# Clear emulator data
rm -rf firebase/emulator-data

# Restart emulators
npm run emulators
```

### Mobile App Won't Connect:
- Ensure same WiFi network
- Check `mobile/.env` API URL
- Try `npx expo start --tunnel`

### CORS Issues:
Update `firebase/firebase.json` cors settings or use emulator.

### Company Data Not Isolated:
- Verify users have `companyId` field in Firestore
- Check that assets are created with `companyId` and `companyName`
- Ensure super admin has proper credentials
- Check Firestore security rules include company filtering

### User Can't See Company Data:
- Verify user is assigned to a company
- Check user `isActive` status is true
- Confirm user role permissions in authStore
- Try logging out and back in

### Super Admin Can't Access Companies:
- Verify you're accessing `/superadmin/login` (not regular login)
- Check credentials match configuration in code
- Ensure `role` is set to `'super_admin'` in user object

### Company Selector Not Showing:
- Only appears for super admin users
- Requires at least 2 active companies in the system
- Check that companies have `isActive: true`

---

## Free Tier Limits

| Service | Free Tier | Multi-Tenant Notes |
|---------|-----------|-------------------|
| Firebase Auth | 10,000 users/month | Shared across all companies |
| Firestore | 50K reads/day, 20K writes/day | Per company isolation via queries |
| Cloud Functions | 2M invocations/month | All companies share pool |
| Cloudinary | 25 credits/month | All companies share credits |
| WhatsApp API | 1K conversations/month | Per instance, not per company |
| Vercel | Hobby tier (free) | Single deployment serves all |

**Multi-Tenant Scaling:**
- Each company adds to your total user/asset counts
- Plan for 10-20% overhead for super admin cross-company operations
- Consider Firebase Blaze plan for >5 active companies
- Firestore indexes required for company-based queries

---

## Multi-Tenant Architecture

### Data Model

**Company Collection:**
```
companies/{companyId}
- name: string
- code: string
- address: object
- isActive: boolean
- createdAt: timestamp
```

**User Document:**
```
users/{userId}
- email: string
- name: string
- role: 'super_admin' | 'company_admin' | 'supervisor' | 'technician' | 'staff' | 'viewer'
- companyId: string (null for super admin)
- companyName: string
- isActive: boolean
```

**Asset Document:**
```
assets/{assetId}
- name: string
- assetCode: string
- companyId: string
- companyName: string
- createdBy: string
- ...
```

### Security Rules

Firestore security rules should include:
```javascript
// Users can only read their company's data
allow read: if request.auth.token.companyId == resource.data.companyId 
             || request.auth.token.role == 'super_admin';

// Users can only write to their company
allow write: if request.auth.token.companyId == resource.data.companyId;
```

### Company Context Flow

1. **Login**: User authenticates, `companyId` loaded from user profile
2. **Query**: All Firestore queries filtered by `companyId`
3. **Create**: New assets/work orders automatically tagged with `companyId`
4. **Super Admin**: Can switch `companyId` context via Company Selector
5. **UI**: Components show/hide based on role and company context

## Support

For issues, check:
1. Firebase console logs
2. Browser console (web)
3. Metro bundler logs (mobile)
4. Functions emulator logs
5. Verify company context in authStore
6. Check Firestore documents have correct `companyId`
