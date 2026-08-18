import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants } from "../../utils/constant";

// Backend: GET /salary-slip/:employerId?startDate=DD/MM/YYYY&endDate=DD/MM/YYYY
// -> { success, slip: { employer, period, entries, totalDays, presentDays,
//      absentDays, totalBaseSalary, totalOvertimeHours, totalOvertimeAmount,
//      totalAdvance, grossSalary, netSalary } }
export const getSalarySlipAsync = createAsyncThunk(
  typeConstants.GET_SALARY_SLIP,
  async ({ employerId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get(`/salary-slip/${employerId}`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to generate salary slip",
      );
    }
  },
);