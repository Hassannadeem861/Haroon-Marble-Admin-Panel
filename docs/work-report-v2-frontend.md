# Work Report v2 — Frontend Changes (Roman Urdu)

> **Status: IMPLEMENT HO CHUKA HAI (2026-10-07).** Code: `src/pages/work-order/` (Drawer, IssueFormModal, StepModals,
> WorkReportSheet, workOrderConstants, WorkOrderTimeline.css), `src/utils/compressImage.js`,
> `src/store/services/workOrderService.js` (FormData thunks). Photos Cloudinary ke poore https URL hain —
> `getImageUrl` helper ki zaroorat nahi padi. Naya kaam isi structure mein karo.

> **AI agent / Copilot ke liye:** Ye document batata hai frontend mein KYA badalna hai, code nahi deta.
> Stack: React 19 + Vite + Ant Design 6 + Redux Toolkit + axios (`src/utils/apiHandle.js`) + dayjs + html2canvas/jsPDF.
> Backend ka matching document: `D:\hassan2\Haroon-Marble-Admin-Panel-Backend\docs\work-report-v2-backend.md`
> (endpoints, fields aur status values wahan se confirm karo — andaza mat lagao).

---

## 0. Abhi kya hai (current code)

| Cheez | File |
|---|---|
| Work Report list + Add/Edit modal + View drawer + PDF sheet (sab ek file mein, 614 lines) | `src/pages/workOrderManagment.jsx` |
| API calls (work order + sample round) | `src/store/services/workOrderService.js` |
| Redux state (`selectedWorkOrder`, `rounds`, `stats`) | `src/store/slices/workOrderSlice.js` |
| PDF banane wala hook (html2canvas, `useCORS: true` pehle se hai) | `src/utils/usePdfDowload.js` |
| Axios instance (default header `Content-Type: application/json`, timeout 15s) | `src/utils/apiHandle.js` |
| Action type names | `src/utils/constant.js` |

Abhi flow: Title + Site → View → "Add Work Report" (Start / Ready / Sent-to-client dates) → table mein "Record response" (date, Approved/Rejected, notes) → PDF.

## 1. Naya flow — user (non-technical) ki nazar se

Drawer (View) kholte hi user ko **ek timeline/stepper** dikhe, tables aur chhupe hue buttons nahi.
**Sirf "agla qadam" wala bara button** nazar aaye — user ko sochna na pare ab kya karna hai.

```
 ① Work Report bana        ✔  (Title, Site, Client)
 ② Kaam Shuru              [ Kaam Shuru Karein ]        <- agar abhi shuru nahi hua
 ③ Problems                [ + Problem Report Karein ]  <- kaam jari ho to hamesha nazar aaye (baar baar)
       • 12/08 — "Client ne tiles late di" (Client ki wajah se) 📷3   [ Hal ho gayi ]
       • 15/08 — ... ✔ Hal: 17/08 (2 din)
 ④ Kaam Mukammal           [ Kaam Mukammal Ho Gaya ]
 ⑤ Client ka Jawab         [ Approved ✔ ]  [ Reject ✖ ]
       Reject hua? -> [ Dobara Kaam Shuru (Rework) ]  -> naya Round, phir ② se
```

### UX suggestions (non-technical clients ke liye)
1. **Date hamesha aaj ki default** ho — user sirf zaroorat par badle.
2. **Problem ki wajah ke ready-made chips** (tap karo to text mein aa jaye, edit bhi ho sake):
   "Client ne material late diya", "Site tayyar nahi thi", "Design change hua", "Payment ruki", "Bijli/pani nahi tha", "Mausam".
3. **"Kis ki wajah se?"** — bare radio buttons: Client / Hamari taraf se / Material / Mausam / Other.
   (Backend values: `client`, `company`, `material`, `weather`, `other`.) Yahi field client ko proof deti hai ke delay kis ka tha.
