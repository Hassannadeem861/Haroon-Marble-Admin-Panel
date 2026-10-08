import { createSlice } from "@reduxjs/toolkit";
import { loginAsync, logoutAsync } from "../services/authService";
import { asyncStatus } from "../../utils/asyncStatus";
import { SAVE_TOKENS_CONSTANT } from "../../utils/constant";
import { setAccessToken } from "../../utils/accessToken";

// ─────────────────────────────────────────────
// TOKEN HELPERS
// Access token sirf memory (utils/accessToken.js) mein — ye slice redux-persist se
// localStorage mein jata hai, is liye token yahan kabhi state mein nahi rakha jata.
// Refresh token httpOnly cookie mein hai (JS ki pohanch se bahar).
// ─────────────────────────────────────────────
export const clearTokens = () => {
  setAccessToken(null);
  localStorage.removeItem(SAVE_TOKENS_CONSTANT.ACCESS_TOKEN); // purane version ka token
};

// ─────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────
const initialState = {
  // Auth — user_auth persist hota hai; token reload par refresh cookie se aata hai.
  user_data: null,
  user_auth: false,
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
    // Real response shape: { success, message, user, token } — token = 15 min access token.

    builder.addCase(loginAsync.pending, (state) => {
      state.login_status = asyncStatus.LOADING;
      state.login_error = null;
    });

    builder.addCase(loginAsync.fulfilled, (state, { payload }) => {
      state.login_status = asyncStatus.SUCCEEDED;
      state.login_data = { message: payload?.message, user: payload?.user }; // token persist na ho

      if (payload?.user && payload?.token) {
        state.user_data = payload.user;
        state.user_role = payload.user?.role ?? null;
        state.user_auth = true;
        setAccessToken(payload.token);
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
      state.user_role = null;
      clearTokens();
    });

    builder.addCase(logoutAsync.rejected, (state, { payload }) => {
      state.logout_auth_status = asyncStatus.ERROR;
      state.logout_auth_error = payload;
      state.user_data = null;
      state.user_auth = false;
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