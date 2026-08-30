# EventBook (EBS) — Event Booking System

**v1.1.0** · [Live app](https://ebs-front-8qps.vercel.app) · [Live API](https://ebs-front.onrender.com/health)

A full-stack event booking platform with concurrency-safe seat reservations and Stripe payment processing. Users can browse events, lock tickets for a limited hold window, complete payment, and manage their bookings — with built-in protection against overselling when multiple users compete for the same limited seats.

## Architecture

This project is split into two independent parts:

- **`client/`** — React + TypeScript frontend (Vite), deployed on Vercel. Uses Supabase for auth and read-only data.
- **`backend/`** — Express + TypeScript API, deployed on Render. Uses PostgreSQL (via Supabase) for transactional writes (locking, checkout, cancellation).

Reads (browsing events, viewing bookings) go directly through `supabase-js`. Anything involving money or seat inventory — locking a ticket, charging a card, cancelling a booking — goes through the Express backend, which uses database transactions and row-level locking to prevent race conditions.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Supabase Auth
- **Backend:** Node.js, Express, TypeScript, `pg` (node-postgres)
- **Database:** PostgreSQL (Supabase)
- **Payments:** Stripe
- **Hosting:** Vercel (frontend), Render (backend)

## Core Feature: Concurrency-Safe Booking

The booking flow uses PostgreSQL transactions with row-level locking (`FOR UPDATE`) to guarantee two users can never successfully book the same limited seats at once:

1. **Lock** (`POST /api/bookings/lock`) — locks the event row, checks real-time seat availability against confirmed bookings *and* other unexpired pending holds, then creates a 10-minute pending reservation.
2. **Checkout** (`POST /api/bookings/checkout`) — re-validates the hold hasn't expired, charges the card via Stripe, confirms the booking, and decrements available seats — all inside one transaction.
3. **Cancel** (`POST /api/bookings/cancel`) — cancels a confirmed booking; a database trigger automatically restores the seats.

If a hold expires or seats run out mid-process, the transaction rolls back cleanly and the user gets a clear error instead of a corrupted booking.

## Routes

| Path | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/events` | Public | Browse all events, with filters |
| `/events/:id` | Public | Event details; booking requires login |
| `/login`, `/signup` | Public | Auth |
| `/dashboard` | Protected | My Bookings — upcoming/past, with cancel |
| `/profile` | Protected | Account details |
| `/admin` | Admin only | Manage events, users, and bookings |

Unrecognized paths redirect to the landing page.

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

## Deployment

- **Frontend:** Vercel, auto-deployed from `client/`. Environment variables set in the Vercel dashboard (Vite bakes them in at build time, so a redeploy is required after any env var change).
- **Backend:** Render, auto-deployed from `backend/`. Build command is `npm install` only (no compile step — runs via `tsx` directly). Free tier spins down on inactivity, so the first request after idle can take 30–60 seconds.

## Changelog

**v1.1.0**
- Deployed frontend (Vercel) and backend (Render) — app is live end-to-end.
- Added a public landing page with a visual walkthrough of the lock/checkout flow.
- Added the missing `/profile` route and a catch-all redirect for unrecognized paths.
- Fixed a wide batch of nullable-field TypeScript errors surfaced by strict build checks (`event_date`, `price`, `description`, `available_seats` across `EventDetails`, `Dashboard`, `EventCard`, `Profile`).
- Corrected several schema/column mismatches inherited from earlier development (misnamed columns, a UUID/bigint foreign key mismatch, a missing primary key, two misconfigured database triggers).
- Rewired `handleBooking` and `handleCancelBooking` to call the Express backend instead of writing to Supabase directly, restoring the concurrency protection those actions require.

**v1.0.0**
- Initial working lock → checkout → confirm → cancel flow, tested end-to-end locally.

## Status

Live and functional for the core booking flow. Planned next: real Stripe Elements card input (currently using a test token), an image upload/URL field for event flyers, and an external event discovery feed (e.g. via Ticketmaster's Discovery API) with redirect-out booking for events outside EBS's own listings — see the SeatSync–EBS Integration Analysis doc for details.

## Related Project

This project shares its concurrency-control pattern (transactional seat locking, Stripe checkout) with a sibling project, **SeatSync** (movie theater reservations) — built as a separate, independently deployable service rather than merged into this one.