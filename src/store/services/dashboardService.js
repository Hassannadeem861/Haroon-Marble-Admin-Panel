import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

export const getDashboardSummaryAsync = createAsyncThunk(
  typeConstants.GET_DASHBOARD_SUMMARY,
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/dashboard-summary");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to load dashboard",
      );
    }
  },
);