import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../api/apiClient';

export const fetchPatients = createAsyncThunk(
  'patients/fetchAll',
  async ({ name, search, gender, page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (search || name) params.search = search || name;
      if (gender) params.gender = gender;
      params.page = page;
      params.limit = limit;
      return await apiClient.get('/api/patients', { params });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const createPatient = createAsyncThunk(
  'patients/create',
  async (patientData, { rejectWithValue }) => {
    try {
      return await apiClient.post('/api/patients', patientData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updatePatient = createAsyncThunk(
  'patients/update',
  async ({ id, ...patientData }, { rejectWithValue }) => {
    try {
      return await apiClient.put(`/api/patients/${id}`, patientData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deletePatient = createAsyncThunk(
  'patients/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/patients/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const patientsSlice = createSlice({
  name: 'patients',
  initialState: {
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
    actionLoading: false, // separate flag for add/update/delete, so the table doesn't flicker
  },
  reducers: {
    clearPatientsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPatient.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearPatientsError } = patientsSlice.actions;
export default patientsSlice.reducer;
