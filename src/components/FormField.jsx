import React from "react";

export const FormField = ({ label, required, error, touched, children, className = "", style }) => (
  <div className={`ag-create-field ${className}`} style={style}>
    {label && (
      <label className="ag-create-lbl">
        {label} {required && <span className="req">*</span>}
      </label>
    )}
    {children}
    {touched && error && <p className="ag-create-err">{error}</p>}
  </div>
);

export const FormInput = ({
  label, required, name, type = "text", placeholder,
  value, onChange, onBlur, error, touched, disabled, className = "",
}) => (
  <FormField label={label} required={required} error={error} touched={touched}>
    <input
      className={`ag-create-input${touched && error ? " err" : ""} ${className}`}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
    />
  </FormField>
);

export const FormSelect = ({
  label, required, name, options = [],
  value, onChange, onBlur, error, touched, disabled,
}) => (
  <FormField label={label} required={required} error={error} touched={touched}>
    <select
      className={`ag-create-input${touched && error ? " err" : ""}`}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </FormField>
);

export const FormTextarea = ({
  label, required, name, placeholder, rows = 3,
  value, onChange, onBlur, error, touched, disabled,
}) => (
  <FormField label={label} required={required} error={error} touched={touched}>
    <textarea
      className={`ag-create-input ag-create-textarea${touched && error ? " err" : ""}`}
      name={name}
      placeholder={placeholder}
      rows={rows}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
    />
  </FormField>
);

export const ToggleField = ({ label, checked, onChange }) => (
  <div className="ag-create-field" style={{ marginTop: 14 }}>
    {label && <label className="ag-create-lbl">{label}</label>}
    <div
      onClick={onChange}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}
    >
      <div className={`um-toggle ${checked ? "on" : ""}`}>
        <div className="um-toggle-knob" />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: checked ? "var(--success-fg)" : "var(--danger-fg)" }}>
        {checked ? "Active" : "Inactive"}
      </span>
    </div>
  </div>
);
