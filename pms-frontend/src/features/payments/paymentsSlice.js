import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../api/apiClient';

export const createRazorpayOrder = createAsyncThunk(
  'payments/createOrder',
  async (billId, { rejectWithValue }) => {
    try {
      return await apiClient.post('/api/payments/create-order', { billId });
    } catch (err) {
      return rejectWithValue(err.message || err || 'Payment request failed.');
    }
  },
);

export const verifyRazorpayPayment = createAsyncThunk(
  'payments/verify',
  async (verificationData, { rejectWithValue }) => {
    try {
      return await apiClient.post('/api/payments/verify', verificationData);
    } catch (err) {
      return rejectWithValue(err.message || err || 'Payment verification failed.');
    }
  },
);

export const fetchPaymentHistory = createAsyncThunk(
  'payments/fetchHistory',
  async ({ page = 1, limit = 10, search = '', status = '' } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      return await apiClient.get('/api/payments', { params });
    } catch (err) {
      return rejectWithValue(err.message || err || 'Payment history could not be loaded.');
    }
  },
);

export const fetchPaymentDetails = createAsyncThunk(
  'payments/fetchDetails',
  async (billId, { rejectWithValue }) => {
    try {
      return await apiClient.get(`/api/payments/bill/${billId}`);
    } catch (err) {
      return rejectWithValue(err.message || err || 'Payment details could not be loaded.');
    }
  },
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    paymentLoading: false,
    paymentError: null,
    lastVerifiedBillId: null,
    history: [],
    historyLoading: false,
    details: [],
    detailsLoading: false,
    historyPage: 1,
    historyLimit: 10,
    historyTotal: 0,
    historyTotalPages: 0,
    historySearch: '',
    historyStatus: '',
  },
  reducers: {
    clearPaymentError: (state) => {
      state.paymentError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRazorpayOrder.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.lastVerifiedBillId = action.payload.billId;
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload.items;
        state.historyPage = action.payload.page;
        state.historyLimit = action.payload.limit;
        state.historyTotal = action.payload.total;
        state.historyTotalPages = action.payload.totalPages;
        state.historySearch = action.meta.arg?.search ?? '';
        state.historyStatus = action.meta.arg?.status ?? '';
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.paymentError = action.payload;
      })
      .addCase(fetchPaymentDetails.pending, (state) => {
        state.detailsLoading = true;
        state.paymentError = null;
      })
      .addCase(fetchPaymentDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.details = action.payload;
      })
      .addCase(fetchPaymentDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.paymentError = action.payload;
      });
  },
});

export const { clearPaymentError } = paymentsSlice.actions;
export default paymentsSlice.reducer;
