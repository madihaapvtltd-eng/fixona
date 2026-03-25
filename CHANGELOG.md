# Changelog

## Unreleased
- Added local “no login” mode using `localStorage` for fast MVP testing
- Responsive navigation shell (side nav desktop, bottom nav mobile)
- Technician identity selector (used for task creation/update logs)
- Assets section (CRUD) to register all company items with location + details
- Task management:
  - create, view, edit (title/asset/technician/logged date/progress/status), and delete
  - timeline logging for each update
- Optional task images:
  - add/remove images on a task (stored locally as `dataUrl`)
  - future-ready image fields for Cloudinary URLs
- Preventive scheduling MVP:
  - set an interval (days) and compute `nextReminderAt`
  - dashboard highlights preventive tasks as “Due / Overdue” based on computed reminder date
- Improved UI with reusable “task cards” on Dashboard and Tasks pages

