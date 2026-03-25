# Madihaa Maintenance & Repair

Maintenance tracking app for **Madihaa PVT LTD** (7 shops, chillers/freezers, 2 guest houses).

This repo currently contains a **local test MVP**:
- Responsive UI (side navigation on desktop, bottom navigation on mobile)
- “No login” mode for testing using `localStorage`
- Technician identity selection (so tasks show who created/updated them)
- Assets section (CRUD) to register all company items with location + details
- Task CRUD + task timeline logs
- Preventive task scheduling with auto “due” reminders (MVP logic)
- Optional task images (local MVP stores as `dataUrl` in browser; Cloudinary-ready fields included)

See [`USER_MANUAL.md`](./USER_MANUAL.md) for how staff should use the app.

## Local development (no login required)

### 1. Install dependencies
```bash
npm install
```

### 2. Run the dev server
```bash
npm run dev -p 3000
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
- Firebase Authentication
- Cloud Firestore database
- Automatic reminder generation/scheduling
- Multi-user real-time task updates
- Optional Cloudinary image uploads (store image URLs in Firestore instead of local `dataUrl`)

