import React from "react";
import { X, Trash2, ShieldOff, ShieldCheck, LogOut } from "lucide-react";

export const Modal = ({ title, wide, children, onClose }) => (
  <div className="ag-overlay" onClick={onClose}>
    <div className={`ag-modal${wide ? " ag-modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
      <div className="ag-modal-hd">
        <span className="ag-modal-title">{title}</span>
        <button className="ag-modal-close" onClick={onClose}>
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="ag-modal-body">{children}</div>
    </div>
  </div>
);

export const DeleteConfirmModal = ({ title, name, loading, onDelete, onClose }) => (
  <div className="ag-overlay" onClick={onClose}>
    <div className="ag-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: "center" }}>
      <div className="ag-modal-body" style={{ padding: "36px 32px" }}>
        <Trash2 size={44} strokeWidth={1.5} color="var(--danger-fg)" style={{ marginBottom: 14 }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 22 }}>
          Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="ag-btn reject" disabled={loading} onClick={onDelete}>
            {loading ? "Deleting..." : "Delete"}
          </button>
          <button className="ag-btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  </div>
);

export const ConfirmModal = ({
  icon: Icon,
  iconColor = "var(--danger-fg)",
  title,
  message,
  confirmText = "Confirm",
  confirmClass = "reject",
  loading,
  onConfirm,
  onClose,
}) => (
  <div className="ag-overlay" onClick={onClose}>
    <div className="ag-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: "center" }}>
      <div className="ag-modal-body" style={{ padding: "36px 32px" }}>
        {Icon && <Icon size={44} strokeWidth={1.5} color={iconColor} style={{ marginBottom: 14 }} />}
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className={`ag-btn ${confirmClass}`} disabled={loading} onClick={onConfirm}>
            {loading ? "Processing…" : confirmText}
          </button>
          <button className="ag-btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  </div>
);
