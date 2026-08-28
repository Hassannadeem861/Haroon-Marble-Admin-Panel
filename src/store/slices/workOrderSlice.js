import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import {
  getWorkOrdersAsync,
  getSingleWorkOrderAsync,
  createWorkOrderAsync,
  updateWorkOrderAsync,
  deleteWorkOrderAsync,
  createSampleRoundAsync,
  updateSampleRoundAsync,
} from "../services/workOrderService";

const initialState = {
  workOrders: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  get_status: asyncStatus.IDLE,
  get_error: null,

  selectedWorkOrder: null,
  rounds: [],
  stats: null,
  detail_status: asyncStatus.IDLE,
  detail_error: null,

  create_status: asyncStatus.IDLE,
  create_error: null,
  update_status: asyncStatus.IDLE,
  update_error: null,
  delete_status: asyncStatus.IDLE,
  delete_error: null,
};

const workOrderSlice = createSlice({
  name: "workOrder",
  initialState,
  reducers: {
    clearSelectedWorkOrder: (state) => {
      state.selectedWorkOrder = null;
      state.rounds = [];
      state.stats = null;
      state.detail_status = asyncStatus.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getWorkOrdersAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
      })
      .addCase(getWorkOrdersAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.workOrders = payload?.data || [];
        state.pagination = payload?.pagination || initialState.pagination;
      })
      .addCase(getWorkOrdersAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    builder
      .addCase(getSingleWorkOrderAsync.pending, (state) => {
        state.detail_status = asyncStatus.LOADING;
      })
      .addCase(getSingleWorkOrderAsync.fulfilled, (state, { payload }) => {
        state.detail_status = asyncStatus.SUCCEEDED;
        state.selectedWorkOrder = payload?.data?.workOrder || null;
        state.rounds = payload?.data?.rounds || [];
        state.stats = payload?.data?.stats || null;
      })
      .addCase(getSingleWorkOrderAsync.rejected, (state, { payload }) => {
        state.detail_status = asyncStatus.ERROR;
        state.detail_error = payload;
      });

    builder
      .addCase(createWorkOrderAsync.fulfilled, (state) => {
        state.create_status = asyncStatus.SUCCEEDED;
      })
      .addCase(createWorkOrderAsync.rejected, (state, { payload }) => {
        state.create_error = payload;
      });

    builder
      .addCase(updateWorkOrderAsync.fulfilled, (state, { payload }) => {
        const updated = payload?.data;
        if (updated) {
          const idx = state.workOrders.findIndex((w) => w._id === updated._id);
          if (idx !== -1) state.workOrders[idx] = updated;
          if (state.selectedWorkOrder?._id === updated._id) state.selectedWorkOrder = updated;
        }
      })
      .addCase(updateWorkOrderAsync.rejected, (state, { payload }) => {
        state.update_error = payload;
      });

    builder
      .addCase(deleteWorkOrderAsync.fulfilled, (state, { payload }) => {
        state.workOrders = state.workOrders.filter((w) => w._id !== payload.id);
      })
      .addCase(deleteWorkOrderAsync.rejected, (state, { payload }) => {
        state.delete_error = payload;
      });

    // Sample rounds don't need their own top-level state — after create/update
    // the component re-fetches getSingleWorkOrderAsync to refresh rounds+stats.
  },
});

export const { clearSelectedWorkOrder } = workOrderSlice.actions;
export default workOrderSlice.reducer;