import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import {
  getFactoryWorksAsync,
  getSingleFactoryWorkAsync,
  createFactoryWorkAsync,
  addFactoryPaymentAsync,
  updateMaterialMovementAsync,
  updateSiteArrivalAsync,
  setVehicleInfoAsync,
  addVehiclePaymentAsync,
  deleteFactoryWorkAsync,
  updateFactoryWorkAsync
} from "../services/factoryWorkService";

const initialState = {
  factoryWorks: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  get_status: asyncStatus.IDLE,
  get_error: null,

  singleWork: null,
  get_single_status: asyncStatus.IDLE,
  get_single_error: null,

  action_status: asyncStatus.IDLE, // shared for create/update/payment/vehicle actions
  action_error: null,

  delete_status: asyncStatus.IDLE,
  delete_error: null,
};

const applyUpdatedWork = (state, updatedWork) => {
  if (!updatedWork) return;
  state.singleWork = updatedWork;
  const idx = state.factoryWorks.findIndex((w) => w._id === updatedWork._id);
  if (idx !== -1) state.factoryWorks[idx] = updatedWork;
};

const factoryWorkSlice = createSlice({
  name: "factoryWork",
  initialState,
  reducers: {
    resetActionStatus: (state) => {
      state.action_status = asyncStatus.IDLE;
      state.action_error = null;
    },
    clearSingleWork: (state) => {
      state.singleWork = null;
      state.get_single_status = asyncStatus.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFactoryWorksAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
      })
      .addCase(getFactoryWorksAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.factoryWorks = payload?.factoryWorks || [];
        state.pagination = {
          page: payload?.page ?? 1,
          limit: state.pagination.limit,
          total: payload?.total ?? 0,
          totalPages: payload?.totalPages ?? 1,
        };
      })
      .addCase(getFactoryWorksAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    builder
      .addCase(getSingleFactoryWorkAsync.pending, (state) => {
        state.get_single_status = asyncStatus.LOADING;
      })
      .addCase(getSingleFactoryWorkAsync.fulfilled, (state, { payload }) => {
        state.get_single_status = asyncStatus.SUCCEEDED;
        state.singleWork = payload?.factoryWork || null;
      })
      .addCase(getSingleFactoryWorkAsync.rejected, (state, { payload }) => {
        state.get_single_status = asyncStatus.ERROR;
        state.get_single_error = payload;
      });

    const actionCases = [
      createFactoryWorkAsync,
      addFactoryPaymentAsync,
      updateFactoryWorkAsync,
      updateMaterialMovementAsync,
      updateSiteArrivalAsync,
      setVehicleInfoAsync,
      addVehiclePaymentAsync,
    ];

    actionCases.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.action_status = asyncStatus.LOADING;
          state.action_error = null;
        })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state.action_status = asyncStatus.SUCCEEDED;
          applyUpdatedWork(state, payload?.factoryWork);
        })
        .addCase(thunk.rejected, (state, { payload }) => {
          state.action_status = asyncStatus.ERROR;
          state.action_error = payload;
        });
    });

    builder
      .addCase(deleteFactoryWorkAsync.pending, (state) => {
        state.delete_status = asyncStatus.LOADING;
      })
      .addCase(deleteFactoryWorkAsync.fulfilled, (state, { payload }) => {
        state.delete_status = asyncStatus.SUCCEEDED;
        state.factoryWorks = state.factoryWorks.filter((w) => w._id !== payload.id);
      })
      .addCase(deleteFactoryWorkAsync.rejected, (state, { payload }) => {
        state.delete_status = asyncStatus.ERROR;
        state.delete_error = payload;
      });
  },
});

export const { resetActionStatus, clearSingleWork } = factoryWorkSlice.actions;
export default factoryWorkSlice.reducer;