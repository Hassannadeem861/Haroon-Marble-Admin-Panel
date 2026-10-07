# CLAUDE.md — Haroon Marble Admin Panel (frontend)

This repository is **only the frontend**: a React 19 + Vite admin panel for a marble and construction business (workers, daily attendance and pay, sites, site expenses and materials, factory orders, work reports, salary slips). The backend is a separate REST API reached through `VITE_SERVER_URL`.

This file has two parts:
- **Part A** describes the architecture as it actually is, and tells you how to work inside it.
- **Part B** is an audit register of known problems, each classified KEEP / CHANGE / REMOVE / DO NOT REPEAT / FUTURE IMPROVEMENT.

Read Part B before you "fix" something you notice. It may already be a known issue with a known scope.

---

## Part A — How this frontend works

### Commands

```bash
npm run dev       # Vite dev server
npm run build     # production build -> dist/ (gitignored)
npm run lint      # oxlint (.oxlintrc.json); currently 0 errors, ~60 warnings
npm run preview
```

- There are **no tests** and **no TypeScript** (plain `.js` / `.jsx`; `@types/*` are installed only for editor hints).
- Deployment is on Vercel. `vercel.json` rewrites every path to `index.html` (SPA).
- Environment: the only variable is `VITE_SERVER_URL` (in `.env`). It is baked into the client bundle, so never put secrets in `VITE_*` variables.

### Stack (as actually used)

| Concern | Library | Notes |
|---|---|---|
| UI components | **antd 6** (`Table`, `Form`, `Modal`, `Drawer`, `Select`, `DatePicker`, `Tag`, `Popconfirm`, `Spin`, `Empty`, `Alert`) | Theme set once in `App.jsx` `ConfigProvider` (`colorPrimary: #386CFF`). |
| Icons | `@ant-design/icons` in CRUD pages; `lucide-react` in layout, dashboard, login, profile, StatCard | Follow whatever the file you are editing already uses. |
| State | Redux Toolkit (`createSlice`, `createAsyncThunk`) + `react-redux` + `redux-persist` | `@reduxjs/toolkit` is **not** in `package.json`; it is only installed transitively (see C12). |
| HTTP | axios, one instance `apiHandle` | `src/utils/apiHandle.js` |
| Routing | `react-router-dom` v7, `BrowserRouter` + `<Routes>` | No data routers or loaders. |
| Dates | `dayjs` (comes with antd, undeclared) | See "Date formats" below; there are two conventions. |
| Notifications | `react-hot-toast` (`<Toaster>` in `App.jsx`) | Used for global 401s, PDF errors, Factory Work and Bulk Daily Work. |
| PDF | `html2canvas` + `jspdf` via `usePdfDownload` | `src/utils/usePdfDowload.js` (the filename typo is real; keep the import path). |
| Styling | One plain CSS file per page with a class prefix | Tailwind is imported but **not functional** (see C14). Do not write Tailwind classes. |

Declared but **unused**: `formik`, `yup` (only by the dead `validationSchema.js`), `recharts`, `tailwindcss`.

### Folder structure

