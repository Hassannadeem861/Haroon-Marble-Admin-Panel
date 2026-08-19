import { configureStore, combineReducers } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice.js";
import dashboardReducer from "./slices/dashboardSlice.js";
import employerReducer from "./slices/employerSlice.js";
import dailyWorkReducer from "./slices/dailyWorkSlice.js";
import factoryWorkReducer from "./slices/factoryWorkSlice.js";
import salarySlipReducer from "./slices/salarySlipSlice.js";
import siteReducer from "./slices/siteSlice.js";

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from "redux-persist"

const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
}

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
}

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  employer: employerReducer,
  dailyWork: dailyWorkReducer,
  factoryWork: factoryWorkReducer,
  salarySlip: salarySlipReducer,
  site: siteReducer,

})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware({
    serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] }
  })
})

export const persistor = persistStore(store)
