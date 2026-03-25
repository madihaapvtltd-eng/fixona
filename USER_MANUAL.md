# User Manual (Staff)

This manual explains how staff can use the **Maintenance & Repair** app in the current **local test MVP**.

## 1. Choose your technician name
At the top of the app, use the dropdown **“Working as”** to select your technician identity.
This lets the app record who created/updated each task in the timeline.

## 2. Create a new task
1. Open **New Task**
2. Fill in:
   - **Title** (example: “Preventive check - Chiller 1”)
   - **Select Asset (optional)** (recommended if the asset exists in Assets)
   - **Asset Type** (Shop / Chiller / Freezer / Guest House)
   - **Asset Label** (example: “Chiller-01”)
   - **Task Type** (Preventive or Repair)
   - **Assigned Technician**
   - **Logged Date** (date of the log)
   - **Progress %** (0 to 100)
   - **Status** (Open / In Progress / Completed)
   - **Latest update / note** (short message)
   - **Image (optional)** (add a photo of the issue/repair)
3. If it’s **Preventive**, also set:
   - **Preventive interval (days)**
   - The app will compute an automatic **Next reminder** date
4. Click **Create Task**

## 3. Update an existing task
1. Open **Tasks**
2. Click any task card
3. In the task page:
   - Update **Progress %**
   - Update **Status**
   - Update **Logged Date**
   - Update **Latest update / note**
4. Click **Save update**

Each save creates a new entry in the **Timeline**.

## 4. Timeline (task history)
The **Timeline** shows every update made to the task:
- update notes
- progress changes
- completion events

Deleting a task will also remove its timeline logs (in this MVP).

## 5. Preventive “Due / Overdue”
On the **Dashboard**, preventive tasks appear in **Preventive due** when their computed:
`nextReminderAt <= current time`

In this MVP:
- The app calculates next reminder date using `Logged Date + interval(days)`
- Overdue status is calculated using the current time in the app

## 6. Delete a task
On the task page, click **Delete**.

## 7. Assets (register all items)
Use **Assets** to add and maintain your full item list, including:
- chillers, freezers, refrigerator, AC
- IT items (router, PC, printer, CCTV, etc.)
- chairs and other shop/office items

Each asset includes:
- name
- kind/type
- location type (shop/office/guest house/godown)
- location name (e.g. “Shop 1”)
- optional brand/model/serial/notes

## 7. Important note (local MVP)
This MVP stores tasks in your browser using `localStorage`.
So:
- other staff computers will not see your tasks
- data is not yet shared like a real production system

After you connect Firebase + Vercel deployment, the same manual steps will work with real shared data.

## 8. Images note (local MVP)
In this MVP, images are stored inside your browser storage (as a `dataUrl`).
Later we will switch to **Cloudinary** and store only image URLs in the database.

