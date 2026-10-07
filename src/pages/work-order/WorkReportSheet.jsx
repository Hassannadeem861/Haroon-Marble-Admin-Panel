import React, { forwardRef } from "react";
import dayjs from "dayjs";
import companyLogo from "../../../public/haroon-marbles-logo.png";
import employerSignature from "/public/signature.png";
import { STATUS_LABEL_EN, RESPONSE_LABEL_EN, CAUSED_BY_LABEL_EN, daysTextEn, delayTextEn } from "./workOrderConstants.js";
import "../report-sheet.css";

/**
 * Printable / PDF Work Report — client ke sath share hoti hai, is liye aasan English.
 * Proof: work kab shuru/mukammal hua, kitni problems aayin, kitne din ruka,
 * aur kitna delay client ki wajah se tha.
 * Har photo `data-pdf-link` ke sath hai — PDF mein us par tap karne se poori photo khulti hai
 * (usePdfDownload link lagata hai). Screen par bhi photo click se naye tab mein khulti hai.
 */
const WorkReportSheet = forwardRef(({ workOrder, rounds = [], stats }, ref) => {
  const siteName = workOrder?.siteId?.name || "—";
  const hasPhotos = rounds.some((r) => r.issues?.some((i) => i.images?.length));

  const summary = [
    { label: "Work Started", value: stats?.workStartDate || "—" },
    { label: "Work Completed", value: stats?.workCompletedDate || "—" },
    { label: "Total Duration", value: daysTextEn(stats?.totalDurationDays) },
    { label: "Attempts / Reworks", value: `${stats?.totalRounds || 0} / ${stats?.rejectedCount || 0}` },
    {
      label: "Problems Reported",
      value: `${stats?.totalIssues || 0}${stats?.openIssues ? ` (${stats.openIssues} open)` : ""}`,
    },
    { label: "Delay from Problems (approx.)", value: delayTextEn(stats?.totalIssueDelayDays) },
  ];

  return (
    <div className="rpt-sheet" ref={ref}>
      <div className="rpt-header">
        <img src={companyLogo} alt="Haroon Marbles" className="rpt-logo" />
      </div>
      <div className="rpt-divider" />

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
        <div className="rpt-summary-card rpt-summary-card--danger">
          <div className="rpt-summary-label">Delay caused by Client</div>
          <div className="rpt-summary-value">{delayTextEn(stats?.clientCausedDelayDays)}</div>
        </div>
      </div>

      {rounds.length === 0 && <div className="rpt-empty">Work has not started yet.</div>}

      {rounds.map((round) => (
        <div className="rpt-round" key={round._id}>
          <div className="rpt-section-title">
            {round.roundNumber > 1 ? `Rework #${round.roundNumber - 1}` : "Work Details"}
            <span className={`rpt-tag rpt-tag--${round.responseStatus}`}>{RESPONSE_LABEL_EN[round.responseStatus]}</span>
          </div>

          <div className="rpt-round-dates">
            <div>
              <span className="rpt-meta-label">Started</span>
              <strong>{round.sampleStartDate || "—"}</strong>
            </div>
            <div>
              <span className="rpt-meta-label">Completed</span>
              <strong>{round.sampleReadyDate || "In progress"}</strong>
            </div>
            <div>
              <span className="rpt-meta-label">Client Response</span>
              <strong>{round.clientResponseDate || "—"}</strong>
            </div>
            <div>
              <span className="rpt-meta-label">Working Days</span>
              <strong>{daysTextEn(round.workDays)}</strong>
            </div>
          </div>

          {round.rejectionNotes && (
            <div className="rpt-note rpt-note--reject">
              <strong>Reason for rejection:</strong> {round.rejectionNotes}
            </div>
          )}

          {round.issues?.length > 0 && (
            <div className="rpt-table-wrap">
              <table className="rpt-table rpt-table--stack">
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>Date</th>
                    <th>Problem</th>
                    <th style={{ width: "15%" }}>Caused by</th>
                    <th style={{ width: "15%" }}>Resolved on</th>
                    <th style={{ width: "12%" }}>Delay</th>
                  </tr>
                </thead>
                <tbody>
                  {round.issues.map((issue) => (
                    <tr key={issue._id}>
                      <td data-label="Date">{issue.issueDate}</td>
                      <td data-label="Problem" className="rpt-cell-problem">
                        {issue.description}
                        {issue.resolutionNote && <div className="rpt-issue-note">Solution: {issue.resolutionNote}</div>}
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
                      <td data-label="Caused by" className={issue.causedBy === "client" ? "rpt-cell-client" : ""}>
                        {CAUSED_BY_LABEL_EN[issue.causedBy] || "Other"}
                      </td>
                      <td data-label="Resolved on">
                        {issue.isResolved ? issue.resolvedDate : <span className="rpt-tag rpt-tag--rejected">Open</span>}
                      </td>
                      <td data-label="Delay">{delayTextEn(issue.delayDays)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {hasPhotos && <div className="rpt-photo-hint">Tip: Tap on any photo to open it in full size.</div>}

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
