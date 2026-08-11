import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import {
  getSalarySlipsAsync,
  createSalarySlipAsync,
  updateSalarySlipAsync,
  deleteSalarySlipAsync,
} from "../services/salarySlipService.js";

const initialState = {
  salarySlips: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },

  get_status: asyncStatus.IDLE,
  get_error: null,

  create_status: asyncStatus.IDLE,
  create_error: null,

  update_status: asyncStatus.IDLE,
  update_error: null,

  delete_status: asyncStatus.IDLE,
  delete_error: null,
};

const salarySlipSlice = createSlice({
  name: "salarySlip",
  initialState,
  reducers: {
    resetSalarySlipCreateStatus: (state) => {
      state.create_status = asyncStatus.IDLE;
      state.create_error = null;
    },
    resetSalarySlipUpdateStatus: (state) => {
      state.update_status = asyncStatus.IDLE;
      state.update_error = null;
    },
    resetSalarySlipDeleteStatus: (state) => {
      state.delete_status = asyncStatus.IDLE;
      state.delete_error = null;
    },
  },
  extraReducers: (builder) => {
    // ── LIST ── real shape: { success, total, page, totalPages, salarySlips }
    builder
      .addCase(getSalarySlipsAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
        state.get_error = null;
      })
      .addCase(getSalarySlipsAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.salarySlips = payload?.salarySlips || [];
        state.pagination = {
          page: payload?.page ?? 1,
          limit: state.pagination.limit,
          total: payload?.total ?? 0,
          totalPages: payload?.totalPages ?? 1,
        };
      })
      .addCase(getSalarySlipsAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    // ── CREATE ── real shape: { success, message, salarySlip }
    builder
      .addCase(createSalarySlipAsync.pending, (state) => {
        state.create_status = asyncStatus.LOADING;
        state.create_error = null;
      })
      .addCase(createSalarySlipAsync.fulfilled, (state) => {
        state.create_status = asyncStatus.SUCCEEDED;
      })
      .addCase(createSalarySlipAsync.rejected, (state, { payload }) => {
        state.create_status = asyncStatus.ERROR;
        state.create_error = payload;
      });

    // ── UPDATE ── real shape: { success, message, salarySlip }
    builder
      .addCase(updateSalarySlipAsync.pending, (state) => {
        state.update_status = asyncStatus.LOADING;
        state.update_error = null;
      })
      .addCase(updateSalarySlipAsync.fulfilled, (state, { payload }) => {
        state.update_status = asyncStatus.SUCCEEDED;
        const updated = payload?.salarySlip;
        if (updated) {
          const idx = state.salarySlips.findIndex((s) => s._id === updated._id);
          if (idx !== -1) state.salarySlips[idx] = updated;
        }
      })
      .addCase(updateSalarySlipAsync.rejected, (state, { payload }) => {
        state.update_status = asyncStatus.ERROR;
        state.update_error = payload;
      });

    // ── DELETE ── real shape: { message } (id attached in the thunk)
    builder
      .addCase(deleteSalarySlipAsync.pending, (state) => {
        state.delete_status = asyncStatus.LOADING;
        state.delete_error = null;
      })
      .addCase(deleteSalarySlipAsync.fulfilled, (state, { payload }) => {
        state.delete_status = asyncStatus.SUCCEEDED;
        state.salarySlips = state.salarySlips.filter((s) => s._id !== payload.id);
      })
      .addCase(deleteSalarySlipAsync.rejected, (state, { payload }) => {
        state.delete_status = asyncStatus.ERROR;
        state.delete_error = payload;
      });
  },
});

export const {
  resetSalarySlipCreateStatus,
  resetSalarySlipUpdateStatus,
  resetSalarySlipDeleteStatus,
} = salarySlipSlice.actions;
export default salarySlipSlice.reducer;