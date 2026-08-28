import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

export const getWorkOrdersAsync = createAsyncThunk(
  typeConstants.GET_WORK_ORDERS,
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/get-all-work-orders", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to fetch work orders");
    }
  },
);

export const getSingleWorkOrderAsync = createAsyncThunk(
  typeConstants.GET_SINGLE_WORK_ORDER,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get(`/get-single-work-order/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to fetch work order");
    }
  },
);

export const createWorkOrderAsync = createAsyncThunk(
  typeConstants.CREATE_WORK_ORDER,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/create-work-order", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to create work order");
    }
  },
);

export const updateWorkOrderAsync = createAsyncThunk(
  typeConstants.UPDATE_WORK_ORDER,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/update-work-order/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to update work order");
    }
  },
);

export const deleteWorkOrderAsync = createAsyncThunk(
  typeConstants.DELETE_WORK_ORDER,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/delete-work-order/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to delete work order");
    }
  },
);

// ─── Sample Rounds ───────────────────────────────────────────────
export const createSampleRoundAsync = createAsyncThunk(
  typeConstants.CREATE_SAMPLE_ROUND,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/create-sample-round", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to add sample round");
    }
  },
);

export const updateSampleRoundAsync = createAsyncThunk(
  typeConstants.UPDATE_SAMPLE_ROUND,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/update-sample-round/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to update sample round");
    }
  },
);