import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import { getDashboardAsync } from "../services/dashboardService";

const initialState = {
  dashboard: null,
  get_status: asyncStatus.IDLE,
  get_error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboardStatus: (state) => {
      state.get_status = asyncStatus.IDLE;
      state.get_error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
        state.get_error = null;
      })
      .addCase(getDashboardAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.dashboard = payload?.data || null;
      })
      .addCase(getDashboardAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });
  },
});

export const { resetDashboardStatus } = dashboardSlice.actions;
export default dashboardSlice.reducer;
