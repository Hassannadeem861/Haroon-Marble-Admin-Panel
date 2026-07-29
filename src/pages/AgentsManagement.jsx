import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik } from "formik";
import {
  Search, X, AlertCircle, Briefcase, CheckCircle, Clock, XCircle,
  ShieldOff, ShieldCheck, FileText, Image, Video, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAgentsAsync, verifyAgentAsync, suspendAgentAsync,
  createAgentAsync, updateAgentAsync, deleteAgentAsync,
} from "../store/services/agentService";
import {
  resetAgentVerifyStatus, resetAgentSuspendStatus,
  resetAgentCreateStatus, resetAgentUpdateStatus, resetAgentDeleteStatus,
} from "../store/slices/agentSlice";
import { asyncStatus } from "../utils/asyncStatus";
import { getValidationSchema } from "../utils/validationSchema";
import { formatDate, getInitials, getAvatarBg } from "../utils/helperFunctions.jsx";
import { ConfirmModal, Modal, DeleteConfirmModal } from "../components/Modal.jsx";
import { FormInput, ToggleField } from "../components/FormField.jsx";
import SkeletonLoader from "../components/SkeletonLoader.jsx";
import "./Agents.css";

const VERIFY_OPTIONS = [
  { value: "",         label: "All Verifications" },
  { value: "pending",  label: "Pending"           },
  { value: "approved", label: "Approved"          },
  { value: "rejected", label: "Rejected"          },
];

const PAGE_LIMIT = 20;

