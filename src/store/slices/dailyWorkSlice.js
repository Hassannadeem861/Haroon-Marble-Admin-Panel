import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import {
  getWorkersListAsync,
  getDailyWorksAsync,
  createDailyWorkAsync,
  updateDailyWorkAsync,
  deleteDailyWorkAsync,
} from "../services/dailyWorkService.js";

const initialState = {
  workersList: [],
  workersList_status: asyncStatus.IDLE,
  workersList_error: null,

  entries: [],
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

const dailyWorkSlice = createSlice({
  name: "dailyWork",
  initialState,
  reducers: {
    resetDailyWorkCreateStatus: (state) => {
      state.create_status = asyncStatus.IDLE;
      state.create_error = null;
    },
    resetDailyWorkUpdateStatus: (state) => {
      state.update_status = asyncStatus.IDLE;
      state.update_error = null;
    },
    resetDailyWorkDeleteStatus: (state) => {
      state.delete_status = asyncStatus.IDLE;
      state.delete_error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getWorkersListAsync.pending, (state) => {
        state.workersList_status = asyncStatus.LOADING;
        state.workersList_error = null;
      })
      .addCase(getWorkersListAsync.fulfilled, (state, { payload }) => {
        state.workersList_status = asyncStatus.SUCCEEDED;
        state.workersList = payload?.data || [];
      })
      .addCase(getWorkersListAsync.rejected, (state, { payload }) => {
        state.workersList_status = asyncStatus.ERROR;
        state.workersList_error = payload;
      });

    builder
      .addCase(getDailyWorksAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
        state.get_error = null;
      })
      .addCase(getDailyWorksAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.entries = payload?.data || [];
        state.pagination = payload?.pagination || initialState.pagination;
      })
      .addCase(getDailyWorksAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    builder
      .addCase(createDailyWorkAsync.pending, (state) => {
        state.create_status = asyncStatus.LOADING;
        state.create_error = null;
      })
      .addCase(createDailyWorkAsync.fulfilled, (state) => {
        state.create_status = asyncStatus.SUCCEEDED;
      })
      .addCase(createDailyWorkAsync.rejected, (state, { payload }) => {
        state.create_status = asyncStatus.ERROR;
        state.create_error = payload;
      });

    builder
      .addCase(updateDailyWorkAsync.pending, (state) => {
        state.update_status = asyncStatus.LOADING;
        state.update_error = null;
      })
      .addCase(updateDailyWorkAsync.fulfilled, (state, { payload }) => {
        state.update_status = asyncStatus.SUCCEEDED;
        const updated = payload?.data;
        if (updated) {
          const idx = state.entries.findIndex((e) => e._id === updated._id);
          if (idx !== -1) state.entries[idx] = updated;
        }
      })
      .addCase(updateDailyWorkAsync.rejected, (state, { payload }) => {
        state.update_status = asyncStatus.ERROR;
        state.update_error = payload;
      });

    builder
      .addCase(deleteDailyWorkAsync.pending, (state) => {
        state.delete_status = asyncStatus.LOADING;
        state.delete_error = null;
      })
      .addCase(deleteDailyWorkAsync.fulfilled, (state, { payload }) => {
        state.delete_status = asyncStatus.SUCCEEDED;
        state.entries = state.entries.filter((e) => e._id !== payload.id);
      })
      .addCase(deleteDailyWorkAsync.rejected, (state, { payload }) => {
        state.delete_status = asyncStatus.ERROR;
        state.delete_error = payload;
      });
  },
});

export const {
  resetDailyWorkCreateStatus,
  resetDailyWorkUpdateStatus,
  resetDailyWorkDeleteStatus,
} = dailyWorkSlice.actions;
export default dailyWorkSlice.reducer;