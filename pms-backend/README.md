# Patient Management System — Backend (NestJS + TypeORM + PostgreSQL)

## Setup

1. **Install PostgreSQL** and create a database:
   ```sql
   CREATE DATABASE pms_db;
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # edit .env with your DB credentials and Razorpay TEST keys
   ```

4. **Start the server** (tables auto-create via `synchronize: true`)
   ```bash
   npm run start:dev
   ```

5. **Seed a login user** (since there's no signup screen in the spec)
   ```bash
   npx ts-node scripts/seed-user.ts
   ```
   Login with: `admin@pms.com` / `Admin@123`

## Architecture

```
src/
  entities/       -> TypeORM entities (User, Patient, Bill, Payment)
  auth/           -> Login, JWT strategy, JwtAuthGuard
  patients/       -> Patient CRUD + search/filter
  bills/          -> Billing CRUD
  payments/       -> Razorpay order creation + signature verification
  dashboard/      -> Aggregated counts for the dashboard screen
  common/         -> Global exception filter, response interceptor, guards
```

Every module follows Controller -> Service -> Repository. Controllers only
handle HTTP concerns; all business logic and DB queries live in services.

## API Endpoints

- `POST /api/auth/login`
- `GET/POST /api/patients`, `GET/PUT/PATCH/DELETE /api/patients/:id`
- `GET/POST /api/bills`, `GET/PUT/PATCH/DELETE /api/bills/:id`
- `POST /api/payments/create-order`, `POST /api/payments/verify`, `GET /api/payments`, `GET /api/payments/bill/:billId`
- `GET /api/dashboard/summary`

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.

## Razorpay flow

1. Frontend calls `POST /api/payments/create-order` with `{ billId }`.
2. Backend creates a Razorpay order server-side (secret key never leaves the backend) and returns `{ orderId, amount, currency, keyId }`.
3. Frontend opens Razorpay Checkout using `keyId` + `orderId`.
4. On success, Razorpay returns `razorpay_payment_id` + `razorpay_signature` to the frontend.
5. Frontend calls `POST /api/payments/verify` with those values.
6. Backend recomputes the HMAC-SHA256 signature server-side and compares — only then marks the bill `PAID`. This happens inside a DB transaction.

## Response shape

Success: `{ "success": true, "data": ... }`
Error: `{ "success": false, "statusCode": ..., "message": ..., "timestamp": ... }`

## Troubleshooting

The backend does not use TypeScript incremental compilation. Nest removes `dist`
before compiling, so retaining a stale `tsconfig.build.tsbuildinfo` can make
TypeScript incorrectly skip emission and cause `Cannot find module dist/main`.
Run `npm run build` from `pms-backend` and confirm `dist/main.js` exists before
starting the compiled server.
