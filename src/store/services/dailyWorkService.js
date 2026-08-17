import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

export const getWorkersListAsync = createAsyncThunk(
  typeConstants.GET_WORKERS_LIST,
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/workers-list");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch workers list",
      );
    }
  },
);

export const getDailyWorksAsync = createAsyncThunk(
  typeConstants.GET_DAILY_WORKS,
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/get-all-daily-work", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch daily work entries",
      );
    }
  },
);

export const getSingleDailyWorkAsync = createAsyncThunk(
  typeConstants.GET_SINGLE_DAILY_WORK,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get(`/get-single-daily-work/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch daily work entry",
      );
    }
  },
);

export const createDailyWorkAsync = createAsyncThunk(
  typeConstants.CREATE_DAILY_WORK,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/create-daily-work", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to create daily work entry",
      );
    }
  },
);

export const updateDailyWorkAsync = createAsyncThunk(
  typeConstants.UPDATE_DAILY_WORK,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/update-daily-work/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to update daily work entry",
      );
    }
  },
);

export const deleteDailyWorkAsync = createAsyncThunk(
  typeConstants.DELETE_DAILY_WORK,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/delete-daily-work/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to delete daily work entry",
      );
    }
  },
);