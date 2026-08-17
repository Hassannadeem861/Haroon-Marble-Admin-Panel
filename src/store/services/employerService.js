import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

// ─── LIST (master workers) ──────────────────────────────────────
// Backend: GET /employers -> { success, data: [employer...], pagination }
export const getEmployersAsync = createAsyncThunk(
  typeConstants.GET_EMPLOYERS,
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/get-all-employers", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch workers",
      );
    }
  },
);

// ─── SINGLE (profile + daily history + salary summary) ─────────
// Backend: GET /employers/:employerId -> { success, data: { employer, summary, recentWork, pagination } }
export const getSingleEmployerAsync = createAsyncThunk(
  typeConstants.GET_SINGLE_EMPLOYER,
  async ({ id, page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get(`/get-single-employer/${id}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch worker",
      );
    }
  },
);

// ─── CREATE ──────────────────────────────────────────────────────
// Backend: POST /employers -> { success, message, data: employer }
export const createEmployerAsync = createAsyncThunk(
  typeConstants.CREATE_EMPLOYER,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/create-employer", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to create worker",
      );
    }
  },
);

// ─── UPDATE (master profile only — no attendance/site fields here) ─
// Backend: PUT /employers/:employerId -> { success, message, data: employer }
export const updateEmployerAsync = createAsyncThunk(
  typeConstants.UPDATE_EMPLOYER,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/update-employer/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to update worker",
      );
    }
  },
);

// ─── DELETE (soft delete) ───────────────────────────────────────
export const deleteEmployerAsync = createAsyncThunk(
  typeConstants.DELETE_EMPLOYER,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/delete-employer/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to delete worker",
      );
    }
  },
);