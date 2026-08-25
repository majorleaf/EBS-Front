# EventBook (EBS) — Event Booking System

A full-stack event booking platform with concurrency-safe seat reservations and Stripe payment processing. Users can browse events, lock tickets for a limited hold window, complete payment, and manage their bookings — with built-in protection against overselling when multiple users compete for the same limited seats.

## Architecture

This project is split into two independent parts:

- **`client/`** — React + TypeScript frontend (Vite), using Supabase for auth and read-only data
- **`backend/`** — Express + TypeScript API, using PostgreSQL (via Supabase) for transactional writes (locking, checkout, cancellation)

Reads (browsing events, viewing bookings) go directly through `supabase-js`. Anything involving money or seat inventory — locking a ticket, charging a card, cancelling a booking — goes through the Express backend, which uses database transactions and row-level locking to prevent race conditions.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Supabase Auth
- **Backend:** Node.js, Express, TypeScript, `pg` (node-postgres)
- **Database:** PostgreSQL (Supabase)
- **Payments:** Stripe

## Core Feature: Concurrency-Safe Booking

The booking flow uses PostgreSQL transactions with row-level locking (`FOR UPDATE`) to guarantee two users can never successfully book the same limited seats at once:

1. **Lock** (`POST /api/bookings/lock`) — locks the event row, checks real-time seat availability against confirmed bookings *and* other unexpired pending holds, then creates a 10-minute pending reservation.
2. **Checkout** (`POST /api/bookings/checkout`) — re-validates the hold hasn't expired, charges the card via Stripe, confirms the booking, and decrements available seats — all inside one transaction.
3. **Cancel** (`POST /api/bookings/cancel`) — cancels a confirmed booking; a database trigger automatically restores the seats.

If a hold expires or seats run out mid-process, the transaction rolls back cleanly and the user gets a clear error instead of a corrupted booking.

## Getting Started

### Prerequisites
- Node.js
- A Supabase project (database + auth)
- A Stripe account (test mode)

### Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=8000
DATABASE_URL=your_supabase_connection_pooler_url
STRIPE_SECRET_KEY=sk_test_...
```

Run:
```bash
npx tsx server.ts
```

### Frontend setup
```bash
cd client
npm install
```

Create `client/.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EBS_API_URL=http://localhost:8000
```

Run:
```bash
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Database connectivity check |
| POST | `/api/bookings/lock` | Hold seats for 10 minutes |
| POST | `/api/bookings/checkout` | Charge payment and confirm booking |
| POST | `/api/bookings/cancel` | Cancel a confirmed booking |

## Database Notes

Several validation rules live as PostgreSQL triggers on the `bookings` table (seat availability checks, price validation, past-event prevention, seat restoration on cancel) as a defense-in-depth layer alongside the application-level checks in the Express routes.

## Status

Actively in development. Core booking flow (lock → pay → confirm → cancel) is implemented and tested end-to-end. Planned next: real Stripe Elements card input (currently using a test token), environment-based API URLs, and a "My Bookings" view reflecting live booking state.

## Related Project

This project shares its concurrency-control pattern (transactional seat locking, Stripe checkout) with a sibling project, **SeatSync** (movie theater reservations) — built as a separate, independently deployable service rather than merged into this one.