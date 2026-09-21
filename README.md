# Nikhaar 💈 — Salon Booking Platform (Pakistan)

> Working name — swap freely for whichever name you land on.

A two-sided marketplace connecting salons/barbershops with customers across Pakistan. Salons manage their profile, staff, and bookings; customers discover nearby salons and book appointments in a few taps.

## Overview

- **Problem:** Booking a salon appointment in Pakistan today mostly means a phone call or a WhatsApp message — no visibility into real-time availability, pricing, or staff schedules.
- **Solution:** A booking platform where salons list their services and staff calendars, and customers browse and book directly.
- **Business model:** Salons pay (free tier + premium subscription for advanced features). Customers always use the platform for free — no ads or paywalls on the demand side.

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | NestJS (Node.js, TypeScript) | REST API, modular architecture |
| Database | PostgreSQL | via TypeORM or Prisma |
| Auth | JWT (access + refresh tokens) | Role-based: `business`, `customer`, `admin` |
| API docs | `@nestjs/swagger` | Auto-generated docs at `/api/docs` |
| Web (MVP) | React / Next.js (or plain responsive web) | Ships before native mobile |
| Mobile (Phase 2) | React Native / Flutter | Customer-facing, once demand is validated |
| Notifications | SMS gateway + WhatsApp Business API (optional) | Booking confirmations & reminders |
| Payments (later) | JazzCash / EasyPaisa | MVP defaults to pay-at-salon |
| Hosting | TBD (Railway / DigitalOcean / AWS) | Pick based on budget & team familiarity |

## Project Structure

```
src/
 ├── modules/
 │   ├── auth/
 │   ├── users/
 │   ├── salons/
 │   ├── services/
 │   ├── staff/
 │   ├── bookings/
 │   ├── reviews/
 │   ├── payments/
 │   └── notifications/
 ├── common/
 │   ├── guards/
 │   ├── decorators/
 │   ├── filters/
 │   └── interceptors/
 ├── config/
 ├── database/
 │   ├── migrations/
 │   └── seeds/
 ├── app.module.ts
 └── main.ts
```

## Core Domain Modules (MVP)

- **Auth** — registration/login for both business and customer roles
- **Salons** — profile, location, services offered, working hours
- **Staff** — stylists/barbers linked to a salon, individual availability
- **Bookings** — create, reschedule, cancel; slot availability logic
- **Notifications** — booking confirmation + reminder (SMS/WhatsApp)
- **Admin** — basic oversight panel (approve salons, view activity)

Post-MVP: reviews & ratings, in-app payments, loyalty/points, featured salon placement.

## Monetization Model

- **Salons:** Free tier (basic listing, limited bookings/month) → Premium subscription (unlimited bookings, multiple staff calendars, analytics, priority placement in search).
- **Customers:** Always free. No ads in the booking flow, no customer-facing paywalls — friction here kills two-sided marketplace adoption.
- **Later option:** Paid "featured placement" for salons wanting to rank higher in search results, instead of banner ads to customers.

## Getting Started

### Prerequisites
- Node.js >= 18
- npm or pnpm
- PostgreSQL >= 14
- NestJS CLI: `npm i -g @nestjs/cli`

### Installation
```bash
git clone <repo-url>
cd nikhaar-backend
npm install
```

### Environment Variables
Create a `.env` file in the project root:
```
DATABASE_URL=postgresql://user:password@localhost:5432/nikhaar
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
PORT=3000
NODE_ENV=development
```

### Running the App
```bash
# development (watch mode)
npm run start:dev

# production build
npm run build
npm run start:prod
```

### Running Tests
```bash
npm run test        # unit tests
npm run test:e2e    # end-to-end tests
npm run test:cov    # coverage report
```

## API Documentation

Once `@nestjs/swagger` is wired into `main.ts`, interactive API docs will be available at:
```
http://localhost:3000/api/docs
```

## Roadmap

- [ ] **Phase 1 (MVP):** Web dashboard for salons + web booking page for customers, single-city pilot
- [ ] **Phase 2:** Native mobile app for customers (React Native / Flutter)
- [ ] **Phase 3:** Payment gateway integration (JazzCash / EasyPaisa)
- [ ] **Phase 4:** WhatsApp Business API booking flow
- [ ] **Phase 5:** Multi-city expansion, reviews & loyalty features

## Contributing

Internal project — contribution guidelines to be added as the team grows.

## License

Proprietary — all rights reserved. (Update this once you've decided on a license, even for a closed-source SaaS.)