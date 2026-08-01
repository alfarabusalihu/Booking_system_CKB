# Sri Lanka Train Reservation System

## Overview
A real-time train seat reservation system featuring:
- Pure SSR Seat Maps
- Bitmask Segment Availability
- Atomic Seat Locking (10-minute hold)
- Inline Auth & PDF Tickets

## Structure
- `frontend/`: Next.js 15 App Router
- `backend/`: Express / Node.js Backend with Prisma ORM
- `docker-compose.yml`: Local multi-container setup

## Development
Run the database:
```bash
docker-compose up db -d
```
Run backend (from `backend/`):
```bash
npx prisma migrate dev
npm run dev
```
Run frontend (from `frontend/`):
```bash
npm run dev
```