```
src/
  main.jsx                 Provider(store) > PersistGate > App
  App.jsx                  Toaster, antd ConfigProvider theme, all <Route> definitions
  index.css                global reset + scrollbar (+ broken tailwind import)
  layouts/
    AdminLayout.jsx/.css   sidebar + header shell, NAV_SECTIONS, role filter, logout modal
                           AdminLayout.css also defines the shared .ag-* modal/button classes
  routes/
    ProtectedRoute.jsx     redirects to /login if no user_auth/accessToken in Redux
    PublicRoutes.jsx       redirects to /dashboard if already logged in
  pages/                   one file per screen; large pages define their sub-components inline
    Login.jsx (+style.css)
    Dashboard.jsx
    AgentsManagement.jsx   route /users; component is named WorkerManagement; uses WorkerManagement.css
    DailyWorkManagement.jsx, BulkDailyWorkAdd.jsx
    SiteManagement.jsx     includes SiteDetailDrawer, ExpenseForm, MaterialForm
    workOrderManagment.jsx route /work-order (filename typo); includes WorkOrderDrawer (printable report)
    SalarySlip.jsx         printable slip
    AdminProfile.jsx       UI only, NOT wired to the API (see C20)
    factory-work/          FactoryWorkManagement.jsx (list), FactoryWorkDetail.jsx (/factory-work/:workId)
  components/              small shared pieces (only some are used; see R5)
    StatCard.jsx           used by Dashboard
    Loading.jsx            only FullPageLoader is used (by ProtectedRoute)
    Modal.jsx              only ConfirmModal is used (by AdminLayout)
    ScrollToTop.jsx
  store/
    store.js               combineReducers + persistReducer (whitelist: ["auth"])
    services/<domain>Service.js   createAsyncThunk API calls (NOT plain service functions)
    slices/<domain>Slice.js       state + extraReducers for those thunks
  utils/
    apiHandle.js           axios instance, auth header, 401 -> sessionExpired()
    asyncStatus.js         IDLE | LOADING | SUCCEEDED | ERROR
    constant.js            SAVE_TOKENS_CONSTANT, typeConstants (thunk type prefixes)
    toastError.js          getErrorMessage(err) — ignores antd validation errors
    usePdfDowload.js       usePdfDownload() hook
    helperFunctions.jsx    only getInitials is used
    validationSchema.js    dead code (see R2)
  context/, hooks/         dead mock-auth code (see R1). Auth lives in Redux, not Context.
```

### Domain to file map

| Route | Page | Redux key | Service file(s) | API path style |
|---|---|---|---|---|
| `/login` | `Login.jsx` | `auth` | `authService.js` | `/login`, `/logout` |
| `/dashboard` | `Dashboard.jsx` | `dashboard` | `dashboardService.js` | `/dashboard-summary` |
| `/users` | `AgentsManagement.jsx` | `employer` | `employerService.js` | `/get-all-employers`, `/create-employer`, `/update-employer/:id`, ... |
| `/daily-work`, `/daily-work/bulk-add` | `DailyWorkManagement.jsx`, `BulkDailyWorkAdd.jsx` | `dailyWork` | `dailyWorkService.js` | `/get-all-daily-work`, `/bulk-create-daily-work`, `/workers-list` |
| `/site` | `SiteManagement.jsx` | `site` | `siteService.js`, `siteExpenseService.js`, `siteMaterialService.js` | `/site/...`, `/site-expense/...`, `/site-material/...` |
| `/work-order` | `workOrderManagment.jsx` | `workOrder` (+ `site.sitesList`) | `workOrderService.js` | `/get-all-work-orders`, `/create-sample-round`, ... |
| `/factory-work`, `/factory-work/:workId` | `factory-work/*` | `factoryWork` | `factoryWorkService.js` | `/factory-work/...` |
| `/salary-slip` (+ unused `/:workerId`) | `SalarySlip.jsx` | `salarySlip` (+ `dailyWork.workersList`) | `salarySlipService.js` | `/salary-slip/:employerId` |
| `/profile` | `AdminProfile.jsx` | reads `auth.user_data` | none | none |

Backend naming: a "worker" in the UI is an **employer** in the API and Redux (`employerSlice`, `employerId`). Keep the API names; do not rename them.

### Authentication flow (actual)