4. **Photo**: ek bara "📷 Photo lein / Gallery" button. `accept="image/*"` rakho (mobile par camera + gallery dono ka option aata hai).
   `capture` attribute mat lagao — wo gallery band kar deta hai. Max 5 photos, har photo ka chhota preview + ✖ hatane ka button.
5. **"Hal ho gayi"** ek tap: chhota modal — hal hone ki date (default aaj) + optional note.
6. **Reject** karte waqt confirm + "Reject ki wajah" **required**.
7. Status ke rang aur saaf Urdu/English labels (§4). Open problem ho to list aur drawer mein **"⚠ Problem jari"** badge.
8. Mobile pehle (worker/admin site par phone se use karega) — buttons full-width, bare tap targets.
9. Upload ke dauran progress / "Photos upload ho rahi hain…" aur button disable (double submit na ho).

### Pehla step (Work Report banana) — suggestion
Title + Site sahi hai. Sirf **"Client ka naam"** (optional) add karo — Site select karte hi Site ka `ownerName` khud bhar do (user badal sake).
Edit modal mein **Status dropdown hatao**; status ab automatic hai. Sirf ek "Cancel Work Report" option rakho (backend sirf `cancelled` manual allow karega).

---

## 2. API changes (`src/store/services/workOrderService.js`)

| Thunk | Endpoint | Body type |
|---|---|---|
| (existing) `createSampleRoundAsync` | `POST /create-sample-round` | JSON — ab "Kaam Shuru" ke liye: `workOrderId`, `sampleStartDate`, `description` |
| (existing) `updateSampleRoundAsync` | `PUT /update-sample-round/:id` | JSON — "Kaam Mukammal" (`sampleReadyDate`) aur "Client jawab" (`clientResponseDate`, `responseStatus`, `rejectionNotes`) |
| **naya** `createSiteIssueAsync` | `POST /create-site-issue` | **FormData** |
| **naya** `updateSiteIssueAsync` | `PUT /update-site-issue/:issueId` | **FormData** (resolve bhi isi se: `resolvedDate`, `resolutionNote`) |
| **naya** `deleteSiteIssueAsync` | `DELETE /delete-site-issue/:issueId` | — |

Issues ka alag GET nahi — `getSingleWorkOrderAsync` ke response mein `data.rounds[].issues[]` aur naye `data.stats` aayenge.

### ⚠️ FormData ke 3 zaroori rules (warna files chup-chaap gum ho jayengi)
1. `apiHandle` ka default header `application/json` hai. Axios ka rule: agar header JSON ho aur body FormData, to axios **FormData ko JSON bana deta hai aur files gayab**.
   Is liye upload wali request par header `Content-Type: multipart/form-data` **per-request** do (axios khud boundary laga dega). Global default mat badlo.
2. Files ka field name exactly **`images`** — har file ke liye `images` hi append karo (backend `.array("images", 5)`).
3. Upload request ka `timeout` barhao (e.g. 60 sec) — mobile data par 15 sec kam hai.
Dates FormData mein bhi `DD/MM/YYYY` string. Image hatani ho to `removeImageIds` (image `_id` list).

### Constants fix (`src/utils/constant.js`)
`CREATE_SAMPLE_ROUND` aur `UPDATE_SAMPLE_ROUND` constants file mein **hain hi nahi** — dono thunks ka type `undefined` ban raha hai (aapas mein takrate hain).
Ye add karo + naye: `CREATE_SITE_ISSUE`, `UPDATE_SITE_ISSUE`, `DELETE_SITE_ISSUE` (pattern `"workOrder/..."`).

### Slice (`src/store/slices/workOrderSlice.js`)
Naya top-level state zaroori nahi — jaise abhi round ke baad `getSingleWorkOrderAsync` dobara call hota hai, issue create/update/delete ke baad bhi wahi karo.
Sirf `upload_status` (loading) chahiye taake button disable/progress dikhe.

---

## 3. Components — file ko tod do (614 lines bohot hai)

