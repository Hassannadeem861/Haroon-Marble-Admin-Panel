import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants, SAVE_TOKENS_CONSTANT } from "../../utils/constant";

// =========>>>>>>> Login <<<<<===========
export const loginAsync = createAsyncThunk(
  typeConstants.LOGIN,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("admin/login", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Login failed"
      );
    }
  }
);

// =========>>>>>>> Logout <<<<<===========
export const logoutAsync = createAsyncThunk(
  typeConstants.LOGOUT_AUTH,
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem(SAVE_TOKENS_CONSTANT.REFRESH_TOKEN);
      const response = await apiHandle.post("admin/logout", { refreshToken });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Logout failed"
      );
    }
  }
);

// =========>>>>>>> Check Auth <<<<<===========
export const checkAuthAsync = createAsyncThunk(
  typeConstants.CHECK_AUTH,
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("admin/me");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Auth check failed"
      );
    }
  }
);