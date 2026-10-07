import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Drawer, Spin, Tag, Button, Segmented, Image, Popconfirm, Collapse, Alert, Empty } from "antd";
import {
  PlayCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  RedoOutlined,
  DownloadOutlined,
  PrinterOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  getSingleWorkOrderAsync,
  createSampleRoundAsync,
  updateSampleRoundAsync,
  updateSiteIssueAsync,
  deleteSiteIssueAsync,
} from "../../store/services/workOrderService.js";
import { clearSelectedWorkOrder } from "../../store/slices/workOrderSlice";
import { usePdfDownload } from "../../utils/usePdfDowload.js";
import { getErrorMessage } from "../../utils/toastError.js";
import IssueFormModal from "./IssueFormModal.jsx";
import WorkReportSheet from "./WorkReportSheet.jsx";
import { DateNoteModal, ClientResponseModal } from "./StepModals.jsx";
import {
  STATUS_OPTIONS,
  STATUS_COLOR,
  RESPONSE_LABEL,
  CAUSED_BY_OPTIONS,
  labelOf,
  daysText,
  getNextStep,
  roundLabel,
} from "./workOrderConstants.js";
import "./WorkOrderTimeline.css";

// PDF se pehle saari photos load ho jayen, warna PDF mein khali aati hain.
const waitForImages = (el) =>
  Promise.all(
    Array.from(el?.querySelectorAll("img") || []).map((img) =>
      img.complete ? Promise.resolve() : img.decode().catch(() => {}),
    ),
  );

// ─── Ek problem ka card ──────────────────────────────────────────
const IssueCard = ({ issue, canEdit, onResolve, onEdit, onDelete }) => (
  <div className={`wot-issue ${issue.isResolved ? "wot-issue--resolved" : "wot-issue--open"}`}>
    <div className="wot-issue-top">
      <span className="wot-issue-date">{issue.issueDate}</span>
      <Tag color={issue.causedBy === "client" ? "red" : "default"}>{labelOf(CAUSED_BY_OPTIONS, issue.causedBy)}</Tag>
    </div>
    <div className="wot-issue-desc">{issue.description}</div>

    {issue.images?.length > 0 && (
      <div className="wot-issue-photos">
        <Image.PreviewGroup>
          {issue.images.map((img) => (
            <Image key={img._id} src={img.url} alt="Problem photo" crossOrigin="anonymous" />
          ))}
        </Image.PreviewGroup>
      </div>
    )}

    <div className="wot-issue-footer">
      {issue.isResolved ? (
        <span className="wot-issue-status wot-issue-status--ok">
          <CheckCircleOutlined /> Hal: {issue.resolvedDate} ({daysText(issue.delayDays)})
        </span>
      ) : (
        <span className="wot-issue-status wot-issue-status--open">
          <ClockCircleOutlined /> Jari — {daysText(issue.delayDays)}
        </span>
      )}
      {issue.resolutionNote && <span className="wot-issue-note">{issue.resolutionNote}</span>}
    </div>

    {canEdit && (
      <div className="wot-issue-actions">
        {!issue.isResolved && (
          <Button type="primary" size="middle" icon={<CheckCircleOutlined />} onClick={() => onResolve(issue)}>
            Hal ho gayi
          </Button>
        )}
        <Button icon={<EditOutlined />} onClick={() => onEdit(issue)}>
          Edit
        </Button>
        <Popconfirm title="Ye problem delete karein?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => onDelete(issue)}>
          <Button danger icon={<DeleteOutlined />} aria-label="Delete" />
        </Popconfirm>
      </div>
    )}
  </div>
);

