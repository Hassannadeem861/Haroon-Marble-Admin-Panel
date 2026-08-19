import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

// Backend: POST /create-site-material -> { success, message, data: material }
export const createSiteMaterialAsync = createAsyncThunk(
  typeConstants.CREATE_SITE_MATERIAL,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/site-material/create-site-material", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to add material entry",
      );
    }
  },
);

// Backend: PUT /update-site-material/:id -> { success, message, data: material }
export const updateSiteMaterialAsync = createAsyncThunk(
  typeConstants.UPDATE_SITE_MATERIAL,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/site-material/update-site-material/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to update material entry",
      );
    }
  },
);

// Backend: DELETE /delete-site-material/:id -> { success, message }
export const deleteSiteMaterialAsync = createAsyncThunk(
  typeConstants.DELETE_SITE_MATERIAL,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/site-material/delete-site-material/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to delete material entry",
      );
    }
  },
);