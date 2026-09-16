import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../api/apiClient';

export const fetchBills = createAsyncThunk(
  'bills/fetchAll',
  async ({ page = 1, limit = 10, search = '', status = '' } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      return await apiClient.get('/api/bills', { params });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const createBill = createAsyncThunk(
  'bills/create',
  async (billData, { rejectWithValue }) => {
    try {
      return await apiClient.post('/api/bills', billData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteBill = createAsyncThunk(
  'bills/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/bills/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateBill = createAsyncThunk(
  'bills/update',
  async ({ id, ...billData }, { rejectWithValue }) => {
    try {
      return await apiClient.patch(`/api/bills/${id}`, billData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const billsSlice = createSlice({
  name: 'bills',
  initialState: {
    items: [],
    loading: false,
    error: null,
    actionLoading: false,
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    search: '',
    status: '',
  },
  reducers: {
    clearBillsError: (state) => {
      state.error = null;
    },
    // Called after a successful payment verification to flip status locally
    markBillPaidLocally: (state, action) => {
      const bill = state.items.find((b) => b.id === action.payload);
      if (bill) bill.paymentStatus = 'PAID';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.search = action.meta.arg?.search ?? '';
        state.status = action.meta.arg?.status ?? '';
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBill.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createBill.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
      })
      .addCase(deleteBill.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateBill.fulfilled, (state, action) => {
        const index = state.items.findIndex((bill) => bill.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateBill.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearBillsError, markBillPaidLocally } = billsSlice.actions;
export default billsSlice.reducer;
