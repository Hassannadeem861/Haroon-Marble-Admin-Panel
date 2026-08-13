import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

export const getFactoryWorksAsync = createAsyncThunk(
  typeConstants.GET_FACTORY_WORKS,
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/factory-work/get-all-works", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch factory works");
    }
  },
);

export const getSingleFactoryWorkAsync = createAsyncThunk(
  typeConstants.GET_SINGLE_FACTORY_WORK,
  async (workId, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get(`/factory-work/get-single-work/${workId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch factory work");
    }
  },
);

export const createFactoryWorkAsync = createAsyncThunk(
  typeConstants.CREATE_FACTORY_WORK,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/factory-work/create-work", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to create factory work");
    }
  },
);

export const updateFactoryWorkAsync = createAsyncThunk(
  typeConstants.UPDATE_FACTORY_WORK,
  async ({ workId, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/factory-work/update-work/${workId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to update factory work");
    }
  },
);

export const addFactoryPaymentAsync = createAsyncThunk(
  typeConstants.ADD_FACTORY_PAYMENT,
  async ({ workId, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post(`/factory-work/add-payment/${workId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to add payment");
    }
  },
);

export const updateMaterialMovementAsync = createAsyncThunk(
  typeConstants.UPDATE_MATERIAL_MOVEMENT,
  async ({ workId, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/factory-work/material-movement/${workId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to record material movement");
    }
  },
);

export const updateSiteArrivalAsync = createAsyncThunk(
  typeConstants.UPDATE_SITE_ARRIVAL,
  async ({ workId, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/factory-work/site-arrival/${workId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to record site arrival");
    }
  },
);

export const setVehicleInfoAsync = createAsyncThunk(
  typeConstants.SET_VEHICLE_INFO,
  async ({ workId, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`/factory-work/vehicle-info/${workId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to save vehicle info");
    }
  },
);

export const addVehiclePaymentAsync = createAsyncThunk(
  typeConstants.ADD_VEHICLE_PAYMENT,
  async ({ workId, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post(`/factory-work/vehicle-payment/${workId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to add vehicle payment");
    }
  },
);

export const deleteFactoryWorkAsync = createAsyncThunk(
  typeConstants.DELETE_FACTORY_WORK,
  async (workId, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`/factory-work/delete-work/${workId}`);
      return { ...response.data, id: workId };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to delete factory work");
    }
  },
);