import { createSlice } from "@reduxjs/toolkit";
import { asyncStatus } from "../../utils/asyncStatus";
import {
  getSitesAsync,
  getSitesListAsync,
  getSingleSiteAsync,
  createSiteAsync,
  updateSiteAsync,
  deleteSiteAsync,
} from "../services/siteService";
import {
  createSiteExpenseAsync,
  updateSiteExpenseAsync,
  deleteSiteExpenseAsync,
} from "../services/siteExpenseService";
import {
  createSiteMaterialAsync,
  updateSiteMaterialAsync,
  deleteSiteMaterialAsync,
} from "../services/siteMaterialService";

const initialPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

const initialState = {
  // ── master list ──
  sites: [],
  pagination: initialPagination,
  get_status: asyncStatus.IDLE,
  get_error: null,

  // ── dropdown list (active sites) ──
  sitesList: [],
  sitesList_status: asyncStatus.IDLE,

  // ── single site (profile + summary + expenses + materials) ──
  selectedSite: null,
  summary: null,
  expenses: [],
  expensesPagination: initialPagination,
  materials: [],
  materialsPagination: initialPagination,
  detail_status: asyncStatus.IDLE,
  detail_error: null,

  // ── site CRUD ──
  create_status: asyncStatus.IDLE,
  create_error: null,
  update_status: asyncStatus.IDLE,
  update_error: null,
  delete_status: asyncStatus.IDLE,
  delete_error: null,

  // ── expense CRUD (within a site) ──
  expense_status: asyncStatus.IDLE,
  expense_error: null,

  // ── material CRUD (within a site) ──
  material_status: asyncStatus.IDLE,
  material_error: null,
};

