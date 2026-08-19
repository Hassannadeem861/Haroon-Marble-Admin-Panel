import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

// Backend: POST /create-site-expense -> { success, message, data: expense }
export const createSiteExpenseAsync = createAsyncThunk(
  typeConstants.CREATE_SITE_EXPENSE,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/site-expense/create-site-expense", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to add expense",
      );
    }
  },
);

// Backend: PUT /update-site-expense/:id -> { success, message, data: expense }
export const updateSiteExpenseAsync = createAsyncThunk(
  typeConstants.UPDATE_SITE_EXPENSE,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/site-expense/update-site-expense/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to update expense",
      );
    }
  },
);

// Backend: DELETE /delete-site-expense/:id -> { success, message }
export const deleteSiteExpenseAsync = createAsyncThunk(
  typeConstants.DELETE_SITE_EXPENSE,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/site-expense/delete-site-expense/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to delete expense",
      );
    }
  },
);