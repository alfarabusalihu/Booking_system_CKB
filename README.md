# LK Train Reservation System

Real-time train seat reservation demo for a focused Sri Lankan rail network. The app uses a Next.js frontend, an Express API, PostgreSQL, and Prisma to search routes, inspect seat availability, hold seats temporarily, and generate demo tickets.

## Current Scope

Supported routes are intentionally limited to these origin/destination pairs:

- Colombo Fort to Kandy
- Kandy to Colombo Fort
- Colombo Fort to Badulla
- Badulla to Colombo Fort
- Kandy to Badulla
- Badulla to Kandy

The frontend only exposes valid route and departure combinations returned by the backend schedules API.

## Features

- Backend-driven stations, schedules, seats, and availability stats
- Schedule-specific seat availability, so separate departure times do not share seat state
- Segment bitmask locking for overlapping route checks
- 10-minute temporary holds for selected seats
- Seeded trains, schedules, seats, and booked seats for the next 14 days
- Multi-seat selection with a 6-seat session limit
- Mock login flow from the seat view
- Search validation and automatic route switching
- Mock checkout with client-side PDF ticket download
- Logout and inactivity cleanup for local booking state and holds

## Demo Limits

- Authentication is mock-only. Any valid email and password with at least 6 characters can sign in from the seat view.
- Payment is mock-only.
- PDF tickets are generated in the browser for demo purposes.
- Confirmed bookings are not persisted in a permanent booking table yet.
- Temporary locks represent both live holds and seeded booked seats.

## Tech Stack

Frontend:

- Next.js 16 App Router
- React 19
- Zustand
- Tailwind CSS 4
- Lucide React icons

Backend:

- Express 5
- Prisma 7
- PostgreSQL
- Prisma PostgreSQL adapter with `pg`
- TypeScript and `tsx`

## Project Structure

```text
.
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── controllers/
│       ├── lib/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── app.ts
│       └── index.ts
├── frontend/
│   └── src/
│       ├── app/
│       └── modules/
├── docker-compose.yml
└── README.md
```

## Setup

Start PostgreSQL:

```bash
docker-compose up db -d
```

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/train_db"
PORT=4000
```

Apply migrations and seed data:

```bash
cd backend
npm run prisma:migrate
npm run seed
```

Run the API:

```bash
cd backend
npm run dev
```

Run the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:4000/health`

## Scripts

Backend:

```bash
npm run dev
npm run build
npm run seed
npm run prisma:migrate
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

## API Overview

- `GET /health` - API health check
- `GET /api/stations` - list seeded stations
- `GET /api/schedules` - list supported schedules
- `GET /api/search` - find route schedules
- `GET /api/seats` - fetch seat availability for a train, schedule, date, and route segment
- `POST /api/seats/lock` - hold a seat for the current session
- `POST /api/seats/unlock` - release a held seat for the current session
- `GET /api/stats` - fetch seat availability stats

## State And Session Behavior

- The mock user is not persisted across local restarts.
- Selected seats and search form state are stored only in the browser session.
- Logout clears the cart, user, search criteria, seat stats, old session keys, and active holds.
- Signed-in users are automatically logged out after 15 minutes of inactivity.

## Dependency Notes

The direct npm dependencies are intentionally small. Each package in `backend/package.json` and `frontend/package.json` is used by runtime code, Prisma tooling, TypeScript, Next.js, Tailwind, or linting. Avoid adding new packages unless they replace meaningful complexity or support a user-facing feature.

## Next Improvements

- Real authentication with hashed passwords and secure HTTP-only sessions
- Permanent bookings and tickets separate from temporary locks
- Server-side PDF generation
- Real payment provider integration
- Automated integration tests for search, locks, checkout, and session cleanup
