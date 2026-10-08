import React, { forwardRef } from "react";
import dayjs from "dayjs";
import companyLogo from "../../../public/haroon-marbles-logo.png";
import employerSignature from "/public/signature.png";
import { STATUS_LABEL_EN, CAUSED_BY_LABEL_EN, daysTextEn } from "./workOrderConstants.js";
import "../report-sheet.css";

/**
 * Printable / PDF Work Report — client (non-technical) ko proof ke taur par dikhani hai,
 * is liye saada English aur sirf zaroori cheezein:
 *   1. kaam kab shuru / khatam hua, kitne din laga, kitne din site par kaam hua
 *   2. client ki wajah se kitne din ka delay (sirf agar hua)
 *   3. problems — date, kya hua, kis ki wajah se, kab theek hui, kitne din gaye + photos
 *   4. client ki maangi hui tabdeeliyan (reject ki wajah)
 *   5. roz ka record (date + kya kaam hua)
 * "Round" ka lafz client ko nahi dikhta — sab rounds ek hi list mein.
 * Har photo `data-pdf-link` ke sath hai — PDF mein tap karne se poori photo khulti hai.
 */
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const WorkReportSheet = forwardRef(({ workOrder, rounds = [], stats }, ref) => {
  const siteName = workOrder?.siteId?.name || "—";
  const issues = rounds.flatMap((r) => r.issues || []);
  const changeRequests = rounds.filter((r) => r.responseStatus === "rejected" && r.rejectionNotes);
  const dailyRecord = rounds.flatMap((r) =>
    (r.dailyLog || []).map((day) => ({
      ...day,
      text:
        day.note ||
        (day.isStartDay ? (r.roundNumber > 1 ? "Work restarted with client's changes" : "Work started") : "Work done"),
    })),
  );
  const clientDelay = stats?.clientCausedDelayDays || 0;
  const hasPhotos = issues.some((i) => i.images?.length);

  const summary = [
    { label: "Work started", value: stats?.workStartDate || "—" },
    { label: "Work finished", value: stats?.workCompletedDate || "Still in progress" },
    { label: "Total time", value: daysTextEn(stats?.totalDurationDays) },
    { label: "Days worked on site", value: stats?.loggedWorkDays || 0 },
  ];

  return (
    <div className="rpt-sheet" ref={ref}>
      <div className="rpt-header">
        <img src={companyLogo} alt="Haroon Marbles" className="rpt-logo" />
      </div>
      <div className="rpt-divider" />

      <div className="rpt-doc-title">Work Report</div>

      <div className="rpt-meta-grid">
        <div>
          <div className="rpt-meta-label">Work</div>
          <div className="rpt-meta-value">{workOrder?.title || "—"}</div>
        </div>
        <div>
          <div className="rpt-meta-label">Site</div>
          <div className="rpt-meta-value">{siteName}</div>
        </div>
        <div>
          <div className="rpt-meta-label">Client</div>
          <div className="rpt-meta-value">{workOrder?.clientName || "—"}</div>
        </div>
        <div>
          <div className="rpt-meta-label">Status</div>
          <div className="rpt-meta-value">{STATUS_LABEL_EN[workOrder?.status] || "—"}</div>
        </div>
      </div>

      <div className="rpt-summary-grid">
        {summary.map((s) => (
          <div className="rpt-summary-card" key={s.label}>
            <div className="rpt-summary-label">{s.label}</div>
            <div className="rpt-summary-value">{s.value}</div>
          </div>
        ))}
      </div>

      {clientDelay > 0 && (
        <div className="rpt-alert">
          Work was delayed by <strong>{plural(clientDelay, "day")}</strong> because of the client.
          <div className="rpt-alert-sub">Details are in the problems list below.</div>
        </div>
      )}

      {rounds.length === 0 && <div className="rpt-empty">Work has not started yet.</div>}

      {/* ---- 1. Problems ---- */}
      {issues.length > 0 && (
        <div className="rpt-block">
          <div className="rpt-section-title">Problems during the work</div>
          <table className="rpt-table rpt-table--stack">
            <thead>
              <tr>
                <th style={{ width: "14%" }}>Date</th>
                <th>What happened</th>
                <th style={{ width: "14%" }}>Because of</th>
                <th style={{ width: "14%" }}>Fixed on</th>
                <th style={{ width: "12%" }}>Days lost</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id}>
                  <td data-label="Date">{issue.issueDate}</td>
                  <td data-label="What happened" className="rpt-cell-problem">
                    {issue.description}
                    {issue.resolutionNote && <div className="rpt-issue-note">Fixed by: {issue.resolutionNote}</div>}
                    {issue.images?.length > 0 && (
                      <div className="rpt-issue-photos">
                        {issue.images.map((img, index) => (
                          <a
                            key={img._id}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-pdf-link={img.url}
                            title={`Open photo ${index + 1}`}
                          >
                            <img src={img.url} alt={`Problem photo ${index + 1}`} crossOrigin="anonymous" />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-label="Because of" className={issue.causedBy === "client" ? "rpt-cell-client" : ""}>
                    {CAUSED_BY_LABEL_EN[issue.causedBy] || "Other"}
                  </td>
                  <td data-label="Fixed on">
                    {issue.isResolved ? issue.resolvedDate : <span className="rpt-tag rpt-tag--rejected">Not fixed yet</span>}
                  </td>
                  <td data-label="Days lost">{issue.delayDays ? plural(issue.delayDays, "day") : "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasPhotos && <div className="rpt-photo-hint">Tap on any photo to see it in full size.</div>}
        </div>
      )}

      {/* ---- 2. Client ki maangi hui tabdeeliyan ---- */}
      {changeRequests.length > 0 && (
        <div className="rpt-block">
          <div className="rpt-section-title">Changes asked by the client</div>
          {changeRequests.map((r) => (
            <div className="rpt-note rpt-note--reject" key={r._id}>
              <strong>{r.clientResponseDate}:</strong> {r.rejectionNotes}
            </div>
          ))}
        </div>
      )}

      {/* ---- 3. Roz ka record ---- */}
      {dailyRecord.length > 0 && (
        <div className="rpt-block">
          <div className="rpt-section-title">Daily work record</div>
          <table className="rpt-table rpt-table--stack">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>Date</th>
                <th>Work done</th>
              </tr>
            </thead>
            <tbody>
              {dailyRecord.map((day) => (
                <tr key={day._id}>
                  <td data-label="Date">{day.date}</td>
                  <td data-label="Work done">{day.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rpt-signatures">
        <div className="rpt-signature-block">
          <img src={employerSignature} alt="Authorized signature" className="rpt-signature-image" />
          <div className="rpt-signature-line" />
          <div className="rpt-signature-label">Authorized Signature</div>
        </div>
      </div>

      <div className="rpt-footer-note">
        This is a computer-generated report — Haroon Marbles · {dayjs().format("DD/MM/YYYY")}
      </div>
    </div>
  );
});

WorkReportSheet.displayName = "WorkReportSheet";

export default WorkReportSheet;
