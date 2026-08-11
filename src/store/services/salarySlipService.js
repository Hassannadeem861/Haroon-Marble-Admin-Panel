import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";


// ─── LIST ──────────────────────────────────────────────────────
export const getSalarySlipsAsync = createAsyncThunk(
  typeConstants.GET_SALARY_SLIPS,
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/get-all-salary-slips", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch salary slips",
      );
    }
  },
);

// ─── SINGLE ────────────────────────────────────────────────────
export const getSingleSalarySlipAsync = createAsyncThunk(
  typeConstants.GET_SINGLE_SALARY_SLIP,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get(`/get-single-salary-slip/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch salary slip",
      );
    }
  },
);

// ─── CREATE ────────────────────────────────────────────────────
export const createSalarySlipAsync = createAsyncThunk(
  typeConstants.CREATE_SALARY_SLIP,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/create-salary-slip", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to generate salary slip",
      );
    }
  },
);

// ─── UPDATE ────────────────────────────────────────────────────
export const updateSalarySlipAsync = createAsyncThunk(
  typeConstants.UPDATE_SALARY_SLIP,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/update-salary-slip/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to update salary slip",
      );
    }
  },
);

// ─── DELETE ────────────────────────────────────────────────────
export const deleteSalarySlipAsync = createAsyncThunk(
  typeConstants.DELETE_SALARY_SLIP,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/delete-salary-slip/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to delete salary slip",
      );
    }
  },
);