1. `Login.jsx` dispatches `loginAsync({ email, password })` → `POST /login` → `{ message, user, token }`.
2. `authSlice` `loginAsync.fulfilled` stores `user_data`, `user_role`, `accessToken`, sets `user_auth = true`, and **also** writes the token to `localStorage['@ACCESS_TOKEN']`.
3. `redux-persist` persists the **whole** `auth` slice to `localStorage['persist:root']`. That means the token is stored twice, and statuses and errors are persisted too (see C10).
4. `apiHandle` request interceptor reads `localStorage['@ACCESS_TOKEN']` and sets `Authorization: Bearer <token>`.
5. On any **401**, `sessionExpired()` runs: `localStorage.clear()`, dispatch `logout()`, toast, then a hard redirect to `/login`. There is no refresh token by design.
6. On startup nothing validates the token with the server. `checkAuthAsync` is commented out, so `check_auth_status` never becomes `LOADING`.
7. Logout (sidebar) dispatches the **sync** `logout()` reducer and navigates. It never calls `POST /logout` (see C11).
8. Route protection is presence-only (`user_auth && accessToken`). Roles (`superAdmin`, `admin`) only filter sidebar items in `AdminLayout`; any unknown role falls back to the superAdmin list. **No route is role-guarded.** The backend must enforce authorization.

Do not add a second auth mechanism (Context, hooks, or another storage key). Extend `authSlice` / `authService`.

### Redux conventions (follow these exactly)

**Service file** (`src/store/services/<domain>Service.js`): one `createAsyncThunk` per endpoint.

```js
export const getThingsAsync = createAsyncThunk(
  typeConstants.GET_THINGS,                 // MUST exist in utils/constant.js
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiHandle.get("/thing/get-all-things", { params });
      return response.data;                 // return raw backend body
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to fetch things",
      );
    }
  },
);
```

- The argument shapes are `params` for lists, `id` for single/delete, and `{ id, ...payload }` for updates. Factory Work uses `{ workId, ...payload }`. Follow the domain you are in.
- Delete thunks return `{ ...response.data, id }` so the slice can filter by id.
- Rejections are always a **string**. UI code checks `typeof error === "string"`.
- New `typeConstants` should use the `"domain/action"` style (as site and workOrder do), not `UPPER_SNAKE`.
- Never call axios or fetch directly from components. Always go through `apiHandle` inside a thunk.

**Slice file** (`src/store/slices/<domain>Slice.js`):

- Statuses use `asyncStatus.*`, with one pair per operation: `get_status/get_error`, `detail_status/detail_error`, `create_status/...`, `update_status/...`, `delete_status/...`.
- List payloads: `state.<items> = payload?.data || []` and `state.pagination = payload?.pagination || initialPagination`. Factory Work's response shape differs (`factoryWorks`, `page`, `total`, `totalPages`).
- Update reducers patch the item in place inside the list (and in `selected*` if open). Delete reducers filter it out.
- Detail data lives in `selected<Thing>` plus related arrays, and is cleared by a `clearSelected<Thing>` reducer when the drawer closes.
- When many thunks share the same state transitions, use the `factoryWorkSlice` approach (an `actionCases.forEach` loop plus a helper such as `applyUpdatedWork`).
- Register the reducer in `store.js` `combineReducers`. **Do not add it to the persist whitelist.**

### Page anatomy (list/CRUD pages)

Users, Daily Work, Site, Work Order and Factory Work all share this skeleton. Copy it for new modules:

1. **Local UI state**: `page`, `pageSize`, filter values, `formOpen`, `editingRecord`, `submitting`, `deletingId`, `view<Thing>Id`, and `const [form] = Form.useForm()`.
2. **Data**: `buildParams(overrides)` (strips `undefined`) → `fetchList()` → `dispatch(getXAsync(params))`. A `useEffect` refetches on `page`, `pageSize` and select filters. Text search is debounced (400 ms, ref timer) or runs on Enter.
3. **Render order**: header (Title + subtitle + primary "Add" button) → error `Alert` (from `get_error`) → filters card → `<Spin spinning={loading}>` wrapping **both** a mobile card list (`.<prefix>-card-list`) **and** a desktop `Table` (`.<prefix>-table-wrap`). CSS media queries decide which one shows. Then a detail `Drawer`, then an add/edit `Modal` (`footer={null}`) containing an antd `Form`.
4. **Empty state**: `<Empty description="..."/>` in the card list when `items.length === 0 && !loading`, plus `Table locale.emptyText`.
5. **Delete**: `Popconfirm` → `handleDelete` → `.unwrap()` → `fetchList()`. The button shows a loading state when `deletingId === record._id`.
6. **Add/Edit**: one modal for both. `openEditModal` calls `form.setFieldsValue({...record, dateField: dayjs(str, fmt)})`, and submit maps dayjs back to a string.

