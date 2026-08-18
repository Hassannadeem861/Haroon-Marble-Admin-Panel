import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import { getSalarySlipAsync } from "../services/salarySlipService.js";

const initialState = {
  slip: null,
  status: asyncStatus.IDLE,
  error: null,
};

const salarySlipSlice = createSlice({
  name: "salarySlip",
  initialState,
  reducers: {
    clearSalarySlip: (state) => {
      state.slip = null;
      state.status = asyncStatus.IDLE;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSalarySlipAsync.pending, (state) => {
        state.status = asyncStatus.LOADING;
        state.error = null;
      })
      .addCase(getSalarySlipAsync.fulfilled, (state, { payload }) => {
        state.status = asyncStatus.SUCCEEDED;
        state.slip = payload?.slip || null;
      })
      .addCase(getSalarySlipAsync.rejected, (state, { payload }) => {
        state.status = asyncStatus.ERROR;
        state.error = payload;
      });
  },
});

export const { clearSalarySlip } = salarySlipSlice.actions;
export default salarySlipSlice.reducer;