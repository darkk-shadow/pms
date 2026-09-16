# Patient Management System

This workspace contains a NestJS/PostgreSQL backend and a React/Redux frontend
for authenticated patient, billing, dashboard, and Razorpay test-payment flows.

## Run locally

1. Ensure PostgreSQL is running and create `pms_db`.
2. Configure `pms-backend/.env` from `pms-backend/.env.example`.
3. Run `npm install` and `npm run start:dev` in `pms-backend`.
4. Run `npx ts-node scripts/seed-user.ts` once tables are available.
5. Run `npm install` and `npm run dev` in `pms-frontend`.
6. Open `http://localhost:5173` and sign in with `admin@pms.com` / `Admin@123`.

The backend uses `synchronize: true` for local development only. Razorpay
secrets remain backend-only; use TEST keys in the backend environment file.