const siteSlice = createSlice({
  name: "site",
  initialState,
  reducers: {
    resetSiteCreateStatus: (state) => {
      state.create_status = asyncStatus.IDLE;
      state.create_error = null;
    },
    resetSiteUpdateStatus: (state) => {
      state.update_status = asyncStatus.IDLE;
      state.update_error = null;
    },
    resetSiteExpenseStatus: (state) => {
      state.expense_status = asyncStatus.IDLE;
      state.expense_error = null;
    },
    resetSiteMaterialStatus: (state) => {
      state.material_status = asyncStatus.IDLE;
      state.material_error = null;
    },
    clearSelectedSite: (state) => {
      state.selectedSite = null;
      state.summary = null;
      state.expenses = [];
      state.expensesPagination = initialPagination;
      state.materials = [];
      state.materialsPagination = initialPagination;
      state.detail_status = asyncStatus.IDLE;
      state.detail_error = null;
    },
  },
  extraReducers: (builder) => {
    // ── LIST ──
    builder
      .addCase(getSitesAsync.pending, (state) => {
        state.get_status = asyncStatus.LOADING;
        state.get_error = null;
      })
      .addCase(getSitesAsync.fulfilled, (state, { payload }) => {
        state.get_status = asyncStatus.SUCCEEDED;
        state.sites = payload?.data || [];
        state.pagination = payload?.pagination || initialPagination;
      })
      .addCase(getSitesAsync.rejected, (state, { payload }) => {
        state.get_status = asyncStatus.ERROR;
        state.get_error = payload;
      });

    // ── DROPDOWN LIST ──
    builder
      .addCase(getSitesListAsync.pending, (state) => {
        state.sitesList_status = asyncStatus.LOADING;
      })
      .addCase(getSitesListAsync.fulfilled, (state, { payload }) => {
        state.sitesList_status = asyncStatus.SUCCEEDED;
        state.sitesList = payload?.data || [];
      })
      .addCase(getSitesListAsync.rejected, (state) => {
        state.sitesList_status = asyncStatus.ERROR;
      });

    // ── SINGLE ──
    builder
      .addCase(getSingleSiteAsync.pending, (state) => {
        state.detail_status = asyncStatus.LOADING;
        state.detail_error = null;
      })
      .addCase(getSingleSiteAsync.fulfilled, (state, { payload }) => {
        state.detail_status = asyncStatus.SUCCEEDED;
        const d = payload?.data || {};
        state.selectedSite = d.site || null;
        state.summary = d.summary || null;
        state.expenses = d.expenses || [];
        state.expensesPagination = d.expensesPagination || initialPagination;
        state.materials = d.materials || [];
        state.materialsPagination = d.materialsPagination || initialPagination;
      })
      .addCase(getSingleSiteAsync.rejected, (state, { payload }) => {
        state.detail_status = asyncStatus.ERROR;
        state.detail_error = payload;
      });

    // ── CREATE SITE ──
    builder
      .addCase(createSiteAsync.pending, (state) => {
        state.create_status = asyncStatus.LOADING;
        state.create_error = null;
      })
      .addCase(createSiteAsync.fulfilled, (state) => {
        state.create_status = asyncStatus.SUCCEEDED;
      })
      .addCase(createSiteAsync.rejected, (state, { payload }) => {
        state.create_status = asyncStatus.ERROR;
        state.create_error = payload;
      });

    // ── UPDATE SITE ──
    builder
      .addCase(updateSiteAsync.pending, (state) => {
        state.update_status = asyncStatus.LOADING;
        state.update_error = null;
      })
      .addCase(updateSiteAsync.fulfilled, (state, { payload }) => {
        state.update_status = asyncStatus.SUCCEEDED;
        const updated = payload?.data;
        if (updated) {
          const idx = state.sites.findIndex((s) => s._id === updated._id);
          if (idx !== -1) state.sites[idx] = updated;
          if (state.selectedSite?._id === updated._id) state.selectedSite = updated;
        }
      })
      .addCase(updateSiteAsync.rejected, (state, { payload }) => {
        state.update_status = asyncStatus.ERROR;
        state.update_error = payload;
      });

    // ── DELETE SITE ──
    builder
      .addCase(deleteSiteAsync.pending, (state) => {
        state.delete_status = asyncStatus.LOADING;
        state.delete_error = null;
      })
      .addCase(deleteSiteAsync.fulfilled, (state, { payload }) => {
        state.delete_status = asyncStatus.SUCCEEDED;
        state.sites = state.sites.filter((s) => s._id !== payload.id);
      })
      .addCase(deleteSiteAsync.rejected, (state, { payload }) => {
        state.delete_status = asyncStatus.ERROR;
        state.delete_error = payload;
      });

    // ── EXPENSE CRUD (list is re-fetched via getSingleSiteAsync by the component) ──
    const expensePending = (state) => {
      state.expense_status = asyncStatus.LOADING;
      state.expense_error = null;
    };
    const expenseFulfilled = (state) => {
      state.expense_status = asyncStatus.SUCCEEDED;
    };
    const expenseRejected = (state, { payload }) => {
      state.expense_status = asyncStatus.ERROR;
      state.expense_error = payload;
    };
    builder
      .addCase(createSiteExpenseAsync.pending, expensePending)
      .addCase(createSiteExpenseAsync.fulfilled, expenseFulfilled)
      .addCase(createSiteExpenseAsync.rejected, expenseRejected)
      .addCase(updateSiteExpenseAsync.pending, expensePending)
      .addCase(updateSiteExpenseAsync.fulfilled, expenseFulfilled)
      .addCase(updateSiteExpenseAsync.rejected, expenseRejected)
      .addCase(deleteSiteExpenseAsync.pending, expensePending)
      .addCase(deleteSiteExpenseAsync.fulfilled, expenseFulfilled)
      .addCase(deleteSiteExpenseAsync.rejected, expenseRejected);

    // ── MATERIAL CRUD (list is re-fetched via getSingleSiteAsync by the component) ──
    const materialPending = (state) => {
      state.material_status = asyncStatus.LOADING;
      state.material_error = null;
    };
    const materialFulfilled = (state) => {
      state.material_status = asyncStatus.SUCCEEDED;
    };
    const materialRejected = (state, { payload }) => {
      state.material_status = asyncStatus.ERROR;
      state.material_error = payload;
    };
    builder
      .addCase(createSiteMaterialAsync.pending, materialPending)
      .addCase(createSiteMaterialAsync.fulfilled, materialFulfilled)
      .addCase(createSiteMaterialAsync.rejected, materialRejected)
      .addCase(updateSiteMaterialAsync.pending, materialPending)
      .addCase(updateSiteMaterialAsync.fulfilled, materialFulfilled)
      .addCase(updateSiteMaterialAsync.rejected, materialRejected)
      .addCase(deleteSiteMaterialAsync.pending, materialPending)
      .addCase(deleteSiteMaterialAsync.fulfilled, materialFulfilled)
      .addCase(deleteSiteMaterialAsync.rejected, materialRejected);
  },
});

export const {
  resetSiteCreateStatus,
  resetSiteUpdateStatus,
  resetSiteExpenseStatus,
  resetSiteMaterialStatus,
  clearSelectedSite,
} = siteSlice.actions;
export default siteSlice.reducer;