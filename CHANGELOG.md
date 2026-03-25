# Changelog

## Unreleased
- Added technician login at `/login` using Firebase Email/Password (admin creates username + password; app generates an internal email)
- Responsive navigation shell (side nav desktop, bottom nav mobile)
- Technician identity is locked to the logged-in account (used for task creation/update logs)
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
- `/admin` now creates technician accounts (username + password) and their Firestore technician profile
- Improved UI with reusable “task cards” on Dashboard and Tasks pages