**Mutation feedback: use the Factory Work pattern for new code** (`FactoryWorkManagement.jsx` `handleSubmit`):

```js
try {
  const values = await form.validateFields();
  setSubmitting(true);
  await dispatch(createThingAsync(payload)).unwrap();
  toast.success("Thing created successfully.");
  closeFormModal();
  fetchList();
} catch (err) {
  const message = getErrorMessage(err);   // returns null for antd validation errors
  if (message) toast.error(message);
} finally {
  setSubmitting(false);
}
```

Older pages swallow mutation errors in an empty `catch` (C4). Do not copy that.

### Forms and validation

- **All forms use antd `Form`** with inline `rules` (`required`, `type: "email"`). Formik and Yup are not used anywhere. Do not introduce them, and do not import from `utils/validationSchema.js` (it is dead code from other projects).
- The exceptions are `BulkDailyWorkAdd.jsx` (controlled `useState` rows with manual toast validation) and `AdminProfile.jsx` (hand-rolled `useState` validation). Do not use them as templates.
- Selecting a worker auto-fills `salary` from the worker's base salary (Daily Work and Bulk). Keep this behavior.

### Date formats — two conventions; do not unify them without the backend

| Domain | Wire format | Display |
|---|---|---|
| employer, dailyWork, site, siteExpense, siteMaterial, workOrder, salarySlip | **`"DD/MM/YYYY"` strings** (parse with `dayjs(str, "DD/MM/YYYY")`) | shown as-is |
| factoryWork (all dates) | **`"YYYY-MM-DD"`** sent; ISO received | `dayjs(d).format("DD MMM YYYY")` |
| `created_at` (everywhere) | ISO | `"DD MMM YYYY, hh:mm A"` |

Pickers use `format="DD/MM/YYYY"`, except in Factory Work, which uses `"DD MMM YYYY"`. "Leave blank and today's date is used" is a backend behavior, mentioned in tooltips.

### Money, labels, enums

- Money is shown as `Rs. 12,345` through a page-local `money()` / `rs()` helper (`Number(v).toLocaleString()`). Dashboard uses `Intl.NumberFormat("en-PK", { currency: "PKR" })` instead.
- Enum option lists (`ATTENDANCE_OPTIONS`, `WORK_STATUS_OPTIONS`, `WORK_UNDER_OPTIONS`, `DESIGNATION_OPTIONS`, `STATUS_OPTIONS`) are **defined locally in each page** and mirror the backend Mongoose enums: `mazdoor|qarigar`, `present|absent`, `pending|inprogress|completed`, `owner|partnerShip|client`, and so on. Values must match the backend exactly. Labels and tag colors currently drift between pages (D2).
- Copy mixes English with **Roman Urdu** (tooltips, empty states, toasts, step titles). This is intentional for the end users. Keep the existing copy, and match the surrounding language when you add text.

### Styling rules

- Each page imports its own CSS file and uses a **unique class prefix**: `al-` layout, `ag-` shared modal/buttons (in AdminLayout.css), `dash-`, `wm-` workers, `dw-` daily work, `bdw-` bulk, `sm-` site, `wo-` work order, `rpt-` printable report, `ssp-` salary slip, `fw-` factory, `ap-` profile, `login-`, `stat-`.
- Even so, all CSS is bundled globally. Pick a new unique prefix for a new page.
- CSS variables (`--navy #0C1036`, `--accent #386CFF`, `--border`, `--text-2`, `--danger-fg`, `--success-fg`, ...) are already defined on `:root`. **Reuse them; do not add another `:root` block** (D1).
- Printable areas: mark controls that must not print with `.rpt-no-print` / `.ssp-no-print`. `usePdfDownload` hides those classes during capture, and `@media print` rules live in `report-sheet.css` and `SalarySlip.css`.
- Responsive breakpoint is `768px` (AdminLayout `isMobile`, card list vs table).
- Tailwind classes do nothing (C14). Do not use them.

