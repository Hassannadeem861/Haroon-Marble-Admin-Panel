import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import { getDashboardSummaryAsync } from "../services/dashboardService.js";

const initialState = {
  statCards: null,
  recentActivity: null,
  charts: null,
  status: asyncStatus.IDLE,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardSummaryAsync.pending, (state) => {
        state.status = asyncStatus.LOADING;
        state.error = null;
      })
      .addCase(getDashboardSummaryAsync.fulfilled, (state, { payload }) => {
        state.status = asyncStatus.SUCCEEDED;
        state.statCards = payload?.data?.statCards || null;
        state.recentActivity = payload?.data?.recentActivity || null;
        state.charts = payload?.data?.charts || null;
      })
      .addCase(getDashboardSummaryAsync.rejected, (state, { payload }) => {
        state.status = asyncStatus.ERROR;
        state.error = payload;
      });
  },
});

export default dashboardSlice.reducer;