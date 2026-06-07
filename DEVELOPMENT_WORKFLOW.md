# Development Workflow - Local First

## Approach: Fix Issues Locally, Deploy When Ready

### 1. Local Development Setup

```bash
# Navigate to web app
cd web

# Install dependencies
npm install

# Run locally
npm run dev
```

App will be at: `http://localhost:5173`

### 2. Debug Console Messages

Open browser console (F12) and look for:
- `[DASHBOARD DEBUG] user: ... companyId: ...`
- `[PROJECTS DEBUG] user: ... companyId: ...`

### 3. Fix Data Issues Locally

**If companyId is undefined:**
- Check user document in Firebase Console
- Add companyId to user manually or via script

**If data shows wrong company:**
- Check Firestore documents have correct companyId
- Run migration script to fix assignments

### 4. Test Login Scenarios

1. **Login as Villa Park user**
   - Should only see Villa Park data
   - Check console for correct companyId

2. **Login as Madihaa user**
   - Should only see Madihaa data

3. **Login as Super Admin**
   - Can see all data or switch companies

### 5. When Ready to Deploy

```bash
# Make sure all changes committed
git add -A
git commit -m "fix: all data isolation issues resolved"

# Push to trigger deployment
git push origin main
```

### 6. Verify Deployment

- Check Vercel dashboard shows new deployment
- Test both Villa Park and Madihaa logins on production

## Current Issues to Fix

1. [ ] Villa Park user sees Madihaa data (data isolation)
2. [ ] Check if users have correct companyId assigned
3. [ ] Verify all queries filter by companyId correctly
4. [ ] Test cold room temperature logging