### Adding a new module — checklist

1. Add `typeConstants` entries in `utils/constant.js` (`"domain/action"` style), and confirm every key you reference exists.
2. Create `store/services/<domain>Service.js` (thunks) and `store/slices/<domain>Slice.js` (state).
3. Register the reducer in `store/store.js` (not persisted).
4. Create `pages/<Domain>Management.jsx` + `.css` following the page anatomy above.
5. In `App.jsx`, add `<Route path="/kebab-path" element={<ProtectedRoute><AdminLayout><Page/></AdminLayout></ProtectedRoute>} />`.
6. In `AdminLayout.jsx`, add a `NAV_SECTIONS` item, add its key to **both** `roleAccess.superAdmin` and `roleAccess.admin`, and if the path is hyphenated, add it to `routeKeyMap` in `normalizeRouteKey`, or the nav item will not highlight (C7).
7. Run `npm run lint` and `npm run build`.

### Rules for AI agents working here

- **Preserve the architecture**: thunk-in-services + slice pattern, single `apiHandle`, antd Form/Table/Modal/Drawer, page-local CSS prefixes, mobile cards + desktop table. Do not migrate to RTK Query, React Query, Formik, Tailwind, TypeScript, or a component library refactor unless the user explicitly asks.
- **Keep changes scoped.** These page files are large (500–1000 lines) and self-contained. Edit the relevant handler or component; do not reformat or reorganize the whole file.
- **Do not rename files or exports** with typos (`workOrderManagment.jsx`, `usePdfDowload.js`, `AgentsManagement.jsx` → `WorkerManagement`) as a side effect of another task. They are imported by those names.
- **Backend field names are the contract** (`employerId`, `currentSite`, `workUnder`, `partnerShip`, `siteId`, `factoryWork`, ...). Never "fix" their spelling in the frontend.
- Compare statuses with `asyncStatus.*`, not string literals (D6).
- If you touch code in a Part B CHANGE item, fix it the way the item describes. Do not fix unrelated Part B items without asking.

---

## Part B — Audit register (as of 2026-10-06)

Line numbers are approximate. Search by symbol name.

### KEEP — good patterns that must be preserved

- **K1 Thunk/slice separation per domain**: `store/services/*Service.js` holds `createAsyncThunk` calls, and `store/slices/*Slice.js` holds state. It is consistent across all 8 domains.
- **K2 `asyncStatus` enum + per-operation status/error fields.** It makes loading and error UI predictable.
- **K3 Single axios instance `apiHandle`** with a bearer interceptor, a 15 s timeout, and centralized 401 → `sessionExpired()`. The lazy `import()` inside `sessionExpired` deliberately avoids a store ↔ apiHandle circular import.
- **K4 `rejectWithValue(<string>)`** using the backend `message`. The UI can render errors without parsing them.
- **K5 Route wrapping**: `ProtectedRoute` / `PublicRoute` + `AdminLayout` per route in `App.jsx`. It is simple and explicit.
- **K6 List page anatomy** (see Part A): server-side pagination, `buildParams` stripping `undefined`, mobile cards + desktop `Table`, a `Popconfirm` delete with a per-row loading state, and one modal for add/edit.
- **K7 Delete thunks return `{ ...data, id }`, and update reducers patch in place.**
- **K8 `factoryWorkSlice` `actionCases` loop + `applyUpdatedWork`.** This is the right way to handle many similar thunks.
- **K9 `usePdfDownload` hook**: one shared implementation, with smart page breaks at blank rows and no-print class handling. It is used by SalarySlip and the Work Order report.
- **K10 antd theme tokens centralized** in the `App.jsx` `ConfigProvider`, and the global `<Toaster>` there too.
- **K11 `getErrorMessage`** (`utils/toastError.js`) correctly skips antd validation errors. The Factory Work toast pattern is the target pattern for mutations.
- **K12 Per-page CSS class prefixes** (they avoid most collisions in the global bundle).
- **K13 `vercel.json` SPA rewrite.**

