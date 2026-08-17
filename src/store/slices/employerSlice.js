import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import {
  getEmployersAsync,
  getSingleEmployerAsync,
  createEmployerAsync,
  updateEmployerAsync,
  deleteEmployerAsync,
} from "../services/employerService";

const initialState = {
  // ── master list ──
  workers: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  get_status: asyncStatus.IDLE,
  get_error: null,

  // ── single worker (profile + daily history + salary summary) ──
  selectedWorker: null,
  summary: null,
  recentWork: [],
  recentWorkPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  detail_status: asyncStatus.IDLE,
  detail_error: null,

  create_status: asyncStatus.IDLE,
  create_error: null,

  update_status: asyncStatus.IDLE,
  update_error: null,

  delete_status: asyncStatus.IDLE,
  delete_error: null,
};

const employerSlice = createSlice({
  name: "employer",
  initialState,
  reducers: {
    resetEmployerCreateStatus: (state) => {
      state.create_status = asyncStatus.IDLE;
      state.create_error = null;
    },
    resetEmployerUpdateStatus: (state) => {
      state.update_status = asyncStatus.IDLE;
      state.update_error = null;
    },
    resetEmployerDeleteStatus: (state) => {
      state.delete_status = asyncStatus.IDLE;
      state.delete_error = null;
    },
    clearSelectedWorker: (state) => {
      state.selectedWorker = null;
      state.summary = null;
      state.recentWork = [];
      state.recentWorkPagination = initialState.recentWorkPagination;
      state.detail_status = asyncStatus.IDLE;
      state.detail_error = null;
    },
  },
  extraReducers: (builder) => {
    // ── LIST ── shape: { success, data: [...], pagination: {page,limit,total,totalPages} }
    builder
      .addCase(getEmployersAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
        state.get_error = null;
      })
      .addCase(getEmployersAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.workers = payload?.data || [];
        state.pagination = payload?.pagination || initialState.pagination;
      })
      .addCase(getEmployersAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    // ── SINGLE ── shape: { success, data: { employer, summary, recentWork, pagination } }
    builder
      .addCase(getSingleEmployerAsync.pending, (state) => {
        state.detail_status = asyncStatus.LOADING;
        state.detail_error = null;
      })
      .addCase(getSingleEmployerAsync.fulfilled, (state, { payload }) => {
        state.detail_status = asyncStatus.SUCCEEDED;
        state.selectedWorker = payload?.data?.employer || null;
        state.summary = payload?.data?.summary || null;
        state.recentWork = payload?.data?.recentWork || [];
        state.recentWorkPagination = payload?.data?.pagination || initialState.recentWorkPagination;
      })
      .addCase(getSingleEmployerAsync.rejected, (state, { payload }) => {
        state.detail_status = asyncStatus.ERROR;
        state.detail_error = payload;
      });

    // ── CREATE ── shape: { success, message, data: employer }
    builder
      .addCase(createEmployerAsync.pending, (state) => {
        state.create_status = asyncStatus.LOADING;
        state.create_error = null;
      })
      .addCase(createEmployerAsync.fulfilled, (state) => {
        state.create_status = asyncStatus.SUCCEEDED;
      })
      .addCase(createEmployerAsync.rejected, (state, { payload }) => {
        state.create_status = asyncStatus.ERROR;
        state.create_error = payload;
      });

    // ── UPDATE ── shape: { success, message, data: employer }
    builder
      .addCase(updateEmployerAsync.pending, (state) => {
        state.update_status = asyncStatus.LOADING;
        state.update_error = null;
      })
      .addCase(updateEmployerAsync.fulfilled, (state, { payload }) => {
        state.update_status = asyncStatus.SUCCEEDED;
        const updated = payload?.data;
        if (updated) {
          const idx = state.workers.findIndex((w) => w._id === updated._id);
          if (idx !== -1) state.workers[idx] = updated;
          if (state.selectedWorker?._id === updated._id) state.selectedWorker = updated;
        }
      })
      .addCase(updateEmployerAsync.rejected, (state, { payload }) => {
        state.update_status = asyncStatus.ERROR;
        state.update_error = payload;
      });

    // ── DELETE ── shape: { success, message } (id attached in the thunk)
    builder
      .addCase(deleteEmployerAsync.pending, (state) => {
        state.delete_status = asyncStatus.LOADING;
        state.delete_error = null;
      })
      .addCase(deleteEmployerAsync.fulfilled, (state, { payload }) => {
        state.delete_status = asyncStatus.SUCCEEDED;
        state.workers = state.workers.filter((w) => w._id !== payload.id);
      })
      .addCase(deleteEmployerAsync.rejected, (state, { payload }) => {
        state.delete_status = asyncStatus.ERROR;
        state.delete_error = payload;
      });
  },
});

export const {
  resetEmployerCreateStatus,
  resetEmployerUpdateStatus,
  resetEmployerDeleteStatus,
  clearSelectedWorker,
} = employerSlice.actions;
export default employerSlice.reducer;