Suggested (naye files `src/pages/work-order/` folder mein, jaise `factory-work/` folder hai):

| Component | Kaam |
|---|---|
| `WorkOrderManagement` (list page) | Abhi wala list + Add/Edit modal (status dropdown hata ke, client name add) |
| `WorkOrderDrawer` | Stepper/timeline (§1), "agla qadam" logic |
| `RoundStepper` | Ek round ke steps: Shuru → Problems → Mukammal → Client jawab |
| `IssueFormModal` | Problem add/edit: date, wajah (+ chips), kis ki wajah se, photos (add/hatao) |
| `ResolveIssueModal` | Hal hone ki date + note |
| `ClientResponseModal` | Abhi wala "Record response" modal (reject par notes required) |
| `ImageGallery` | Thumbnails + click par bari image (antd `Image.PreviewGroup`) |
| `WorkReportSheet` | Sirf PDF/print wali sheet (§6) |

### "Agla qadam" logic (aakhri round dekh kar)
| Haalat | Dikhao |
|---|---|
| Koi round nahi | "Kaam Shuru Karein" |
| Round start, mukammal nahi | "+ Problem Report Karein" aur "Kaam Mukammal Ho Gaya" |
| Mukammal, response `pending` | "Client ka Jawab" (Approve / Reject) |
| `rejected` | "Dobara Kaam Shuru (Rework)" |
| `approved` | Sirf "Download PDF" — sab kuch read-only |
| Status `cancelled` | Sab read-only |
Purane rounds collapse ho kar history mein dikhen ("Round #1 — Rejected (wajah…)").

---

## 4. Status labels (DB value same, sirf label naya)

| DB value | Label | Rang |
|---|---|---|
| `pending_sample` | Shuru nahi hua | grey |
| `in_progress` | Kaam jari hai | blue |
| `in_review` | Client ke jawab ka intezar | orange |
| `rework_required` (naya) | Dobara kaam chahiye | red |
| `approved` | Approved ✓ | green |
| `completed` | Mukammal (purane records) | green |
| `cancelled` | Cancelled | dark grey |

`STATUS_OPTIONS` / `STATUS_COLOR` (page ke upar) update karo. List ka status filter isi list se chalega.
Round `responseStatus`: `pending` = "Intezar", `approved` = "Approved", `rejected` = "Rejected".

---

## 5. Photo upload — frontend ka kaam

1. **Upload se pehle browser mein compress karo (zaroori).** Backend Vercel par hai jahan poori request ~4.5MB se bari nahi ho sakti, aur 5 mobile photos (3–5MB har ek) seedha bhejna fail hoga + mobile data zaya.
   Har photo ko canvas se ~1600px width aur JPEG/WebP quality ~0.8 tak chhota karo (~300–500KB). Naya package mat lao jab tak owner na kahe — canvas se ho jata hai.
   Final 50KB WebP compression backend karega; ye sirf "bhejne layak" size banane ke liye hai.
2. Sirf `image/jpeg`, `image/png`, `image/webp` allow. iPhone HEIC: canvas compress ke baad JPEG ban jati hai — compress step ye bhi hal karta hai.
3. antd `Upload` use karo to `beforeUpload` mein false return karo (auto-upload band) — files form ke sath ek hi "Save" par jayengi.
4. Max 5 (purani + nayi mila kar). Edit mein purani photos dikhao; ✖ dabane par us ka `_id` `removeImageIds` mein jaye.
5. Backend ke error messages (`message`) seedha toast mein dikhao (wo Roman Urdu/simple hain).

### Image URL banana
- Cloudinary driver par `url` poora https link hoga — seedha use karo.
- Local driver par `url` `/uploads/images/...` (relative) hoga. Base: `VITE_SERVER_URL` ka **origin** (us mein `/api/v1` hai — usko hatana hai).
- Ek helper `getImageUrl(url)` banao: `http` se shuru ho to waisa hi, warna origin + path. Har jagah yahi helper.