### CHANGE — incorrect or broken behavior (fix when touching that area)

- **C1 `main.jsx`**: a stray `,` after `</Provider>` inside the fragment renders a literal comma text node in the DOM. `StrictMode` is imported but unused.
- **C2 `FactoryWorkManagement.jsx` `handleDelete`**: `catch {` with no binding, but the body references `err` → `ReferenceError`. A failed delete shows no toast and throws inside the catch block.
- **C3 `workOrderService.js`**: `typeConstants.CREATE_SAMPLE_ROUND` and `UPDATE_SAMPLE_ROUND` **do not exist** in `constant.js`, so both thunks get the type prefix `"undefined"`, and their pending/fulfilled/rejected action types collide. Add the constants.
- **C4 Silent mutation failures**:
  - Users, Daily Work and Site `handleSubmit` use an empty `catch` with the comment "surface via `error` selector", but the pages only render `get_error`, never `create_error`/`update_error`.
  - Site expense/material and Users/Daily Work/Site/Work Order deletes use `try/finally` or no try at all → **unhandled promise rejections**.
  - `workOrderManagment.jsx` `handleSubmit`, `handleAddRound` and `handleRespond` have no catch.
  - `FactoryWorkDetail.jsx` `runAction` and the movement/arrival handlers swallow errors.
  - Fix with the toast + `getErrorMessage` pattern.
- **C5 Users page filters**: the **Status** select updates state but is never sent to the API or applied (a dead filter). The **Designation** filter is applied client-side to the current page only, so the count and pagination disagree with what is visible.
- **C6 "Reset filters" does not refetch** when `page` is already 1 and only the search text changed (Users, Daily Work, Site, Factory). The effects do not depend on `search`. Work Order handles this correctly by calling `fetchList({...})` explicitly.
- **C7 `AdminLayout` `normalizeRouteKey`** has no `"work-order"` entry, so the "Work Report" nav item is never highlighted.
- **C8 `FactoryWorkDetail` `buildProgressSteps`**: step 5's `done` is `"checked"` or `"received"`, which is always truthy, so it always counts as done and the Steps `current` index is off.
- **C9 Dashboard** fetches only while `status === IDLE`. After the first load it never refetches during the session (stale numbers), and after an error there is no retry. `COLS_5_PER_ROW.xl = 24/5` (4.8) is not a valid antd span. The greeting reads `user_data.username`, while the layout reads `user_data.name`.
- **C10 Whole `auth` slice is persisted**, so `login_error` / `login_status` survive reloads (a stale error banner on `/login`), and the token is stored both in `persist:root` and in `@ACCESS_TOKEN`. Persist only `user_data`, `user_role`, `accessToken`, `user_auth` (nested persist config or blacklist), and keep one source of truth for the token.
- **C11 Logout never hits the server.** `logoutAsync` exists but is unused, and `logout_auth_status` is never `LOADING`, so the logout modal's loading state is dead. A `console.log` is left in `handleLogout`.
- **C12 Undeclared direct dependencies**: `@reduxjs/toolkit`, `@ant-design/icons` and `dayjs` are imported everywhere but only installed transitively. Add them to `package.json` `dependencies`.
- **C13 Importing from `/public`**: `SalarySlip.jsx` and `workOrderManagment.jsx` import `../../public/haroon-marbles-logo.png` and `/public/signature.png`. Vite anti-pattern: reference `/haroon-marbles-logo.png` and `/signature.png` as URLs (as `AdminLayout` does) or move the files to `src/assets/`.
- **C14 Tailwind is half-installed**: `@import "tailwindcss"` in `index.css` and `App.css` without `@tailwindcss/vite` ships raw preflight plus unprocessed `@tailwind utilities` (the build prints a CSS warning). The preflight resets can fight antd. Either wire the plugin or remove the imports and the dependency. No Tailwind classes are used today.
- **C15 antd v6 deprecated props** (confirmed in antd 6.3.7 source; they cause console warnings): `Modal`/`Drawer` `destroyOnClose` → `destroyOnHidden`, `Card` `bordered` → `variant`, `Alert` `message` → `title`, `Drawer` `width` → `size`.
- **C16 Status compared with string literals** (`=== "loading"`, `=== "error"`) in most pages instead of `asyncStatus.*`.
- **C17 Conflicting CSS variable**: `--border` is `#e2e8f0` in `AdminLayout.css` but `#E6E9F2` in nine page CSS files. Which one wins depends on bundle order.
- **C18 Factory Work search** dispatches an API call on every keystroke (no debounce, unlike Users and Site).
- **C19 `README.md`** is the unmodified Vite template.
- **C20 `AdminProfile.jsx` fakes success**: "Save Changes" and "Update Password" await a `setTimeout` and then show "updated successfully" without calling any API. Users will believe their password changed. The phone field defaults to a hard-coded `"123323232323"`. Wire it to real endpoints, or disable the forms with a "coming soon" note.
- **C21 `.env` is committed** and `.gitignore` does not list it. It currently holds only the public API URL, so the risk is low. Add `.env` to `.gitignore` before any secret ever lands there.
- **C22 Inconsistent enum presentation**: the `workUnder` tag colors differ between the Users drawer (`owner: default`, `client: success`) and Daily Work (`owner: success`, `client: warning`), and the label reads "Partner Ship" in one place and "Partnership" in another.

