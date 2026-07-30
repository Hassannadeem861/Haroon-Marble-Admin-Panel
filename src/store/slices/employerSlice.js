import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import {
  getEmployersAsync,
  createEmployerAsync,
  updateEmployerAsync,
  deleteEmployerAsync,
} from "../services/employerService";

const initialState = {
  employers: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },

  get_status: asyncStatus.IDLE,
  get_error: null,

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
  },
  extraReducers: (builder) => {
    // ── LIST ── real shape: { success, total, page, totalPages, employers }
    builder
      .addCase(getEmployersAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
        state.get_error = null;
      })
      .addCase(getEmployersAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.employers = payload?.employers || [];
        state.pagination = {
          page: payload?.page ?? 1,
          limit: state.pagination.limit,
          total: payload?.total ?? 0,
          totalPages: payload?.totalPages ?? 1,
        };
      })
      .addCase(getEmployersAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    // ── CREATE ── real shape: { success, message, employer }
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

    // ── UPDATE ── real shape: { success, message, employer }
    builder
      .addCase(updateEmployerAsync.pending, (state) => {
        state.update_status = asyncStatus.LOADING;
        state.update_error = null;
      })
      .addCase(updateEmployerAsync.fulfilled, (state, { payload }) => {
        state.update_status = asyncStatus.SUCCEEDED;
        const updated = payload?.employer;
        if (updated) {
          const idx = state.employers.findIndex((e) => e._id === updated._id);
          if (idx !== -1) state.employers[idx] = updated;
        }
      })
      .addCase(updateEmployerAsync.rejected, (state, { payload }) => {
        state.update_status = asyncStatus.ERROR;
        state.update_error = payload;
      });

    // ── DELETE ── real shape: { message } (id attached in the thunk)
    builder
      .addCase(deleteEmployerAsync.pending, (state) => {
        state.delete_status = asyncStatus.LOADING;
        state.delete_error = null;
      })
      .addCase(deleteEmployerAsync.fulfilled, (state, { payload }) => {
        state.delete_status = asyncStatus.SUCCEEDED;
        state.employers = state.employers.filter((e) => e._id !== payload.id);
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
} = employerSlice.actions;
export default employerSlice.reducer;