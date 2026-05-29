# Smart Hospitality Management System (SHMS)

A full-stack, offline-capable Hospitality POS & Management Platform for East Africa.

## Stack

| Layer | Technology |
|-------|-----------|
| Admin Dashboard | Next.js 14 + Tailwind CSS |
| Backend API | NestJS + Prisma |
| Database | PostgreSQL |
| Realtime | Socket.IO |
| Auth | JWT |
| State | Zustand + React Query |

## Project Structure

```
apps/
├── admin-dashboard/     # Next.js web app (POS + Admin)
└── backend-api/         # NestJS REST API + WebSocket
```

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Backend Setup

```bash
cd apps/backend-api
cp .env.example .env
# Edit .env with your DATABASE_URL

npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
npm run dev
```

API runs on: http://localhost:4000

### 3. Frontend Setup

```bash
cd apps/admin-dashboard
cp .env.local.example .env.local
npm install
npm run dev
```

Dashboard runs on: http://localhost:3000

### 4. Default Login
- Email: `admin@shms.rw`
- Password: `admin123`

## Modules

| Module | Status |
|--------|--------|
| POS / Sales | ✅ |
| Table Management | ✅ |
| Order Management | ✅ |
| Product Management | ✅ |
| Stock Management | ✅ |
| Supplier Management | ✅ |
| Room Management | ✅ |
| Reservations / Check-in | ✅ |
| Reports & Analytics | ✅ |
| User & Role Management | ✅ |
| Printer Configuration | ✅ |
| Business Settings | ✅ |
| Kitchen/Bar Routing | ✅ (via printer assignment) |
| Real-time (Socket.IO) | ✅ |
| JWT Authentication | ✅ |

## API Endpoints

```
POST   /api/auth/login
POST   /api/auth/pin-login
GET    /api/auth/me

GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/orders
POST   /api/orders
POST   /api/orders/:id/pay
PUT    /api/orders/:id/status
PUT    /api/orders/:id/cancel

GET    /api/tables
PUT    /api/tables/:id/status

GET    /api/stock
POST   /api/stock/adjust
GET    /api/stock/movements

GET    /api/rooms
GET    /api/reservations
POST   /api/reservations
PUT    /api/reservations/:id/checkin
PUT    /api/reservations/:id/checkout

GET    /api/reports/dashboard
GET    /api/reports/sales
GET    /api/reports/top-products
GET    /api/reports/payments

GET    /api/users
POST   /api/users
GET    /api/settings
PUT    /api/settings
```

## Docker (Optional)

```bash
docker-compose up -d
```
