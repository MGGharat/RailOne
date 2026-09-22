# RailOne – Railway Ticket Booking & Management System

> Modern, production-grade railway reservation and station management super app built with FastAPI, PostgreSQL / SQLite, React 18, Vite, Tailwind CSS, and TanStack Query.

---

## 🚆 Architecture & Key Features

* **Complete Train Booking Flow**: Search trains by station ID, station code, or city (e.g. Mumbai Central `BCT` to New Delhi `NDLS`), view real-time class availability (`1A`, `2A`, `3A`, `SL`, `CC`), multi-passenger booking, dynamic fare calculation, 10-digit atomic PNR generation, and automated instant cancellation refunds.
* **City-Aware Station Matching & Smart Fallbacks**: Intelligently aggregates trains across metropolitan terminal stations (e.g. Mumbai: `BCT`, `CSMT`, `BDTS`; Delhi: `NDLS`, `DLI`) with direct trains prioritized.
* **Realistic Railway Schedule & Seat Engine**: 50+ real-world Indian railway stations (`CSMT`, `BCT`, `NDLS`, `DLI`, `PUNE`, `MAO`, `SBC`, `HWH`), 32+ seeded express, superfast, Rajdhani, and Vande Bharat trains with realistic intermediate stop times and live GPS simulation.
* **Dual Database Mode**: Zero-configuration default SQLite (`railone.db`) for immediate out-of-the-box local runs, with full PostgreSQL production support.
* **E-Ticket PDF Generation**: ReportLab-powered official Electronic Reservation Slip (ERS) download with PNR, passenger berth assignments, fare breakup, and verification metadata.
* **Role-Based Access Control (RBAC)**: Comprehensive user profiles, passenger management, and full Admin Control Center with real-time station & train management, booking metrics, and security audit logs.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Alembic, Pydantic v2, ReportLab, Passlib/Bcrypt, PyJWT, SQLite / PostgreSQL |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack React Query v5, React Hook Form, Zod, Lucide Icons |
| **Testing** | Pytest, FastAPI TestClient, Vitest, React Testing Library |
| **DevOps** | Docker, Docker Compose, Uvicorn |

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (if not active)
python -m venv .venv
.venv\Scripts\activate   # On Windows
# source .venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Seed the database with stations, trains, and demo accounts
python -c "from app.seed.run_seed import seed_database; seed_database()"

# Start backend server (port 8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

* Backend API Root: `http://127.0.0.1:8000/`
* Swagger OpenAPI Docs: `http://127.0.0.1:8000/api/docs`
* Health Check: `http://127.0.0.1:8000/health`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server (port 5173)
npm run dev
```

* Frontend Web App: `http://127.0.0.1:5173/`

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **User** | `user@railone.demo` | `User@12345` | Ticket Booking, PNR Inquiry, My Bookings, Passenger List |
| **Admin** | `admin@railone.demo` | `Admin@12345` | Control Center, Add Stations, Add Trains, Audit Logs |

---

## 🧪 Running Tests

### Backend Tests (Pytest)
```bash
cd backend
python -m pytest tests/ -v
```
*56 passed tests covering authentication, search, booking, concurrency, cancellation, fares, and admin oversight.*

### Frontend Tests (Vitest & Build)
```bash
cd frontend
npm test
npm run build
```

---

## 🐳 Docker Deployment

To launch the full stack with PostgreSQL and Redis:
```bash
docker-compose up -d --build
```
* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:8000`
