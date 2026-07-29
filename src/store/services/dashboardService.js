import { createAsyncThunk } from "@reduxjs/toolkit";
import { typeConstants } from "../../utils/constant";
import { apiHandle } from "../../utils/apiHandle";

// ─── THUNK ───────────────────────────────────────────────────
export const getDashboardAsync = createAsyncThunk(
  typeConstants.GET_DASHBOARD,
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("admin/dashboard");
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to load dashboard');
    }
  }
);