---

## 6. Report / Slip (PDF) ka naya design

`WorkReportSheet` (A4, abhi wali `rpt-*` classes aur `report-sheet.css` style reuse karo):

1. **Header**: logo (jaise abhi)
2. **Work info grid**: Work Title · Site · Client · Status · Report date
3. **Summary cards** (backend `stats` se):
   Kaam Shuru Date · Kaam Mukammal Date · Kul Din (`totalDurationDays`) · Rounds (`totalRounds`, rejected `rejectedCount`) ·
   Kul Problems (`totalIssues`, open `openIssues`) · Problems ki wajah se Delay (`totalIssueDelayDays`, "approx") ·
   **Client ki wajah se Delay (`clientCausedDelayDays`)** ← sabse numaya (highlight) — yahi client ke liye proof hai
4. **Har Round ka section**: "Round #1" — Shuru / Mukammal / Client jawab date / Result (Approved/Rejected + wajah)
5. **Problems table/cards (us round ke andar)**: Date · Wajah · Kis ki wajah se · Hal hone ki date · Din · photos ke chhote thumbnails (har problem ke max 3 PDF mein, row mein 3; "+2 more" likh do)
6. **Client response box**: Approved/Rejected, date, notes
7. **Signature** (jaise abhi) + footer "computer-generated report"

### PDF mein photos sahi aayein — zaroori
- Har `<img>` par `crossOrigin="anonymous"` (warna canvas tainted → PDF mein blank image).
- `usePdfDowload.js` mein `useCORS: true` pehle se hai — rehne do.
- PDF banane se pehle **saari images load hone ka intezar** karo (har img ka `decode()` / load complete). Warna aadhi photos khali aayengi.
- Thumbnails CSS se chhote (fixed height, `object-fit: cover`).
- `.rpt-no-print` class buttons par lagao (Add/Resolve/Edit) taake PDF mein na aayein — hook ye pehle se chhupata hai.

---

## 7. Kya NAHI karna
- Global `apiHandle` header badalna, ya FormData request bina multipart header ke.
- Field name `images` ke ilawa kuch aur.
- Status dropdown se manual status set karna (sirf Cancel).
- Image URL mein backend domain hard-code karna — hamesha `getImageUrl` + env.
- `capture` attribute (gallery band ho jati hai).
- `dayjs` ke ilawa koi aur date library; date hamesha `format("DD/MM/YYYY")` bhejo.

## 8. Kaam ki tarteeb
1. Constants fix + naye thunks (FormData rules ke sath)
2. Status labels/colors update; Edit modal se status hatao, client name add
3. Drawer ko stepper mein badlo + "agla qadam" logic
4. `IssueFormModal` (compress + preview + hatana) → `ResolveIssueModal`
5. `WorkReportSheet` naya design + image load wait + `crossOrigin`
6. Testing

## 9. Testing checklist
- [ ] Naya Work Report: site chunte hi client naam bhar gaya
- [ ] Kaam Shuru → status "Kaam jari hai"
- [ ] Mobile se 3 photos ke sath problem add → thumbnails dikhe, photos seedhi (ghoomi hui nahi)
- [ ] 6th photo add nahi hoti; galat file (pdf) par saaf message
- [ ] Network slow (DevTools "Slow 4G") par upload — progress dikha, double submit nahi hua
- [ ] Problem "Hal ho gayi" → din sahi gine gaye; badge "⚠ Problem jari" hat gaya jab saari hal hui
- [ ] Edit mein 1 photo hatai aur 1 nayi lagai → sahi save
- [ ] Kaam Mukammal → Client Reject (bina wajah ke nahi hota) → "Dobara kaam chahiye" → Rework → Round #2
- [ ] Approve → sab read-only, sirf PDF
- [ ] PDF mein photos nazar aa rahi hain (blank nahi), page beech mein row nahi kati
- [ ] Phone (360px width) par sab buttons aur stepper theek
