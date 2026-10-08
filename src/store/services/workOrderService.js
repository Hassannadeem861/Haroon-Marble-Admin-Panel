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

// ─── Site Issues (photos ke sath — multipart/form-data) ──────────
// apiHandle ka default header JSON hai; FormData ke sath JSON header ho to axios
// FormData ko JSON bana deta hai aur files gum ho jati hain — is liye header per-request.
const UPLOAD_CONFIG = { headers: { "Content-Type": "multipart/form-data" }, timeout: 90000 };

// fields: { workOrderId, roundId, issueDate, description, causedBy, resolvedDate, resolutionNote,
//           removeImageIds: [], images: [File] }
const buildIssueFormData = ({ images = [], removeImageIds, ...fields }) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  if (removeImageIds?.length) formData.append("removeImageIds", JSON.stringify(removeImageIds));
  images.forEach((file) => formData.append("images", file));
  return formData;
};

export const createSiteIssueAsync = createAsyncThunk(
  typeConstants.CREATE_SITE_ISSUE,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/create-site-issue", buildIssueFormData(payload), UPLOAD_CONFIG);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to save problem");
    }
  },
);

export const updateSiteIssueAsync = createAsyncThunk(
  typeConstants.UPDATE_SITE_ISSUE,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/update-site-issue/${id}`, buildIssueFormData(payload), UPLOAD_CONFIG);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to update problem");
    }
  },
);

export const deleteSiteIssueAsync = createAsyncThunk(
  typeConstants.DELETE_SITE_ISSUE,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/delete-site-issue/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to delete problem");
    }
  },
);

// ─── Roz ka kaam (WorkDay) — round ke andar ek din ki entry ──────
// payload: { workOrderId, roundId, date: "DD/MM/YYYY", note }
export const createWorkDayAsync = createAsyncThunk(
  typeConstants.CREATE_WORK_DAY,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/create-work-day", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to add work day");
    }
  },
);

export const updateWorkDayAsync = createAsyncThunk(
  typeConstants.UPDATE_WORK_DAY,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/update-work-day/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to update work day");
    }
  },
);

export const deleteWorkDayAsync = createAsyncThunk(
  typeConstants.DELETE_WORK_DAY,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/delete-work-day/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || "Failed to delete work day");
    }
  },
);