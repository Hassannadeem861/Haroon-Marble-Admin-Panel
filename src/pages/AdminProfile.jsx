import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, User, Lock, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { getInitials } from "../utils/helperFunctions.jsx";
import "./AdminProfile.css";

// ── Password strength helper ──────────────────────────────
const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)       score++;
  if (/[A-Z]/.test(pw))     score++;
  if (/[0-9]/.test(pw))     score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthClass = ["", "filled-1", "filled-2", "filled-3", "filled-4"];

const AdminProfile = () => {
  const { user_data } = useSelector(s => s.auth);

  // ── Profile form state
  const [profile, setProfile] = useState({
    name:  user_data?.name  || "",
    email: user_data?.email || "",
    phone: user_data?.phone || "123323232323",
  });
  const [profileMsg,  setProfileMsg]  = useState(null); // { type: 'success'|'error', text }
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password form state
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwShow,  setPwShow]  = useState({ current: false, newPw: false, confirm: false });
  const [pwMsg,   setPwMsg]   = useState(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const strength = getStrength(pwForm.newPw);

  // ── Handlers ─────────────────────────────────────────────
  const handleProfileChange = (e) => {
    setProfile(p => ({ ...p, [e.target.name]: e.target.value }));
    setProfileMsg(null);
  };

  const handleProfileSave = async () => {
    if (!profile.name.trim()) {
      setProfileMsg({ type: "error", text: "Name is required." });
      return;
    }
    setProfileSaving(true);
    // TODO: dispatch(updateAdminProfileAsync(profile))
    await new Promise(r => setTimeout(r, 700));
    setProfileSaving(false);
    setProfileMsg({ type: "success", text: "Profile updated successfully." });
  };

  const handlePwChange = (e) => {
    setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setPwErrors({});
    setPwMsg(null);
  };

  const validatePw = () => {
    const errs = {};
    if (!pwForm.current) errs.current = "Current password is required.";
    if (!pwForm.newPw || pwForm.newPw.length < 8) errs.newPw = "Min 8 characters required.";
    if (pwForm.newPw !== pwForm.confirm) errs.confirm = "Passwords do not match.";
    return errs;
  };

  const handlePwSave = async () => {
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwSaving(true);
    // TODO: dispatch(updateAdminPasswordAsync({ currentPassword: pwForm.current, newPassword: pwForm.newPw }))
    await new Promise(r => setTimeout(r, 700));
    setPwSaving(false);
    setPwForm({ current: "", newPw: "", confirm: "" });
    setPwMsg({ type: "success", text: "Password changed successfully." });
  };

  const toggleShow = (field) => setPwShow(p => ({ ...p, [field]: !p[field] }));

  return (
    <div className="ap-root">

      {/* ── HEADER ── */}
      <div className="ap-page-hd">
        <h1 className="ap-page-title">My Profile</h1>
        <p className="ap-page-sub">Manage your account details and security settings</p>
      </div>

      <div className="ap-grid">

        {/* ── PROFILE INFO ── */}
        <div className="ap-card ap-card-full">
          <div className="ap-card-hd">
            <div className="ap-card-icon"><User size={16} strokeWidth={2} /></div>
            <div>
              <div className="ap-card-title">Profile Information</div>
              <div className="ap-card-sub">Update your display name, email and phone</div>
            </div>
          </div>
          <div className="ap-card-body">

            {/* Avatar row */}
            <div className="ap-avatar-row">
              <div className="ap-avatar">{getInitials(profile.name || "S A")}</div>
              <div className="ap-avatar-info">
                <div className="ap-avatar-name">{profile.name || "Super Admin"}</div>
                <div className="ap-avatar-email">{profile.email}</div>
                <span className="ap-role-badge">
                  <Shield size={9} strokeWidth={2.5} />
                  {user_data?.role || "superAdmin"}
                </span>
              </div>
            </div>

            {profileMsg && (
              <div className={profileMsg.type === "success" ? "ap-success-banner" : "ap-error-banner"}>
                {profileMsg.type === "success"
                  ? <CheckCircle size={15} strokeWidth={2} />
                  : <AlertCircle size={15} strokeWidth={2} />}
                {profileMsg.text}
              </div>
            )}

            <div className="ap-form-row">
              <div className="ap-field">
                <label className="ap-label">Full Name</label>
                <input
                  className="ap-input"
                  name="name"
                  placeholder="Full name"
                  value={profile.name}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Phone</label>
                <input
                  className="ap-input"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={profile.phone}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="ap-field">
              <label className="ap-label">Email Address</label>
              <input
                className="ap-input"
                name="email"
                type="email"
                placeholder="admin@email.com"
                value={profile.email}
                onChange={handleProfileChange}
              />
            </div>

            <div className="ap-actions">
              <button className="ap-save-btn" onClick={handleProfileSave} disabled={profileSaving}>
                {profileSaving ? "Saving…" : "Save Changes"}
              </button>
              <button className="ap-cancel-btn" onClick={() => {
                setProfile({ name: user_data?.name || "", email: user_data?.email || "", phone: user_data?.phone || "" });
                setProfileMsg(null);
              }}>
                Reset
              </button>
            </div>

          </div>
        </div>

        {/* ── CHANGE PASSWORD ── */}
        <div className="ap-card ap-card-full">
          <div className="ap-card-hd">
            <div className="ap-card-icon"><Lock size={16} strokeWidth={2} /></div>
            <div>
              <div className="ap-card-title">Change Password</div>
              <div className="ap-card-sub">Keep your account secure with a strong password</div>
            </div>
          </div>
          <div className="ap-card-body">

            {pwMsg && (
              <div className={pwMsg.type === "success" ? "ap-success-banner" : "ap-error-banner"}>
                {pwMsg.type === "success"
                  ? <CheckCircle size={15} strokeWidth={2} />
                  : <AlertCircle size={15} strokeWidth={2} />}
                {pwMsg.text}
              </div>
            )}

            <div className="ap-field">
              <label className="ap-label">Current Password</label>
              <div className="ap-pw-wrap">
                <input
                  className={`ap-input ap-pw-input${pwErrors.current ? " ap-input-err" : ""}`}
                  name="current"
                  type={pwShow.current ? "text" : "password"}
                  placeholder="Enter current password"
                  value={pwForm.current}
                  onChange={handlePwChange}
                />
                <button className="ap-eye-btn" type="button" onClick={() => toggleShow("current")}>
                  {pwShow.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwErrors.current && <p className="ap-err-text">{pwErrors.current}</p>}
            </div>

            <div className="ap-form-row">
              <div className="ap-field">
                <label className="ap-label">New Password</label>
                <div className="ap-pw-wrap">
                  <input
                    className={`ap-input ap-pw-input${pwErrors.newPw ? " ap-input-err" : ""}`}
                    name="newPw"
                    type={pwShow.newPw ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={pwForm.newPw}
                    onChange={handlePwChange}
                  />
                  <button className="ap-eye-btn" type="button" onClick={() => toggleShow("newPw")}>
                    {pwShow.newPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwForm.newPw && (
                  <div className="ap-strength">
                    <div className="ap-strength-bar">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`ap-strength-seg${strength >= i ? ` ${strengthClass[strength]}` : ""}`}
                        />
                      ))}
                    </div>
                    <div className="ap-strength-label">{strengthLabel[strength]}</div>
                  </div>
                )}
                {pwErrors.newPw && <p className="ap-err-text">{pwErrors.newPw}</p>}
              </div>
              <div className="ap-field">
                <label className="ap-label">Confirm New Password</label>
                <div className="ap-pw-wrap">
                  <input
                    className={`ap-input ap-pw-input${pwErrors.confirm ? " ap-input-err" : ""}`}
                    name="confirm"
                    type={pwShow.confirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={pwForm.confirm}
                    onChange={handlePwChange}
                  />
                  <button className="ap-eye-btn" type="button" onClick={() => toggleShow("confirm")}>
                    {pwShow.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwErrors.confirm && <p className="ap-err-text">{pwErrors.confirm}</p>}
              </div>
            </div>

            <div className="ap-actions">
              <button className="ap-save-btn" onClick={handlePwSave} disabled={pwSaving}>
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
              <button className="ap-cancel-btn" onClick={() => {
                setPwForm({ current: "", newPw: "", confirm: "" });
                setPwErrors({});
                setPwMsg(null);
              }}>
                Clear
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;
