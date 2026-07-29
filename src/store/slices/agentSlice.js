import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import {
  getAgentsAsync, verifyAgentAsync, suspendAgentAsync,
  createAgentAsync, updateAgentAsync, deleteAgentAsync,
} from "../services/agentService";

const initialState = {
  agents: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  get_status: asyncStatus.IDLE,
  get_error: null,
  verify_status: asyncStatus.IDLE,
  verify_error: null,
  suspend_status: asyncStatus.IDLE,
  suspend_error: null,
  create_status: asyncStatus.IDLE,
  create_error: null,
  update_status: asyncStatus.IDLE,
  update_error: null,
  delete_status: asyncStatus.IDLE,
  delete_error: null,
};

const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    resetAgentVerifyStatus: (state) => {
      state.verify_status = asyncStatus.IDLE;
      state.verify_error = null;
    },
    resetAgentSuspendStatus: (state) => {
      state.suspend_status = asyncStatus.IDLE;
      state.suspend_error = null;
    },
    resetAgentCreateStatus: (state) => {
      state.create_status = asyncStatus.IDLE;
      state.create_error = null;
    },
    resetAgentUpdateStatus: (state) => {
      state.update_status = asyncStatus.IDLE;
      state.update_error = null;
    },
    resetAgentDeleteStatus: (state) => {
      state.delete_status = asyncStatus.IDLE;
      state.delete_error = null;
    },
  },
  extraReducers: (builder) => {
    // ── GET AGENTS
    builder
      .addCase(getAgentsAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
        state.get_error = null;
      })
      .addCase(getAgentsAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.agents = payload?.data?.users || payload?.users || [];
        state.pagination = payload?.data?.pagination || payload?.pagination || state.pagination;
      })
      .addCase(getAgentsAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    // ── VERIFY AGENT
    builder
      .addCase(verifyAgentAsync.pending, (state) => {
        state.verify_status = asyncStatus.LOADING;
        state.verify_error = null;
      })
      .addCase(verifyAgentAsync.fulfilled, (state, { payload }) => {
        state.verify_status = asyncStatus.SUCCEEDED;
        const idx = state.agents.findIndex(a => a._id === payload.id);
        if (idx !== -1) state.agents[idx].verificationStatus = payload.status;
      })
      .addCase(verifyAgentAsync.rejected, (state, { payload }) => {
        state.verify_status = asyncStatus.ERROR;
        state.verify_error = payload;
      });

    // ── SUSPEND AGENT
    builder
      .addCase(suspendAgentAsync.pending, (state) => {
        state.suspend_status = asyncStatus.LOADING;
        state.suspend_error = null;
      })
      .addCase(suspendAgentAsync.fulfilled, (state, { payload }) => {
        state.suspend_status = asyncStatus.SUCCEEDED;
        const idx = state.agents.findIndex(a => a._id === payload.userId);
        if (idx !== -1) state.agents[idx].isSuspended = payload.isSuspended;
      })
      .addCase(suspendAgentAsync.rejected, (state, { payload }) => {
        state.suspend_status = asyncStatus.ERROR;
        state.suspend_error = payload;
      });

    // ── CREATE AGENT
    builder
      .addCase(createAgentAsync.pending, (state) => {
        state.create_status = asyncStatus.LOADING;
        state.create_error = null;
      })
      .addCase(createAgentAsync.fulfilled, (state) => {
        state.create_status = asyncStatus.SUCCEEDED;
      })
      .addCase(createAgentAsync.rejected, (state, { payload }) => {
        state.create_status = asyncStatus.ERROR;
        state.create_error = payload;
      });

    // ── UPDATE AGENT
    builder
      .addCase(updateAgentAsync.pending, (state) => {
        state.update_status = asyncStatus.LOADING;
        state.update_error = null;
      })
      .addCase(updateAgentAsync.fulfilled, (state) => {
        state.update_status = asyncStatus.SUCCEEDED;
      })
      .addCase(updateAgentAsync.rejected, (state, { payload }) => {
        state.update_status = asyncStatus.ERROR;
        state.update_error = payload;
      });

    // ── DELETE AGENT
    builder
      .addCase(deleteAgentAsync.pending, (state) => {
        state.delete_status = asyncStatus.LOADING;
        state.delete_error = null;
      })
      .addCase(deleteAgentAsync.fulfilled, (state) => {
        state.delete_status = asyncStatus.SUCCEEDED;
      })
      .addCase(deleteAgentAsync.rejected, (state, { payload }) => {
        state.delete_status = asyncStatus.ERROR;
        state.delete_error = payload;
      });
  },
});

export const {
  resetAgentVerifyStatus,
  resetAgentSuspendStatus,
  resetAgentCreateStatus,
  resetAgentUpdateStatus,
  resetAgentDeleteStatus,
} = agentSlice.actions;
export default agentSlice.reducer;
