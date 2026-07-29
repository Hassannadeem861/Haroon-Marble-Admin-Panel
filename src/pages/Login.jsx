import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik } from "formik";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginAsync } from "../store/services/authService.js";
import { setLoginStatus } from "../store/slices/authSlice.js";
import { asyncStatus } from "../utils/asyncStatus";
import { getValidationSchema } from "../utils/validationSchema.js";
import { ButtonLoader } from "../components/Loading.jsx";
import './style.css'

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { login_status, login_error } = useSelector((state) => state.auth);
  const loader = login_status === asyncStatus.LOADING;

  useEffect(() => {
    if (login_status === asyncStatus.SUCCEEDED) {
      navigate("/dashboard", { replace: true });
      dispatch(setLoginStatus());
    }
  }, [login_status]);

  const initialValues = {
    email: "",
    password: "",
    // role: "super_admin",
  };

  const handleLogin = (values) => {
    dispatch(loginAsync({ email: values.email, password: values.password }));
  };

  return (
    <>
      <div className="root">

        {/* ── LEFT — Form ── */}
        <div className="left">
          <div className="form-box">
            <h1 className="title">Welcome Back</h1>
            <p className="subtitle">Sign in to your Haroon Marble admin account.</p>

            {/* API Error Banner */}
            {login_error && (
              <div className="error-banner">
                <AlertCircle size={15} />
                {login_error}
              </div>
            )}

            <Formik
              initialValues={initialValues}
              validationSchema={getValidationSchema('login')}
              onSubmit={handleLogin}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <form onSubmit={handleSubmit}>

                  {/* Role */}
                  {/* <div className="field">
                    <label className="label">
                      Role <span className="req">*</span>
                    </label>
                    <select
                      name="role"
                      className="input"
                      value={values.role}
                      onChange={handleChange("role")}
                      onBlur={handleBlur("role")}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="location_manager">Location Manager</option>
                    </select>
                  </div> */}

                  {/* Email */}
                  <div className="field">
                    <label className="label">
                      Email <span className="req">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="info@gmail.com"
                      className={`input ${touched.email && errors.email ? "input-err" : ""}`}
                      value={values.email}
                      onChange={handleChange("email")}
                      onBlur={handleBlur("email")}
                      disabled={loader}
                    />
                    {touched.email && errors.email && (
                      <p className="err-text">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="field">
                    <label className="label">
                      Password <span className="req">*</span>
                    </label>
                    <div className="pw-wrap">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className={`input pw-input ${touched.password && errors.password ? "input-err" : ""}`}
                        value={values.password}
                        onChange={handleChange("password")}
                        onBlur={handleBlur("password")}
                      disabled={loader}
                      />
                      <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword((p) => !p)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="err-text">{errors.password}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loader}
                  >
                    {loader ? (
                      <span className="btn-inner">
                        <ButtonLoader size={18} color="#ffffff" />
                        <span>Signing in...</span>
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </button>

                </form>
              )}
            </Formik>
          </div>
        </div>

        {/* ── RIGHT — Brand ── */}
        <div className="right">
          <div className="dots" />
          <div className="right-brand">
            <div className="right-icon">
              <img src="/logo.png" alt="Haroon Marble" style={{ width: 150, height: 150, objectFit: "contain" }} />
            </div>
            <div className="right-title">
              Haroon Marble
              <span>Admin Panel</span>
            </div>
            {/* <p className="right-tagline">Connect top agents with the right clients — manage your platform with ease.</p>
            <div className="right-pills">
              <div className="right-pill"><span className="right-pill-dot" />Manage Agents &amp; Clients</div>
              <div className="right-pill"><span className="right-pill-dot" />Monitor Compatibility Matches</div>
              <div className="right-pill"><span className="right-pill-dot" />Real-time Platform Insights</div>
            </div> */}
          </div>
        </div>

      </div>
    </>
  );
};


export default Login;