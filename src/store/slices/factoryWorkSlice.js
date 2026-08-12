import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";

import {
  getFactoryWorksAsync,
  getSingleFactoryWorkAsync,
  createFactoryWorkAsync,
  updateFactoryWorkAsync,
  addFactoryPaymentAsync,
  updateMaterialMovementAsync,
  updateSiteArrivalAsync,
  setVehicleInfoAsync,
  addVehiclePaymentAsync,
  deleteFactoryWorkAsync,
} from "../services/factoryWorkService";

const initialState = {
  factoryWorks: [],
  currentFactoryWork: null,

  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },

  get_status: asyncStatus.IDLE,
  get_error: null,

  single_status: asyncStatus.IDLE,
  single_error: null,

  create_status: asyncStatus.IDLE,
  create_error: null,

  update_status: asyncStatus.IDLE,
  update_error: null,

  payment_status: asyncStatus.IDLE,
  payment_error: null,

  movement_status: asyncStatus.IDLE,
  movement_error: null,

  arrival_status: asyncStatus.IDLE,
  arrival_error: null,

  vehicle_status: asyncStatus.IDLE,
  vehicle_error: null,

  vehiclePayment_status: asyncStatus.IDLE,
  vehiclePayment_error: null,

  delete_status: asyncStatus.IDLE,
  delete_error: null,
};

