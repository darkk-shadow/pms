# Patient Management System — Frontend (React + Redux Toolkit)

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL if your backend isn't on localhost:3000
npm run dev
```

Log in with the seeded backend user: `admin@pms.com` / `Admin@123`.

## Structure

```
src/
  api/apiClient.js     -> axios instance, attaches JWT, unwraps { success, data }
  api/razorpay.js       -> loads Razorpay Checkout script, opens the payment modal
  app/store.js           -> Redux store
  features/
    auth/authSlice.js
    patients/patientsSlice.js
    bills/billsSlice.js
    payments/paymentsSlice.js
    dashboard/dashboardSlice.js
  pages/                -> route-level screens
  components/            -> shared UI (Modal, forms, layout)
  routes/ProtectedRoute.jsx
```

## Why Redux here

Every screen depends on server state that multiple components need to read
(logged-in user, patient list, bill list, loading/error flags). Redux Toolkit
gives a single source of truth: a component dispatches a thunk (e.g.
`fetchPatients`), the slice's `extraReducers` handles pending/fulfilled/rejected,
and any component can select the resulting state without prop-drilling. The
`createAsyncThunk` + `apiClient` combo is the same request→state pattern used
everywhere, so once you understand one slice you understand all of them.

## Data flow (matches the assignment's required diagram)

```
Component -> dispatch(thunk) -> apiClient (axios) -> NestJS REST API -> PostgreSQL
                                                     -> response -> slice reducer -> store -> component re-renders
```

## Razorpay flow (frontend side)

1. User clicks **Pay Bill** -> `createRazorpayOrder(billId)` thunk hits `/api/payments/create-order`.
2. Backend returns `{ orderId, amount, currency, keyId }` (never the secret key).
3. `openRazorpayCheckout()` loads `checkout.js` and opens the Razorpay modal with those values.
4. On success, Razorpay calls back with `razorpay_payment_id` + `razorpay_signature`.
5. `verifyRazorpayPayment()` thunk sends those to `/api/payments/verify`.
6. Backend verifies the signature and flips the bill to `PAID`; frontend updates the Redux store locally so the badge reflects the change immediately.
