import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import patientsReducer from '../features/patients/patientsSlice';
import billsReducer from '../features/bills/billsSlice';
import paymentsReducer from '../features/payments/paymentsSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientsReducer,
    bills: billsReducer,
    payments: paymentsReducer,
    dashboard: dashboardReducer,
  },
});
