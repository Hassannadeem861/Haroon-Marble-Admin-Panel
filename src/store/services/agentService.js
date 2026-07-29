import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

export const getAgentsAsync = createAsyncThunk(
  typeConstants.GET_AGENTS,
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get('/admin/users/list/all-clients-agents', {
        params: { role: 'agent', ...params },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to fetch agents');
    }
  }
);

export const verifyAgentAsync = createAsyncThunk(
  typeConstants.VERIFY_AGENT,
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.patch(`/admin/agents/${id}/verify`, { status });
      return { ...response.data, id, status };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to verify agent');
    }
  }
);

export const suspendAgentAsync = createAsyncThunk(
  typeConstants.SUSPEND_AGENT,
  async ({ userId, isSuspended }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.patch(`/admin/users/${userId}/suspend`, { isSuspended });
      return { ...response.data, userId, isSuspended };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to update suspension');
    }
  }
);

export const createAgentAsync = createAsyncThunk(
  typeConstants.CREATE_AGENT,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post('auth/register', { ...payload, role: 'agent' });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to create agent');
    }
  }
);

export const updateAgentAsync = createAsyncThunk(
  typeConstants.UPDATE_AGENT,
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.put(`admin/users/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to update agent');
    }
  }
);

export const deleteAgentAsync = createAsyncThunk(
  typeConstants.DELETE_AGENT,
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiHandle.delete(`admin/users/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to delete agent');
    }
  }
);
