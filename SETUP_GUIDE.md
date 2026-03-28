# Fixora Setup Guide

Complete setup instructions for Fixora.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

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

## 8. Initial Setup (First Admin User)

1. Create first admin user via web app
2. Run seed data script:
```bash
cd firebase
npm run seed
```

This creates:
- Sample assets
- Sample inventory items
- Sample maintenance logs
- Demo technicians

---

## 9. Testing Locally

### Test Work Flow:
1. Login as Admin
2. Create an asset
3. Set maintenance due date to today
4. System auto-generates work order
5. Assign to technician
6. Login as Technician on mobile
7. Accept and complete task
8. Verify inventory deduction

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

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Firebase Auth | 10,000 users/month |
| Firestore | 50K reads/day, 20K writes/day |
| Cloud Functions | 2M invocations/month |
| Cloudinary | 25 credits/month |
| WhatsApp API | 1K conversations/month |
| Vercel | Hobby tier (free) |

---

## Support

For issues, check:
1. Firebase console logs
2. Browser console (web)
3. Metro bundler logs (mobile)
4. Functions emulator logs