const UserPhoto = ({ photoUrl, name, size = 34 }) => {
  const [errored, setErrored] = useState(false);
  if (photoUrl && !errored) {
    return (
      <img
        src={photoUrl}
        alt={name || "user"}
        onError={() => setErrored(true)}
        style={{ width: size, height: size, minWidth: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      className="ag-avatar"
      style={{ width: size, height: size, minWidth: size, fontSize: size > 40 ? 16 : 11, background: getAvatarBg(name) }}
    >
      {getInitials(name)}
    </div>
  );
};

const VerifyBadge = ({ status }) => {
  const cls   = status === "approved" ? "verified" : (status || "pending");
  const label = status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending";
  return <span className={`ag-status ${cls}`}>{label}</span>;
};

const AgentsManagement = () => {
  const dispatch = useDispatch();

  const {
    agents = [],
    pagination = { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 },
    get_status,
    get_error,
    verify_status,
    verify_error,
    suspend_status,
    suspend_error,
    create_status,
    update_status,
    delete_status,
  } = useSelector(s => s.agent ?? {});

  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebounced]   = useState("");
  const [verifyFilter, setVerifyFilter]   = useState("");
  const [currentPage, setCurrentPage]     = useState(1);
  const [selected, setSelected]           = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [editAgent, setEditAgent]         = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const debounceRef = useRef(null);

  const isLoading    = get_status     === asyncStatus.LOADING;
  const isVerifying  = verify_status  === asyncStatus.LOADING;
  const isSuspending = suspend_status === asyncStatus.LOADING;
  const { total = 0, totalPages = 1 } = pagination;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(search), 450);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  const fetchAgents = useCallback(() => {
    const params = { page: currentPage, limit: PAGE_LIMIT };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    dispatch(getAgentsAsync(params));
  }, [dispatch, currentPage, debouncedSearch]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    if (verify_status === asyncStatus.SUCCEEDED) {
      toast.success("Agent verification updated");
      setPendingAction(null);
      dispatch(resetAgentVerifyStatus());
      fetchAgents();
    }
    if (verify_status === asyncStatus.ERROR) {
      toast.error(verify_error || "Failed to update verification");
      dispatch(resetAgentVerifyStatus());
    }
  }, [verify_status, verify_error, dispatch, fetchAgents]);

  useEffect(() => {
    if (suspend_status === asyncStatus.SUCCEEDED) {
      toast.success("Suspension status updated");
      setPendingAction(null);
      dispatch(resetAgentSuspendStatus());
      fetchAgents();
    }
    if (suspend_status === asyncStatus.ERROR) {
      toast.error(suspend_error || "Failed to update suspension");
      dispatch(resetAgentSuspendStatus());
    }
  }, [suspend_status, suspend_error, dispatch, fetchAgents]);

  useEffect(() => {
    if (create_status === asyncStatus.SUCCEEDED) {
      toast.success("Agent created successfully");
      setShowCreate(false);
      dispatch(resetAgentCreateStatus());
      fetchAgents();
    }
    if (create_status === asyncStatus.ERROR) dispatch(resetAgentCreateStatus());
  }, [create_status, dispatch, fetchAgents]);

  useEffect(() => {
    if (update_status === asyncStatus.SUCCEEDED) {
      toast.success("Agent updated successfully");
      setEditAgent(null);
      dispatch(resetAgentUpdateStatus());
      fetchAgents();
    }
    if (update_status === asyncStatus.ERROR) dispatch(resetAgentUpdateStatus());
  }, [update_status, dispatch, fetchAgents]);

  useEffect(() => {
    if (delete_status === asyncStatus.SUCCEEDED) {
      toast.success("Agent deleted successfully");
      setDeleteTarget(null);
      dispatch(resetAgentDeleteStatus());
      fetchAgents();
    }
    if (delete_status === asyncStatus.ERROR) dispatch(resetAgentDeleteStatus());
  }, [delete_status, dispatch, fetchAgents]);

  const filtered = useMemo(() => {
    if (!verifyFilter) return agents;
    return agents.filter(a => a.verificationStatus === verifyFilter);
  }, [agents, verifyFilter]);

  const stats = useMemo(() => ({
    total,
    approved:  agents.filter(a => a.verificationStatus === "approved").length,
    pending:   agents.filter(a => a.verificationStatus === "pending").length,
    rejected:  agents.filter(a => a.verificationStatus === "rejected").length,
    suspended: agents.filter(a => a.isSuspended).length,
  }), [agents, total]);

  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end   = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const startIdx = (currentPage - 1) * PAGE_LIMIT + 1;
  const endIdx   = Math.min(currentPage * PAGE_LIMIT, total);

  return (
    <div className="ag-root">

      {/* HEADER */}
      <div className="ag-page-hd">
        <div>
          <h1 className="ag-page-title">Agents Management</h1>
          <p className="ag-page-sub">Verify, suspend and manage real estate agents</p>
        </div>
        <button className="ag-create-btn" onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={2.5} /> Add Agent
        </button>
      </div>

      {get_status === asyncStatus.ERROR && get_error && (
        <div className="ag-error-banner"><AlertCircle size={15} strokeWidth={2} />{get_error}</div>
      )}

      {/* SUMMARY PILLS */}
      <div className="ag-summary">
        <div className="ag-pill"><span className="ag-pill-dot all"       />{stats.total}     Total</div>
        <div className="ag-pill"><span className="ag-pill-dot verified"  />{stats.approved}  Approved</div>
        <div className="ag-pill"><span className="ag-pill-dot pending"   />{stats.pending}   Pending</div>
        <div className="ag-pill"><span className="ag-pill-dot rejected"  />{stats.rejected}  Rejected</div>
        <div className="ag-pill"><span className="ag-pill-dot suspended" />{stats.suspended} Suspended</div>
      </div>

      {/* TOOLBAR */}
      <div className="ag-toolbar">
        <div className="ag-search-wrap">
          <Search size={14} strokeWidth={2} className="ag-search-icon" />
          <input
            className="ag-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: search ? 32 : undefined }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", padding: 2 }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select className="ag-filter-select" value={verifyFilter} onChange={e => setVerifyFilter(e.target.value)}>
          {VERIFY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div className="ag-card">
        <table className="ag-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Quiz</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonLoader type="table" columns={9} rows={8} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="ag-empty"><Briefcase size={18} strokeWidth={1.5} />No agents found</div>
              </td></tr>
            ) : (
              filtered.map((agent, idx) => (
                <tr key={agent._id}>
                  <td className="ag-cell-muted" data-label="#">
                    {(currentPage - 1) * PAGE_LIMIT + idx + 1}
                  </td>
                  <td data-label="Agent">
                    <div className="ag-user-cell">
                      <UserPhoto photoUrl={agent.profilePhotoUrl} name={agent.fullName} size={34} />
                      <div>
                        <div className="ag-user-name">{agent.fullName || "—"}</div>
                        {agent.licenseNumber && (
                          <div className="ag-user-loc">Lic: {agent.licenseNumber}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="ag-cell-muted" data-label="Email">{agent.email}</td>
                  <td className="ag-cell-muted" data-label="Phone">{agent.phone || "—"}</td>
                  <td data-label="Verification"><VerifyBadge status={agent.verificationStatus} /></td>
                  <td data-label="Status">
                    {agent.isSuspended
                      ? <span className="ag-status suspended">Suspended</span>
                      : agent.isActive
                        ? <span className="ag-status verified">Active</span>
                        : <span className="ag-status rejected">Inactive</span>
                    }
                  </td>
                  <td data-label="Quiz">
                    <span className={`ag-bool ${agent.isquizcompleted ? "yes" : "no"}`}>
                      {agent.isquizcompleted ? <CheckCircle size={11} /> : <Clock size={11} />}
                      {agent.quizCompletionPercentage ?? 0}%
                    </span>
                  </td>
                  <td className="ag-cell-muted" data-label="Joined">{formatDate(agent.createdAt)}</td>
                  <td data-label="Actions">
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="ag-action-btn" onClick={() => setSelected(agent)}>View</button>
                      <button className="ag-action-btn" onClick={() => setEditAgent(agent)} title="Edit"><Pencil size={12} /></button>
                      <button className="ag-action-btn" onClick={() => setDeleteTarget(agent)} title="Delete" style={{ color: "var(--danger-fg)" }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="ag-foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span className="ag-foot-count">
            {filtered.length === 0
              ? "No results"
              : verifyFilter
                ? `${filtered.length} agents on this page`
                : `Showing ${startIdx}–${endIdx} of ${total} agents`}
          </span>
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <button className="um-pg-btn" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
              <ChevronLeft size={14} />
            </button>
            {pageNumbers[0] > 1 && (<>
              <button className="um-pg-btn" onClick={() => goToPage(1)}>1</button>
              {pageNumbers[0] > 2 && <span style={{ color: "var(--text-3)", fontSize: 11, padding: "0 2px" }}>…</span>}
            </>)}
            {pageNumbers.map(p => (
              <button key={p} className={`um-pg-btn${p === currentPage ? " active" : ""}`} onClick={() => goToPage(p)}>{p}</button>
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (<>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span style={{ color: "var(--text-3)", fontSize: 11, padding: "0 2px" }}>…</span>}
              <button className="um-pg-btn" onClick={() => goToPage(totalPages)}>{totalPages}</button>
            </>)}
            <button className="um-pg-btn" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <AgentDetailModal
          agent={selected}
          onClose={() => setSelected(null)}
          onAction={(agent, type) => { setSelected(null); setPendingAction({ agent, type }); }}
        />
      )}

      {/* FORM MODALS */}
      {showCreate && <AgentFormModal onClose={() => setShowCreate(false)} />}
      {editAgent  && <AgentFormModal agent={editAgent} onClose={() => setEditAgent(null)} />}

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Agent?"
          name={deleteTarget.fullName || deleteTarget.email}
          loading={delete_status === asyncStatus.LOADING}
          onDelete={() => dispatch(deleteAgentAsync(deleteTarget._id))}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* VERIFY / SUSPEND CONFIRM MODALS */}
      {pendingAction?.type === "approve" && (
        <ConfirmModal
          icon={CheckCircle}
          iconColor="#22c55e"
          title="Approve Agent"
          message={`Approve ${pendingAction.agent.fullName} as a verified agent on the platform?`}
          confirmText="Yes, Approve"
          confirmClass="approve"
          loading={isVerifying}
          onConfirm={() => dispatch(verifyAgentAsync({ id: pendingAction.agent._id, status: "approved" }))}
          onClose={() => setPendingAction(null)}
        />
      )}

      {pendingAction?.type === "reject" && (
        <ConfirmModal
          icon={XCircle}
          iconColor="#ef4444"
          title="Reject Agent"
          message={`Reject ${pendingAction.agent.fullName}'s verification request?`}
          confirmText="Yes, Reject"
          confirmClass="reject"
          loading={isVerifying}
          onConfirm={() => dispatch(verifyAgentAsync({ id: pendingAction.agent._id, status: "rejected" }))}
          onClose={() => setPendingAction(null)}
        />
      )}

      {pendingAction?.type === "suspend" && (
        <ConfirmModal
          icon={ShieldOff}
          iconColor="#ef4444"
          title="Suspend Agent"
          message={`Suspend ${pendingAction.agent.fullName}? They will lose platform access.`}
          confirmText="Yes, Suspend"
          confirmClass="reject"
          loading={isSuspending}
          onConfirm={() => dispatch(suspendAgentAsync({ userId: pendingAction.agent._id, isSuspended: true }))}
          onClose={() => setPendingAction(null)}
        />
      )}

      {pendingAction?.type === "unsuspend" && (
        <ConfirmModal
          icon={ShieldCheck}
          iconColor="#22c55e"
          title="Unsuspend Agent"
          message={`Restore platform access for ${pendingAction.agent.fullName}?`}
          confirmText="Yes, Unsuspend"
          confirmClass="approve"
          loading={isSuspending}
          onConfirm={() => dispatch(suspendAgentAsync({ userId: pendingAction.agent._id, isSuspended: false }))}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};

/* ── AGENT FORM MODAL ── */
const AgentFormModal = React.memo(({ agent, onClose }) => {
  const dispatch = useDispatch();
  const { create_status, create_error, update_status, update_error } = useSelector(s => s.agent);
  const isEdit = !!agent;
  const saving  = (isEdit ? update_status : create_status) === asyncStatus.LOADING;
  const apiError = isEdit ? update_error : create_error;

  const initialValues = isEdit
    ? { fullName: agent.fullName || "", email: agent.email || "", phone: agent.phone || "", isActive: agent.isActive !== undefined ? agent.isActive : true, role: "agent" }
    : { fullName: "", email: "", phone: "", password: "", isActive: true, role: "agent" };

  const handleSubmit = (values) => {
    if (isEdit) {
      const { password, role, ...payload } = values;
      dispatch(updateAgentAsync({ id: agent._id, ...payload }));
    } else {
      const { role, ...payload } = values;
      dispatch(createAgentAsync(payload));
    }
  };

  return (
    <Modal title={isEdit ? "Edit Agent" : "Add New Agent"} wide onClose={onClose}>
      <Formik
        initialValues={initialValues}
        validationSchema={getValidationSchema(isEdit ? "editUser" : "createUser")}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit: formikSubmit, values, errors, touched, setFieldValue }) => (
          <>
            {apiError && (
              <div className="ag-error-banner" style={{ marginBottom: 12 }}>
                <AlertCircle size={13} />{apiError}
              </div>
            )}
            <div className="ag-create-grid">
              <FormInput
                label="Full Name" required name="fullName" placeholder="John Smith"
                value={values.fullName} onChange={handleChange("fullName")} onBlur={handleBlur("fullName")}
                error={errors.fullName} touched={touched.fullName} disabled={saving}
              />
              <FormInput
                label="Email" required name="email" type="email" placeholder="agent@email.com"
                value={values.email} onChange={handleChange("email")} onBlur={handleBlur("email")}
                error={errors.email} touched={touched.email} disabled={saving}
              />
              <FormInput
                label="Phone" name="phone" placeholder="+1 (555) 000-0000"
                value={values.phone} onChange={handleChange("phone")} onBlur={handleBlur("phone")}
                error={errors.phone} touched={touched.phone} disabled={saving}
              />
              {!isEdit && (
                <FormInput
                  label="Password" required name="password" type="password" placeholder="Enter password"
                  value={values.password} onChange={handleChange("password")} onBlur={handleBlur("password")}
                  error={errors.password} touched={touched.password} disabled={saving}
                />
              )}
            </div>
            <ToggleField label="Active" checked={values.isActive} onChange={() => setFieldValue("isActive", !values.isActive)} />
            <div className="ag-modal-actions" style={{ paddingTop: 16 }}>
              <button className="ag-btn approve" disabled={saving} onClick={formikSubmit}>
                {saving ? (isEdit ? "Updating…" : "Creating…") : (isEdit ? "Update Agent" : "Create Agent")}
              </button>
              <button className="ag-btn secondary" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </Formik>
    </Modal>
  );
});

/* ── AGENT DETAIL MODAL ── */
const AgentDetailModal = React.memo(({ agent, onClose, onAction }) => {
  const vs = agent.verificationStatus;
  return (
    <div className="ag-overlay" onClick={onClose}>
      <div className="ag-modal" onClick={e => e.stopPropagation()}>

        <div className="ag-modal-hd">
          <span className="ag-modal-title">Agent Profile</span>
          <button className="ag-modal-close" onClick={onClose}><X size={16} strokeWidth={2} /></button>
        </div>

        <div className="ag-modal-body">
          <div className="ag-modal-profile">
            <UserPhoto photoUrl={agent.profilePhotoUrl} name={agent.fullName} size={56} />
            <div>
              <div className="ag-modal-name">{agent.fullName || "—"}</div>
              <div className="ag-modal-email">{agent.email}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <VerifyBadge status={vs} />
                {agent.isSuspended && <span className="ag-status suspended">Suspended</span>}
              </div>
            </div>
          </div>

          <div className="ag-detail-grid">
            <div className="ag-detail-item">
              <div className="ag-detail-lbl">Phone</div>
              <div className="ag-detail-val">{agent.phone || "—"}</div>
            </div>
            <div className="ag-detail-item">
              <div className="ag-detail-lbl">License Number</div>
              <div className="ag-detail-val">{agent.licenseNumber || "—"}</div>
            </div>
            <div className="ag-detail-item">
              <div className="ag-detail-lbl">Experience</div>
              <div className="ag-detail-val">{agent.yearsOfExperience ? `${agent.yearsOfExperience} yrs` : "—"}</div>
            </div>
            <div className="ag-detail-item">
              <div className="ag-detail-lbl">Quiz</div>
              <div className="ag-detail-val">{agent.quizCompletionPercentage ?? 0}% complete</div>
            </div>
            <div className="ag-detail-item">
              <div className="ag-detail-lbl">Profile Complete</div>
              <div className="ag-detail-val">{agent.isagentprofielcompleted ? "Yes" : "No"}</div>
            </div>
            <div className="ag-detail-item">
              <div className="ag-detail-lbl">Email Verified</div>
              <div className="ag-detail-val">{agent.isEmailVerified ? "Yes" : "No"}</div>
            </div>
            <div className="ag-detail-item">
              <div className="ag-detail-lbl">Joined</div>
              <div className="ag-detail-val">{formatDate(agent.createdAt)}</div>
            </div>
            {agent.verificationRejectedReason && (
              <div className="ag-detail-item" style={{ gridColumn: "1 / -1" }}>
                <div className="ag-detail-lbl">Rejection Reason</div>
                <div className="ag-detail-val" style={{ color: "var(--danger-fg)" }}>{agent.verificationRejectedReason}</div>
              </div>
            )}
          </div>

          {agent.specialties?.length > 0 && (
            <div className="ag-portfolio-section">
              <div className="ag-section-lbl">Specialties</div>
              <div className="ag-portfolio-pills">
                {agent.specialties.map((s, i) => <span key={i} className="ag-portfolio-pill">{s}</span>)}
              </div>
            </div>
          )}

          {agent.serviceAreas?.length > 0 && (
            <div className="ag-portfolio-section">
              <div className="ag-section-lbl">Service Areas</div>
              <div className="ag-portfolio-pills">
                {agent.serviceAreas.map((a, i) => <span key={i} className="ag-portfolio-pill">{a}</span>)}
              </div>
            </div>
          )}

          {(agent.portfolioImageUrls?.length > 0 || agent.portfolioDocumentUrls?.length > 0) && (
            <div className="ag-portfolio-section">
              <div className="ag-section-lbl">Portfolio</div>
              <div className="ag-portfolio-pills">
                {agent.portfolioImageUrls?.map((url, i) => (
                  <a key={`img-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="ag-portfolio-pill" style={{ textDecoration: "none" }}>
                    <Image size={11} strokeWidth={2} /> Image {i + 1}
                  </a>
                ))}
                {agent.portfolioDocumentUrls?.map((url, i) => (
                  <a key={`doc-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="ag-portfolio-pill" style={{ textDecoration: "none" }}>
                    <FileText size={11} strokeWidth={2} /> Doc {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {agent.bioVideoUrl && (
            <div className="ag-portfolio-section">
              <div className="ag-section-lbl">Bio Video</div>
              <a href={agent.bioVideoUrl} target="_blank" rel="noopener noreferrer" className="ag-portfolio-pill" style={{ textDecoration: "none" }}>
                <Video size={11} strokeWidth={2} /> Watch Video
              </a>
            </div>
          )}

          {agent.bio && (
            <div className="ag-portfolio-section">
              <div className="ag-section-lbl">Bio</div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{agent.bio}</p>
            </div>
          )}

          <div className="ag-modal-actions">
            {vs !== "approved" && (
              <button className="ag-btn approve" onClick={() => onAction(agent, "approve")}>
                <CheckCircle size={13} style={{ marginRight: 4 }} /> Approve
              </button>
            )}
            {vs !== "rejected" && (
              <button className="ag-btn reject" onClick={() => onAction(agent, "reject")}>
                <XCircle size={13} style={{ marginRight: 4 }} /> Reject
              </button>
            )}
            {agent.isSuspended ? (
              <button className="ag-btn approve" onClick={() => onAction(agent, "unsuspend")}>
                <ShieldCheck size={13} style={{ marginRight: 4 }} /> Unsuspend
              </button>
            ) : (
              <button className="ag-btn reject" onClick={() => onAction(agent, "suspend")}>
                <ShieldOff size={13} style={{ marginRight: 4 }} /> Suspend
              </button>
            )}
            <button className="ag-btn secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AgentsManagement;