// ─── Ek round ki timeline (Shuru → Problems → Mukammal → Client jawab) ──
const RoundTimeline = ({ round, isLatest, cancelled, onAddIssue, onResolve, onEditIssue, onDeleteIssue }) => {
  const canEditIssues = !cancelled && round.responseStatus !== "approved";
  const canAddIssue = !cancelled && isLatest && round.responseStatus === "pending";
  const issues = round.issues || [];

  const steps = [
    {
      key: "start",
      done: !!round.sampleStartDate,
      title: "Kaam Shuru",
      body: (
        <>
          <div className="wot-step-date">{round.sampleStartDate || "—"}</div>
          {round.description && <div className="wot-step-note">{round.description}</div>}
        </>
      ),
    },
    {
      key: "issues",
      done: issues.length > 0 && issues.every((i) => i.isResolved),
      warn: issues.some((i) => !i.isResolved),
      title: `Problems (${issues.length})`,
      body: (
        <>
          {issues.length === 0 && <div className="wot-step-note">Koi problem nahi aayi.</div>}
          {issues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue}
              canEdit={canEditIssues}
              onResolve={onResolve}
              onEdit={(i) => onEditIssue(i, round)}
              onDelete={onDeleteIssue}
            />
          ))}
          {canAddIssue && (
            <Button block icon={<WarningOutlined />} className="wot-add-issue-btn" onClick={() => onAddIssue(round)}>
              Problem Report Karein
            </Button>
          )}
        </>
      ),
    },
    {
      key: "complete",
      done: !!round.sampleReadyDate,
      title: "Kaam Mukammal",
      body: (
        <div className="wot-step-date">
          {round.sampleReadyDate ? `${round.sampleReadyDate} · ${daysText(round.workDays)} kaam` : "Abhi jari hai"}
        </div>
      ),
    },
    {
      key: "response",
      done: round.responseStatus !== "pending",
      danger: round.responseStatus === "rejected",
      title: "Client ka Jawab",
      body: (
        <>
          <span className={`rpt-tag rpt-tag--${round.responseStatus}`}>{RESPONSE_LABEL[round.responseStatus]}</span>
          {round.clientResponseDate && <span className="wot-step-date"> · {round.clientResponseDate}</span>}
          {round.rejectionNotes && <div className="wot-step-note wot-step-note--reject">{round.rejectionNotes}</div>}
        </>
      ),
    },
  ];

  return (
    <ol className="wot-steps">
      {steps.map((step, index) => (
        <li
          key={step.key}
          className={[
            "wot-step",
            step.done && "wot-step--done",
            step.warn && "wot-step--warn",
            step.danger && "wot-step--danger",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="wot-step-dot">{step.done ? "✓" : index + 1}</span>
          <div className="wot-step-content">
            <div className="wot-step-title">{step.title}</div>
            {step.body}
          </div>
        </li>
      ))}
    </ol>
  );
};

// =====================================================================
// Work Report drawer — timeline + "agla qadam" + PDF report
// =====================================================================
const WorkOrderDrawer = ({ open, workOrderId, onClose, onChanged }) => {
  const dispatch = useDispatch();
  const { selectedWorkOrder: workOrder, rounds = [], stats, detail_status } = useSelector((s) => s.workOrder || {});
  const { downloadPdf, downloading } = usePdfDownload();
  const printRef = useRef(null);
  const loading = detail_status === "loading";

  const [view, setView] = useState("timeline");
  const [modal, setModal] = useState(null); // { type, round?, issue? }
  const closeModal = () => setModal(null);

  useEffect(() => {
    if (open && workOrderId) {
      setView("timeline");
      dispatch(getSingleWorkOrderAsync(workOrderId));
    }
    if (!open) dispatch(clearSelectedWorkOrder());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workOrderId]);

  const refresh = () => {
    dispatch(getSingleWorkOrderAsync(workOrderId));
    onChanged?.();
  };

  const latestRound = rounds[rounds.length - 1] || null;
  const step = getNextStep(workOrder, rounds);
  const cancelled = step === "cancelled";
  const latestOpenIssues = (latestRound?.issues || []).filter((i) => !i.isResolved).length;

  // ── actions (errors modals khud toast karte hain) ──
  const startWork = async ({ date, note }) => {
    await dispatch(createSampleRoundAsync({ workOrderId, sampleStartDate: date, description: note })).unwrap();
    refresh();
  };
  const completeWork = async ({ date }) => {
    await dispatch(updateSampleRoundAsync({ id: latestRound._id, sampleReadyDate: date })).unwrap();
    refresh();
  };
  const recordResponse = async (values) => {
    await dispatch(updateSampleRoundAsync({ id: latestRound._id, ...values })).unwrap();
    refresh();
  };
  const resolveIssue = async ({ date, note }) => {
    await dispatch(updateSiteIssueAsync({ id: modal.issue._id, resolvedDate: date, resolutionNote: note })).unwrap();
    refresh();
  };
  const deleteIssue = async (issue) => {
    try {
      await dispatch(deleteSiteIssueAsync(issue._id)).unwrap();
      toast.success("Problem delete ho gayi");
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDownload = async () => {
    if (!workOrder) return;
    await waitForImages(printRef.current);
    const title = (workOrder.title || "report").replace(/\s+/g, "-");
    downloadPdf(printRef, `work-report-${title}-${dayjs().format("DD-MM-YYYY")}.pdf`);
  };

  // ── "Agla qadam" card ──
  const renderNextStep = () => {
    switch (step) {
      case "cancelled":
        return <Alert type="info" showIcon message="Ye work report cancel hai. Edit se dobara khol sakte hain." />;
      case "start":
        return (
          <Button type="primary" size="large" block icon={<PlayCircleOutlined />} onClick={() => setModal({ type: "start" })}>
            Kaam Shuru Karein
          </Button>
        );
      case "in_progress":
        return (
          <div className="wot-next-actions">
            <Button size="large" block icon={<WarningOutlined />} className="wot-btn-warn" onClick={() => setModal({ type: "issue", round: latestRound })}>
              Problem Report Karein
            </Button>
            <Button type="primary" size="large" block icon={<CheckCircleOutlined />} onClick={() => setModal({ type: "complete" })}>
              Kaam Mukammal Ho Gaya
            </Button>
          </div>
        );
      case "await_response":
        return (
          <div className="wot-next-actions">
            <Button type="primary" size="large" block icon={<MessageOutlined />} onClick={() => setModal({ type: "response" })}>
              Client ka Jawab Record Karein
            </Button>
            <Button size="large" block icon={<WarningOutlined />} className="wot-btn-warn" onClick={() => setModal({ type: "issue", round: latestRound })}>
              Problem Report Karein
            </Button>
          </div>
        );
      case "rework":
        return (
          <>
            <Alert
              type="error"
              showIcon
              className="wot-next-alert"
              message="Client ne reject kiya"
              description={latestRound?.rejectionNotes}
            />
            <Button type="primary" size="large" block icon={<RedoOutlined />} onClick={() => setModal({ type: "rework" })}>
              Dobara Kaam Shuru Karein (Rework)
            </Button>
          </>
        );
      case "approved":
        return (
          <>
            <Alert type="success" showIcon className="wot-next-alert" message={`Client ne approve kar diya — ${latestRound?.clientResponseDate || ""}`} />
            <Button size="large" block icon={<FileTextOutlined />} onClick={() => setView("report")}>
              Report Dekhein / Download Karein
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  const olderRounds = rounds.slice(0, -1).reverse();
  const timelineProps = {
    cancelled,
    onAddIssue: (round) => setModal({ type: "issue", round }),
    onResolve: (issue) => setModal({ type: "resolve", issue }),
    onEditIssue: (issue, round) => setModal({ type: "issue", issue, round }),
    onDeleteIssue: deleteIssue,
  };

  return (
    <Drawer open={open} onClose={onClose} title={workOrder?.title || "Work Report"} size="100%" destroyOnHidden className="wot-drawer">
      <Spin spinning={loading}>
        {workOrder && (
          <>
            {/* ---- Header ---- */}
            <div className="wot-head">
              <div className="wot-head-info">
                <div className="wot-head-line">
                  <span className="wot-head-label">Site</span> {workOrder.siteId?.name || "—"}
                </div>
                <div className="wot-head-line">
                  <span className="wot-head-label">Client</span> {workOrder.clientName || "—"}
                </div>
              </div>
              <div className="wot-head-tags">
                <Tag color={STATUS_COLOR[workOrder.status]}>{labelOf(STATUS_OPTIONS, workOrder.status)}</Tag>
                {stats?.openIssues > 0 && (
                  <Tag color="red" icon={<WarningOutlined />}>
                    {stats.openIssues} problem jari
                  </Tag>
                )}
              </div>
            </div>

            <Segmented
              block
              className="wot-view-switch"
              value={view}
              onChange={setView}
              options={[
                { value: "timeline", label: "Kaam ki Timeline" },
                { value: "report", label: "Report / PDF" },
              ]}
            />

            {view === "timeline" ? (
              <>
                <div className="wot-next">
                  <div className="wot-next-label">Agla qadam</div>
                  {renderNextStep()}
                </div>

                <div className="wot-stats">
                  <div className="wot-stat">
                    <span>Kul din</span>
                    <strong>{daysText(stats?.totalDurationDays)}</strong>
                  </div>
                  <div className="wot-stat">
                    <span>Problems</span>
                    <strong>{stats?.totalIssues || 0}</strong>
                  </div>
                  <div className="wot-stat wot-stat--danger">
                    <span>Client ki wajah se delay</span>
                    <strong>{daysText(stats?.clientCausedDelayDays)}</strong>
                  </div>
                </div>

                {latestRound ? (
                  <div className="wot-round">
                    <div className="wot-round-title">{roundLabel(latestRound.roundNumber)}</div>
                    <RoundTimeline round={latestRound} isLatest {...timelineProps} />
                  </div>
                ) : (
                  <Empty description="Abhi kaam shuru nahi hua" />
                )}

                {olderRounds.length > 0 && (
                  <Collapse
                    className="wot-history"
                    items={olderRounds.map((round) => ({
                      key: round._id,
                      label: `${roundLabel(round.roundNumber)} — ${RESPONSE_LABEL[round.responseStatus]}${round.rejectionNotes ? ` (${round.rejectionNotes})` : ""}`,
                      children: <RoundTimeline round={round} isLatest={false} {...timelineProps} />,
                    }))}
                  />
                )}
              </>
            ) : (
              <>
                <div className="rpt-actions rpt-no-print">
                  <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                    Print
                  </Button>
                  <Button type="primary" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
                    Download PDF
                  </Button>
                </div>
                <WorkReportSheet ref={printRef} workOrder={workOrder} rounds={rounds} stats={stats} />
              </>
            )}
          </>
        )}
      </Spin>

      {/* ---- Modals ---- */}
      <DateNoteModal
        open={modal?.type === "start" || modal?.type === "rework"}
        onClose={closeModal}
        onSubmit={startWork}
        title={modal?.type === "rework" ? "Dobara Kaam Shuru (Rework)" : "Kaam Shuru Karein"}
        dateLabel="Kaam kis din shuru hua?"
        noteLabel="Note (optional)"
        notePlaceholder="e.g. 4 mazdoor, living room se shuru"
        okText="Kaam Shuru Karein"
        successMessage="Kaam shuru ho gaya"
      />
      <DateNoteModal
        open={modal?.type === "complete"}
        onClose={closeModal}
        onSubmit={completeWork}
        title="Kaam Mukammal"
        dateLabel="Kaam kis din mukammal hua?"
        okText="Mukammal Save Karein"
        successMessage="Kaam mukammal mark ho gaya"
        minDate={latestRound?.sampleStartDate}
        warning={latestOpenIssues > 0 ? `${latestOpenIssues} problem(s) abhi jari hain — client approve se pehle inhe hal karna hoga.` : null}
      />
      <DateNoteModal
        open={modal?.type === "resolve"}
        onClose={closeModal}
        onSubmit={resolveIssue}
        title="Problem Hal Ho Gayi"
        dateLabel="Problem kis din hal hui?"
        noteLabel="Kaise hal hui? (optional)"
        notePlaceholder="e.g. Client ne naya material bhej diya"
        okText="Hal Save Karein"
        successMessage="Problem hal mark ho gayi"
        minDate={modal?.issue?.issueDate}
      />
      <ClientResponseModal
        open={modal?.type === "response"}
        onClose={closeModal}
        onSubmit={recordResponse}
        round={latestRound}
        openIssues={latestOpenIssues}
      />
      <IssueFormModal
        open={modal?.type === "issue"}
        onClose={closeModal}
        onSaved={refresh}
        workOrderId={workOrderId}
        round={modal?.round}
        issue={modal?.issue}
      />
    </Drawer>
  );
};

export default WorkOrderDrawer;