const factoryWorkSlice = createSlice({
  name: "factoryWork",
  initialState,

  reducers: {
    clearCurrentFactoryWork: (state) => {
      state.currentFactoryWork = null;
      state.single_status = asyncStatus.IDLE;
      state.single_error = null;
    },

    resetFactoryWorkCreateStatus: (state) => {
      state.create_status = asyncStatus.IDLE;
      state.create_error = null;
    },

    resetFactoryWorkPaymentStatus: (state) => {
      state.payment_status = asyncStatus.IDLE;
      state.payment_error = null;
    },

    resetMovementStatus: (state) => {
      state.movement_status = asyncStatus.IDLE;
      state.movement_error = null;
    },

    resetArrivalStatus: (state) => {
      state.arrival_status = asyncStatus.IDLE;
      state.arrival_error = null;
    },

    resetVehicleStatus: (state) => {
      state.vehicle_status = asyncStatus.IDLE;
      state.vehicle_error = null;
    },

    resetVehiclePaymentStatus: (state) => {
      state.vehiclePayment_status = asyncStatus.IDLE;
      state.vehiclePayment_error = null;
    },

    resetDeleteStatus: (state) => {
      state.delete_status = asyncStatus.IDLE;
      state.delete_error = null;
    },
  },

  extraReducers: (builder) => {
    // GET ALL
    builder
      .addCase(getFactoryWorksAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
        state.get_error = null;
      })
      .addCase(getFactoryWorksAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;

        state.factoryWorks =
          payload?.factoryWorks ||
          payload?.works ||
          [];

        state.pagination = {
          page: payload?.page ?? 1,
          limit: state.pagination.limit,
          total: payload?.total ?? state.factoryWorks.length,
          totalPages: payload?.totalPages ?? 1,
        };
      })
      .addCase(getFactoryWorksAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    // SINGLE
    builder
      .addCase(getSingleFactoryWorkAsync.pending, (state) => {
        state.single_status = asyncStatus.LOADING;
        state.single_error = null;
      })
      .addCase(
        getSingleFactoryWorkAsync.fulfilled,
        (state, { payload }) => {
          state.single_status = asyncStatus.SUCCEEDED;

          state.currentFactoryWork =
            payload?.factoryWork || payload?.work || null;
        }
      )
      .addCase(getSingleFactoryWorkAsync.rejected, (state, { payload }) => {
        state.single_status = asyncStatus.ERROR;
        state.single_error = payload;
      });

    // CREATE
    builder
      .addCase(createFactoryWorkAsync.pending, (state) => {
        state.create_status = asyncStatus.LOADING;
        state.create_error = null;
      })
      .addCase(createFactoryWorkAsync.fulfilled, (state) => {
        state.create_status = asyncStatus.SUCCEEDED;
      })
      .addCase(createFactoryWorkAsync.rejected, (state, { payload }) => {
        state.create_status = asyncStatus.ERROR;
        state.create_error = payload;
      });

    // UPDATE
    builder
      .addCase(updateFactoryWorkAsync.pending, (state) => {
        state.update_status = asyncStatus.LOADING;
        state.update_error = null;
      })
      .addCase(updateFactoryWorkAsync.fulfilled, (state, { payload }) => {
        state.update_status = asyncStatus.SUCCEEDED;

        const updated = payload?.factoryWork;

        if (updated) {
          state.currentFactoryWork = updated;

          const index = state.factoryWorks.findIndex(
            (item) => item._id === updated._id
          );

          if (index !== -1) {
            state.factoryWorks[index] = updated;
          }
        }
      })
      .addCase(updateFactoryWorkAsync.rejected, (state, { payload }) => {
        state.update_status = asyncStatus.ERROR;
        state.update_error = payload;
      });

    // FACTORY PAYMENT
    builder
      .addCase(addFactoryPaymentAsync.pending, (state) => {
        state.payment_status = asyncStatus.LOADING;
        state.payment_error = null;
      })
      .addCase(addFactoryPaymentAsync.fulfilled, (state, { payload }) => {
        state.payment_status = asyncStatus.SUCCEEDED;

        const updated = payload?.factoryWork;

        if (updated) {
          state.currentFactoryWork = updated;

          const index = state.factoryWorks.findIndex(
            (item) => item._id === updated._id
          );

          if (index !== -1) {
            state.factoryWorks[index] = updated;
          }
        }
      })
      .addCase(addFactoryPaymentAsync.rejected, (state, { payload }) => {
        state.payment_status = asyncStatus.ERROR;
        state.payment_error = payload;
      });

    // MATERIAL MOVEMENT
    builder
      .addCase(updateMaterialMovementAsync.pending, (state) => {
        state.movement_status = asyncStatus.LOADING;
        state.movement_error = null;
      })
      .addCase(
        updateMaterialMovementAsync.fulfilled,
        (state, { payload }) => {
          state.movement_status = asyncStatus.SUCCEEDED;

          const updated = payload?.factoryWork;

          if (updated) {
            state.currentFactoryWork = updated;

            const index = state.factoryWorks.findIndex(
              (item) => item._id === updated._id
            );

            if (index !== -1) {
              state.factoryWorks[index] = updated;
            }
          }
        }
      )
      .addCase(
        updateMaterialMovementAsync.rejected,
        (state, { payload }) => {
          state.movement_status = asyncStatus.ERROR;
          state.movement_error = payload;
        }
      );

    // SITE ARRIVAL
    builder
      .addCase(updateSiteArrivalAsync.pending, (state) => {
        state.arrival_status = asyncStatus.LOADING;
        state.arrival_error = null;
      })
      .addCase(updateSiteArrivalAsync.fulfilled, (state, { payload }) => {
        state.arrival_status = asyncStatus.SUCCEEDED;

        const updated = payload?.factoryWork;

        if (updated) {
          state.currentFactoryWork = updated;

          const index = state.factoryWorks.findIndex(
            (item) => item._id === updated._id
          );

          if (index !== -1) {
            state.factoryWorks[index] = updated;
          }
        }
      })
      .addCase(updateSiteArrivalAsync.rejected, (state, { payload }) => {
        state.arrival_status = asyncStatus.ERROR;
        state.arrival_error = payload;
      });

    // VEHICLE
    builder
      .addCase(setVehicleInfoAsync.pending, (state) => {
        state.vehicle_status = asyncStatus.LOADING;
        state.vehicle_error = null;
      })
      .addCase(setVehicleInfoAsync.fulfilled, (state, { payload }) => {
        state.vehicle_status = asyncStatus.SUCCEEDED;

        const updated = payload?.factoryWork;

        if (updated) {
          state.currentFactoryWork = updated;

          const index = state.factoryWorks.findIndex(
            (item) => item._id === updated._id
          );

          if (index !== -1) {
            state.factoryWorks[index] = updated;
          }
        }
      })
      .addCase(setVehicleInfoAsync.rejected, (state, { payload }) => {
        state.vehicle_status = asyncStatus.ERROR;
        state.vehicle_error = payload;
      });

    // VEHICLE PAYMENT
    builder
      .addCase(addVehiclePaymentAsync.pending, (state) => {
        state.vehiclePayment_status = asyncStatus.LOADING;
        state.vehiclePayment_error = null;
      })
      .addCase(addVehiclePaymentAsync.fulfilled, (state, { payload }) => {
        state.vehiclePayment_status = asyncStatus.SUCCEEDED;

        const updated = payload?.factoryWork;

        if (updated) {
          state.currentFactoryWork = updated;

          const index = state.factoryWorks.findIndex(
            (item) => item._id === updated._id
          );

          if (index !== -1) {
            state.factoryWorks[index] = updated;
          }
        }
      })
      .addCase(
        addVehiclePaymentAsync.rejected,
        (state, { payload }) => {
          state.vehiclePayment_status = asyncStatus.ERROR;
          state.vehiclePayment_error = payload;
        }
      );

    // DELETE
    builder
      .addCase(deleteFactoryWorkAsync.pending, (state) => {
        state.delete_status = asyncStatus.LOADING;
        state.delete_error = null;
      })
      .addCase(deleteFactoryWorkAsync.fulfilled, (state, { payload }) => {
        state.delete_status = asyncStatus.SUCCEEDED;

        state.factoryWorks = state.factoryWorks.filter(
          (item) => item._id !== payload.id
        );
      })
      .addCase(deleteFactoryWorkAsync.rejected, (state, { payload }) => {
        state.delete_status = asyncStatus.ERROR;
        state.delete_error = payload;
      });
  },
});

export const {
  clearCurrentFactoryWork,
  resetFactoryWorkCreateStatus,
  resetFactoryWorkPaymentStatus,
  resetMovementStatus,
  resetArrivalStatus,
  resetVehicleStatus,
  resetVehiclePaymentStatus,
  resetDeleteStatus,
} = factoryWorkSlice.actions;

export default factoryWorkSlice.reducer;