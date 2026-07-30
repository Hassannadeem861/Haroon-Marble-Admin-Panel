import axios from "axios"
import toast from "react-hot-toast"
import { SAVE_TOKENS_CONSTANT } from "./constant.js";

// ------------------- BASE URL -------------------
export const baseURL = import.meta.env.VITE_SERVER_URL // live backend

// ------------------- Axios Instance -------------------
export const apiHandle = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
})

// ------------------- Session Expired Handler -------------------
export const sessionExpired = async () => {
  localStorage.clear() // Remove tokens

  // Lazy import — avoids a circular import between the store and this file
  const { store } = await import("../store/store.js")
  const { logout } = await import("../store/slices/authSlice.js")

  store.dispatch(logout())
  toast.error("Session expired. Please login again.")
  window.location.href = "/login"
}

// ------------------- Request Interceptor -------------------
apiHandle.interceptors.request.use(
  config => {
    const token = localStorage.getItem(SAVE_TOKENS_CONSTANT.ACCESS_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// ------------------- Response Interceptor -------------------
// There is no refresh-token endpoint on this API. A 401 means the access
// token is missing/expired/invalid, so the session ends immediately instead
// of attempting a silent refresh + retry.
apiHandle.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status

    if (status === 401) {
      sessionExpired()
    }

    return Promise.reject(error)
  }
)