### REMOVE — dead code (no importers; confirmed by grep)

- **R1** `src/context/AuthContext.jsx` + `src/hooks/useAuth.js`: a mock `setTimeout` login that is never mounted. Real auth is Redux.
- **R2** `src/utils/validationSchema.js`: never imported; it contains schemas from unrelated projects (dating profile, vehicles, quiz).
- **R3** Unused dependencies: `formik`, `yup` (after R2), `recharts`, and `tailwindcss` (if C14 goes the "remove" way).
- **R4** `src/pages/Agents.css` (not imported). `src/App.css` contains only the duplicate tailwind import.
- **R5** Unused component code:
  - `components/FormField.jsx` (the whole file)
  - `components/SkeletonLoader.jsx` + `.css`
  - in `Loading.jsx`, everything except `FullPageLoader` (`FullPageLoader1`, `SkeletonRows`, `TableLoader`, `ButtonLoader`, `OverlayLoader`, `OrbitLoader`, `styles`)
  - in `Modal.jsx`, `Modal` and `DeleteConfirmModal`
- **R6** `utils/helperFunctions.jsx`: everything except `getInitials` (`Toast`, `UserToast`, `Avatar`, `formatTime`, `formatMsgTime`, `getAvatarBg`, `formatDate`, `formatCurrency`) plus 12 unused lucide imports. `AdminLayout` re-implements `getInitials` locally.
- **R7** Unused Redux surface:
  - `getSingleDailyWorkAsync`, `clearSalarySlip`, `reset*Status` actions (employer, dailyWork, site), `resetActionStatus`, `setLogoutStatus`, `setCheckAuthStatus`
  - the commented `checkAuthAsync` block
  - `SAVE_TOKENS_CONSTANT.REFRESH_TOKEN`, `USER_AUTH`, `GET_SALARY_SLIPS`, `GET_SINGLE_SALARY_SLIP`
  - `create_status`/`update_status` fields that no component reads (pages use local `submitting`)
  - Decide per item: delete it, or start using it.
