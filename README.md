# 🚌 SafeTrack: Real-Time School Van Monitoring System

SafeTrack is a secure, real-time logistics solution for schools in Uganda. It ensures student safety through a "Secure Handshake" verification system (QR/PIN) between drivers and guardians, providing live GPS tracking and automated safety audits for school administrators.

---

## 🚀 Core Features

* **Driver Dashboard**: Live student manifest, route management, and GPS-stamped verification.
* **Secure Handover**: Student pickup/drop-off requires a 6-digit Guardian PIN or QR scan.
* **Admin Command Center**: Real-time stats on students "On Board," total pickups, and safety "Red Flag" alerts.
* **Audit Logs**: Permanent records of every transaction with exact GPS coordinates and timestamps (Africa/Kampala).

---

## 🛠 Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database & Auth**: Supabase (PostgreSQL).
- **Tracking**: Browser Geolocation API.

---

## 📂 Project Structure

```text
SafeTrack/
├── backend/           # Express API, Supabase Client, Controllers
└── frontend/          # React App, Driver & Admin Dashboards

```

---

## ⚙️ Setup Instructions

### 1. Prerequisites

* Node.js (v18+)
* Supabase Account

### 2. Environment Variables

Create a `.env` file in the `backend` folder:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_secure_random_string
PORT=5000

```

### 3. Installation

**Backend:**

```bash
cd backend
npm install
npm run dev

```

**Frontend:**

```bash
cd frontend
npm install
npm run dev

```

---

## 📊 Database Schema (Highlights)

The system relies on a central `pickup_logs` table:

* `id`: Unique transaction ID.
* `student_id`: Reference to Student.
* `action_type`: 'pickup' or 'dropoff'.
* `latitude` / `longitude`: Captured at the moment of scan.
* `verification_hash`: Proof of PIN/QR handshake.

---

## 🛡 Security

* **JWT Authentication**: Secure login for Drivers and Admins.
* **Row Level Security (RLS)**: Database protection via Supabase.
* **Timezone Sync**: All logs are standardized to **EAT (UTC+3)**.

---

## 📝 Roadmap

* [ ] Parent SMS Notifications.
* [ ] Weekly Attendance PDF Reports.
* [ ] Live Map View for Admins.

```





**Now that the README and .gitignore are ready, are you ready to initialize the Git repository and push this to GitHub?**

```
