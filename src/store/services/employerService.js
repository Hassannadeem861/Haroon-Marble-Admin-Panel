import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";


export const getEmployersAsync = createAsyncThunk(
  typeConstants.GET_EMPLOYERS,
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/get-all-employers", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to fetch employers");
    }
  }
);

// ─── SINGLE ────────────────────────────────────────────────────
export const getSingleEmployerAsync = createAsyncThunk(
  typeConstants.GET_SINGLE_EMPLOYER,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get(`/get-single-employer/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to fetch employer");
    }
  }
);

// ─── CREATE ────────────────────────────────────────────────────
export const createEmployerAsync = createAsyncThunk(
  typeConstants.CREATE_EMPLOYER,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/create-employer", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to create employer");
    }
  }
);

// ─── UPDATE ────────────────────────────────────────────────────
export const updateEmployerAsync = createAsyncThunk(
  typeConstants.UPDATE_EMPLOYER,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/update-employer/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to update employer");
    }
  }
);

// ─── DELETE ────────────────────────────────────────────────────
export const deleteEmployerAsync = createAsyncThunk(
  typeConstants.DELETE_EMPLOYER,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/delete-employer/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to delete employer");
    }
  }
);