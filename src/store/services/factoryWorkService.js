import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

// GET ALL
export const getFactoryWorksAsync = createAsyncThunk(
    typeConstants.GET_FACTORY_WORK,
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await apiHandle.get("/factory-work/get-all-works", {
                params,
            });

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch factory works"
            );
        }
    }
);

// GET SINGLE
export const getSingleFactoryWorkAsync = createAsyncThunk(
    typeConstants.GET_SINGLE_FACTORY_WORK,
    async (id, { rejectWithValue }) => {
        try {
            const response = await apiHandle.get(
                `/factory-work/get-single-work/${id}`
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch factory work"
            );
        }
    }
);

// CREATE
export const createFactoryWorkAsync = createAsyncThunk(
    typeConstants.CREATE_FACTORY_WORK,
    async (payload, { rejectWithValue }) => {
        try {
            const response = await apiHandle.post(
                "/factory-work/create-work",
                payload
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to create factory work"
            );
        }
    }
);

// UPDATE
export const updateFactoryWorkAsync = createAsyncThunk(
    typeConstants.UPDATE_FACTORY_WORK,
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await apiHandle.put(
                `/factory-work/update-work/${id}`,
                payload
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update factory work"
            );
        }
    }
);

// FACTORY PAYMENT
export const addFactoryPaymentAsync = createAsyncThunk(
    typeConstants.CREATE_FACTORY_PAYMENT,
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await apiHandle.post(
                `/factory-work/add-payment/${id}`,
                payload
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to add factory payment"
            );
        }
    }
);

// MATERIAL MOVEMENT
export const updateMaterialMovementAsync = createAsyncThunk(
    typeConstants.UPDATE_MATERIAL_MOVEMENT,
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await apiHandle.put(
                `/factory-work/material-movement/${id}`,
                payload
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update material movement"
            );
        }
    }
);

// SITE ARRIVAL
export const updateSiteArrivalAsync = createAsyncThunk(
    typeConstants.UPDATE_SITE_ARRIVAL,
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await apiHandle.put(
                `/factory-work/site-arrival/${id}`,
                payload
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update site arrival"
            );
        }
    }
);

// VEHICLE INFO
export const setVehicleInfoAsync = createAsyncThunk(
    typeConstants.SET_VEHICAL_INFO,
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await apiHandle.put(
                `/factory-work/vehicle-info/${id}`,
                payload
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to save vehicle information"
            );
        }
    }
);

// VEHICLE PAYMENT
export const addVehiclePaymentAsync = createAsyncThunk(
    typeConstants.CREATE_VEHICAL_PAYMENT,
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await apiHandle.post(
                `/factory-work/vehicle-payment/${id}`,
                payload
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to add vehicle payment"
            );
        }
    }
);

// DELETE
export const deleteFactoryWorkAsync = createAsyncThunk(
    typeConstants.DELETE_FACTORY_WORK,
    async (id, { rejectWithValue }) => {
        try {
            const response = await apiHandle.delete(
                `/factory-work/delete-work/${id}`
            );

            return {
                ...response.data,
                id,
            };
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete factory work"
            );
        }
    }
);