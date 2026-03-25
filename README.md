# Madihaa Maintenance & Repair

Maintenance tracking app for **Madihaa PVT LTD** (7 shops, chillers/freezers, 2 guest houses) built with **Firebase (Firestore)** and **Cloudinary**.

This repo currently contains a **local test MVP** for staff usage:
- Responsive UI (side navigation on desktop, bottom navigation on mobile)
- Anonymous Firebase session (no separate staff password required)
- Technician identity selection (so tasks show who created/updated them)
- Assets section (CRUD) to register all company items with location + details
- Task CRUD + task timeline logs
- Preventive task scheduling with automatic “Due / Overdue” labels (MVP logic)
- Optional task images (preview + Cloudinary image upload + URLs stored)

## Admin dashboard security
`/admin` is protected with Firebase **Email/Password**.

1) Enable **Email/Password** in Firebase Authentication.
2) Create the admin user in Firebase Auth (example: `operations@madihaa.mv`) with the password you want.
3) Set `NEXT_PUBLIC_ADMIN_EMAIL` in your environment to that admin email.
4) Login at `https://<your-domain>/admin`.

Note: for production, you should also add **Firestore Security Rules** so only the admin can create/update/delete users and tasks via the API.

See [`USER_MANUAL.md`](./USER_MANUAL.md) for how staff should use the app.

## Local development (anonymous Firebase session)

### 1. Install dependencies
```bash
npm install
```

### 2. Run the dev server
```bash
npx next dev -p 3000
```

Open: `http://localhost:3000`

## Test flow (what you can do right now)
1. Select technician in the top header (dropdown).
2. Add your assets in **Assets** (chillers/freezers/refrigerator/AC/IT items/chairs + shop/office/guest house/godown locations).
2. Go to **New Task**.
3. Create a **Repair** or **Preventive** task, assign it to a technician, optionally select an asset, set:
   - logged date
   - progress %
   - status
   - latest update text
   - optional image
4. Open the task to add updates and view the timeline.
5. On the dashboard, preventive tasks appear under **Preventive due** when their computed next reminder date is reached.

## Next steps (after local MVP)
The next iteration will connect:
- Role-based authorization (admin-only actions)
- Automatic reminder generation/scheduling
- Hardening Firestore Security Rules for production

