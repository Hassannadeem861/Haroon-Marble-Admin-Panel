import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

// ─── LIST (master sites) ─────────────────────────────────────────
// Backend: GET /get-all-sites -> { success, data: [site...], pagination }
export const getSitesAsync = createAsyncThunk(
  typeConstants.GET_SITES,
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/site/get-all-sites", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch sites",
      );
    }
  },
);

// ─── DROPDOWN LIST (active sites only — used by expense/material forms) ─
// Backend: GET /sites-list -> { success, data: [{_id,name,location,ownerName}] }
export const getSitesListAsync = createAsyncThunk(
  typeConstants.GET_SITES_LIST,
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/site/sites-list");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch sites list",
      );
    }
  },
);

// ─── SINGLE (profile + summary + paginated expenses + materials) ─
// Backend: GET /get-single-site/:siteId -> { success, data: { site, summary, expenses, expensesPagination, materials, materialsPagination } }
export const getSingleSiteAsync = createAsyncThunk(
  typeConstants.GET_SINGLE_SITE,
  async ({ id, page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get(`/site/get-single-site/${id}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch site",
      );
    }
  },
);

// ─── CREATE ──────────────────────────────────────────────────────
export const createSiteAsync = createAsyncThunk(
  typeConstants.CREATE_SITE,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/site/create-site", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to create site",
      );
    }
  },
);

// ─── UPDATE (master profile — name/location/owner/status/dates) ──
export const updateSiteAsync = createAsyncThunk(
  typeConstants.UPDATE_SITE,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/site/update-site/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to update site",
      );
    }
  },
);

// ─── DELETE (soft delete) ───────────────────────────────────────
export const deleteSiteAsync = createAsyncThunk(
  typeConstants.DELETE_SITE,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/site/delete-site/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to delete site",
      );
    }
  },
);