# Changelog

## Unreleased
- Added Firebase-backed data (Firestore realtime sync) with anonymous Firebase session for staff (no staff password)
- Responsive navigation shell (side nav desktop, bottom nav mobile)
- Technician identity selector (used for task creation/update logs)
- Assets section (CRUD) to register all company items with location + details
- Task management:
  - create, view, edit (title/asset/technician/logged date/progress/status), and delete
  - timeline logging for each update
- Optional task images:
  - preview images locally, then upload to Cloudinary and store image URLs in Firestore
- Preventive scheduling MVP:
  - set an interval (days) and compute `nextReminderAt`
  - dashboard highlights preventive tasks as “Due / Overdue” based on computed reminder date
- Protected `/admin` dashboard with Firebase Email/Password login (configurable via `NEXT_PUBLIC_ADMIN_EMAIL`)
- Improved UI with reusable “task cards” on Dashboard and Tasks pages

