import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiHandle } from "../../utils/apiHandle";
import { typeConstants, SAVE_TOKENS_CONSTANT } from "../../utils/constant";

// =========>>>>>>> Login <<<<<===========
export const loginAsync = createAsyncThunk(
  typeConstants.LOGIN,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/login", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Login failed"
      );
    }
  }
);

export const logoutAsync = createAsyncThunk(
  typeConstants.LOGOUT_AUTH,
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiHandle.post("/logout");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Logout failed"
      );
    }
  }
);