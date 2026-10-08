# Supply Chain Management System (SCMS)

A role-based web application connecting **Vendors → Wholesalers → Retailers → Consumers**,
built for a BIT final year project.

Stack: **React (Vite)** frontend, **Node.js/Express** backend, **Sequelize ORM** over
**SQLite** by default (PostgreSQL-ready — see `backend/config/db.js`).

## What's included

- `backend/` — REST API: auth (JWT, role-based, admin approval), product catalog,
  transaction-safe order placement/confirmation with automatic inventory sync across
  tiers, low-stock alerts, order tracking/traceability, dashboard summaries.
- `frontend/` — React app with a dashboard per role (Admin, Vendor, Wholesaler,
  Retailer, Consumer), product management, ordering, and an order-tracking timeline.
- `SCMS_Final_Year_Report.docx` (in the outputs folder, alongside this zip) — the
  project report, with the technology-stack section and two appendix screenshots
  filled in from the actual running app.

## Quick start

### 1. Backend

```bash
cd backend
npm install
npm run seed     # creates scms.sqlite and demo accounts (password: password123)
npm start         # runs on http://localhost:5000
```

Demo accounts (all password `password123`):
| Role | Email |
|---|---|
| Admin | admin@scms.com |
| Vendor | vendor@scms.com |
| Wholesaler | wholesaler@scms.com |
| Retailer | retailer@scms.com |
| Consumer | consumer@scms.com |

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev        # runs on http://localhost:5173
```

Open http://localhost:5173 — the login page has one-click demo-login buttons for
each role.

## Using PostgreSQL

Set these in `backend/.env` (create the file):

```
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scms_db
DB_USER=postgres
DB_PASS=yourpassword
```

Then re-run `npm run seed` (or `npm start`, which auto-creates tables).

## What still needs your input in the report

The report's technology stack, implementation approach, testing table, and appendix
screenshots are filled in and match the working system. The following are personal/
institutional details only you can fill in — search for `[...]` in the document:

- University / College name and address, your name, symbol/registration/roll numbers
- Supervisor, HOD, and Principal names
- Submission month/year, project code
- Any additional references in Chapter/Bibliography section

## Notes on scope

This is a complete, working implementation of the core features described in the
report (FR-1 through FR-9): registration/approval, catalog management, tiered
ordering with atomic inventory sync, order lifecycle tracking, low-stock alerts,
traceability, and role-specific dashboards. It's sized for a final-year
demonstration — you may want to extend it (e.g. payment integration, email
notifications, file-upload for product images) depending on your course requirements.
