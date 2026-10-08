import axios from "axios"
import toast from "react-hot-toast"
import { getAccessToken, setAccessToken } from "./accessToken.js"

// ------------------- BASE URL -------------------
// "/api/v1" = same-origin. Live par vercel.json rewrite, local par vite.config.js proxy
// backend tak pohanchata hai — is liye refresh cookie first-party rehta hai (Safari bhi block nahi karta).
export const baseURL = import.meta.env.VITE_SERVER_URL || "/api/v1"

// Ye endpoints khud token dete/lete hain — in par auto-refresh nahi.
const AUTH_PATHS = ["/login", "/refresh-token", "/logout"]
const isAuthPath = (url = "") => AUTH_PATHS.some((path) => url.endsWith(path))

// ------------------- Axios Instance -------------------
export const apiHandle = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000,
  withCredentials: true
})

// ------------------- Session Expired Handler -------------------
let sessionEnding = false

export const sessionExpired = async () => {
  if (sessionEnding) return // kai requests ek sath fail hon to ek hi dafa
  sessionEnding = true
  setAccessToken(null)
  localStorage.clear()

  // Lazy import — avoids a circular import between the store and this file
  const { store } = await import("../store/store.js")
  const { logout } = await import("../store/slices/authSlice.js")

  store.dispatch(logout())
  toast.error("Session expired. Please login again.")
  window.location.href = "/login"
}

// ------------------- Refresh (ek waqt mein sirf ek) -------------------
// Refresh token httpOnly cookie mein hai — browser khud bhejta hai. Kai requests ek sath
// 401 payen to sab isi ek promise ka intezar karti hain.
let refreshPromise = null

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/refresh-token`, {}, { withCredentials: true, timeout: 15000 })
      .then((response) => {
        const token = response.data?.data?.accessToken
        if (!token) throw new Error("No access token in refresh response")
        setAccessToken(token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// ------------------- Request Interceptor -------------------
// Reload ke baad memory khali hoti hai — pehli request se pehle hi naya token le lo.
apiHandle.interceptors.request.use(
  async config => {
    if (!isAuthPath(config.url)) {
      let token = getAccessToken()
      if (!token) {
        try {
          token = await refreshAccessToken()
        } catch {
          token = null // request bina token jayegi, 401 aayega aur response interceptor sambhal lega
        }
      }
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// ------------------- Response Interceptor -------------------
// 401 = access token expire (15 min). Ek dafa refresh karke wahi request dobara bhejo;
// refresh bhi fail ho (30 din guzar gaye / logout / chori ka shak) to login page.
apiHandle.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    const status = error.response?.status

    if (status !== 401 || !original || isAuthPath(original.url)) {
      return Promise.reject(error)
    }

    if (original._retried) {
      sessionExpired()
      return Promise.reject(error)
    }

    try {
      const token = await refreshAccessToken()
      original._retried = true
      original.headers.Authorization = `Bearer ${token}`
      return apiHandle(original)
    } catch {
      sessionExpired()
      return Promise.reject(error)
    }
  }
)
