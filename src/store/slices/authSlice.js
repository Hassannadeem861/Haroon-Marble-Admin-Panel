import { createSlice } from "@reduxjs/toolkit";
import { loginAsync, logoutAsync } from "../services/authService";
import { asyncStatus } from "../../utils/asyncStatus";
import { SAVE_TOKENS_CONSTANT } from "../../utils/constant";

// ─────────────────────────────────────────────
// TOKEN HELPERS
// There is no refresh token in this API — only a single access token.
// ─────────────────────────────────────────────
const saveToken = (token) => {
  if (token) localStorage.setItem(SAVE_TOKENS_CONSTANT.ACCESS_TOKEN, token);
};

export const clearTokens = () => {
  localStorage.removeItem(SAVE_TOKENS_CONSTANT.ACCESS_TOKEN);
};

// ─────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────
const initialState = {
  // Auth
  user_data: null,
  user_auth: !!localStorage.getItem(SAVE_TOKENS_CONSTANT.ACCESS_TOKEN),
  accessToken: localStorage.getItem(SAVE_TOKENS_CONSTANT.ACCESS_TOKEN) || null,
  user_role: null,

  // Login
  login_status: asyncStatus.IDLE,
  login_data: null,
  login_error: null,

  // Logout
  logout_auth_status: asyncStatus.IDLE,
  logout_auth_error: null,

  // Check Auth
  check_auth_status: asyncStatus.IDLE,
  check_auth_data: null,
  check_auth_error: null,
};

// ─────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────
const userAuthSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    // Sync logout — used by the axios 401 interceptor
    logout: (state) => {
      state.user_data = null;
      state.user_auth = false;
      state.accessToken = null;
      state.user_role = null;
      state.login_status = asyncStatus.IDLE;
      clearTokens();
    },

    setLoginStatus: (state) => {
      state.login_status = asyncStatus.IDLE;
    },

    setLogoutStatus: (state) => {
      state.logout_auth_status = asyncStatus.IDLE;
    },

    setCheckAuthStatus: (state) => {
      state.check_auth_status = asyncStatus.IDLE;
    },
  },

  extraReducers: (builder) => {
    // =========>>>>>>> Login <<<<<===========
    // Real response shape: { message, user, token }

    builder.addCase(loginAsync.pending, (state) => {
      state.login_status = asyncStatus.LOADING;
      state.login_error = null;
    });

    builder.addCase(loginAsync.fulfilled, (state, { payload }) => {
      state.login_status = asyncStatus.SUCCEEDED;
      state.login_data = payload;

      if (payload?.user && payload?.token) {
        state.user_data = payload.user;
        state.user_role = payload.user?.role ?? null;
        state.accessToken = payload.token;
        state.user_auth = true;
        saveToken(payload.token);
      }
    });

    builder.addCase(loginAsync.rejected, (state, { payload }) => {
      state.login_status = asyncStatus.ERROR;
      state.login_error = payload;
      state.user_auth = false;
    });

    // =========>>>>>>> Logout <<<<<===========
    // NOTE: update this once the real /logout response shape is confirmed —
    // kept structurally the same as before, minus refresh-token cleanup.

    builder.addCase(logoutAsync.pending, (state) => {
      state.logout_auth_status = asyncStatus.LOADING;
    });

    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.logout_auth_status = asyncStatus.SUCCEEDED;
      state.user_data = null;
      state.user_auth = false;
      state.accessToken = null;
      state.user_role = null;
      clearTokens();
    });

    builder.addCase(logoutAsync.rejected, (state, { payload }) => {
      state.logout_auth_status = asyncStatus.ERROR;
      state.logout_auth_error = payload;
      state.user_data = null;
      state.user_auth = false;
      state.accessToken = null;
      clearTokens();
    });

    // =========>>>>>>> Check Auth <<<<<===========
    // NOTE: update this once the real /check-auth response shape is
    // confirmed — currently assumed to mirror login's `user` shape.

    // builder.addCase(checkAuthAsync.pending, (state) => {
    //   state.check_auth_status = asyncStatus.LOADING;
    // });

    // builder.addCase(checkAuthAsync.fulfilled, (state, { payload }) => {
    //   state.check_auth_status = asyncStatus.SUCCEEDED;
    //   state.check_auth_data = payload;

    //   if (payload?.user) {
    //     state.user_data = payload.user;
    //     state.user_role = payload.user?.role ?? null;
    //     state.user_auth = true;
    //   }
    // });

    // builder.addCase(checkAuthAsync.rejected, (state, { payload }) => {
    //   state.check_auth_status = asyncStatus.ERROR;
    //   state.check_auth_error = payload;
    //   state.user_auth = false;
    //   state.user_data = null;
    //   clearTokens();
    // });
  },
});

export const { logout, setLoginStatus, setLogoutStatus, setCheckAuthStatus } = userAuthSlice.actions;
export default userAuthSlice.reducer;