- **R8** Debug leftovers: `console.log` in `AdminLayout.handleLogout` and `FactoryWorkManagement.openEditModal`, and commented `console.log`s in both route guards.
- **R9** Route `/salary-slip/:workerId`: `SalarySlip` never reads the param.
- **R10** `AdminLayout`: the empty "Platform" nav section, commented nav items, the unused `dropdownOpen`/`pageTitle` state, and about 8 unused icon imports. Other unused imports and vars are flagged by `npm run lint`.

### DO NOT REPEAT — patterns present in the code that new code must not copy

- **D1** Do not declare another `:root { --navy ... }` block in a new CSS file. Reuse the existing variables (10 files already redeclare them).
- **D2** Do not invent new labels or colors for an existing backend enum. Match an existing page (and see C22). Page-local option constants are the accepted pattern, but they must agree with each other.
- **D3** Do not use an empty `catch {}` around a mutation, and do not rely on `get_error` for mutation errors. Do not use `.unwrap()` without a catch.
- **D4** Do not use `setTimeout` to fake API success (AdminProfile).
- **D5** Do not import assets from `/public` through a module import.
- **D6** Do not use string-literal status checks. Use `asyncStatus.*`.
- **D7** Do not reference a `typeConstants` key without adding it (C3). Do not add `UPPER_SNAKE` type strings; use `"domain/action"`.
- **D8** Do not call axios or fetch outside a thunk, and do not create a second axios instance.
- **D9** Do not add Context-based or alternative auth state. Do not store tokens under new keys.
- **D10** Do not hard-code placeholder data (phone numbers, fallback names) that can be submitted.
- **D11** Do not add `// eslint-disable-next-line react-hooks/exhaustive-deps` to new effects unless the effect is intentionally keyed on a subset of deps. In that case, say why in the comment.
- **D12** Do not mix both icon libraries in one new file. CRUD pages use `@ant-design/icons`.
- **D13** Do not add more large inline `style={{...}}` blocks. Use the page CSS file.
- **D14** Do not add role checks only in the sidebar and treat that as security.

### FUTURE IMPROVEMENT — worthwhile, but only on explicit request (larger scope)

- **F1** Route-level code splitting (`React.lazy` per page). The build produces a single **2.1 MB** JS chunk, and antd, jspdf and html2canvas are all eager.
- **F2** A shared `utils/domain.js` (or similar) for enum option lists, tag colors, `money()`, `labelOf()` and `fmtDate()`. These are duplicated across 6+ pages.
- **F3** A `useServerList` hook (page, pageSize, filters, debounced search, fetch, reset). This logic is duplicated in 5 list pages and is the source of C6.
- **F4** Split the oversized pages (SiteManagement ~980 lines, AgentsManagement ~810, FactoryWorkDetail ~710) into a page plus drawer/form components under a feature folder (as `factory-work/` started to do).
- **F5** Validate the token on app boot (re-enable `checkAuthAsync`; `ProtectedRoute` already handles its `LOADING` state).
- **F6** Real role-based route guards, together with backend enforcement. Unknown roles should get **no** access instead of falling back to superAdmin.
- **F7** Dedupe concurrent 401s in `sessionExpired` (several toasts and redirects today). Prefer router navigation over a full `window.location` reload.
- **F8** Tests (none exist), at minimum slice reducer tests and one smoke test per page.
- **F9** Types (TypeScript or JSDoc) for API response shapes. The shapes are currently documented only in service-file comments.
- **F10** Token storage hardening (httpOnly cookie). This needs backend work; `localStorage` is XSS-exposed. The codebase currently has no `dangerouslySetInnerHTML` or `innerHTML` sinks; keep it that way.
- **F11** Enable `<StrictMode>`.
- **F12** Consistent copy language (English vs Roman Urdu), or a small i18n layer, if the product owner wants it.
