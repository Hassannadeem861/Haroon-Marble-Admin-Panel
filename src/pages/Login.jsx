import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Alert, Row, Col, Typography } from "antd";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginAsync } from "../store/services/authService.js";
import { setLoginStatus } from "../store/slices/authSlice.js";
import { asyncStatus } from "../utils/asyncStatus";
import "./style.css";

const { Title, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { login_status, login_error } = useSelector((state) => state.auth);
  const loading = login_status === asyncStatus.LOADING;

  useEffect(() => {
    if (login_status === asyncStatus.SUCCEEDED) {
      navigate("/dashboard", { replace: true });
      dispatch(setLoginStatus());
    }
  }, [login_status, navigate, dispatch]);

  const handleFinish = (values) => {
    dispatch(loginAsync({ email: values.email.trim(), password: values.password }));
  };

  return (
    <div className="login-root">
      <Row className="login-row">
        {/* ── LEFT — Form ── */}
        <Col xs={24} md={12} className="login-left">
          <div className="login-form-box">
            <Title level={2} className="login-title">
              Welcome Back
            </Title>
            <Text className="login-subtitle">Sign in to your Haroon Marble admin account.</Text>

            {login_error && (
              <Alert
                type="error"
                showIcon
                message={typeof login_error === "string" ? login_error : "Login failed"}
                className="login-error-banner"
              />
            )}

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={handleFinish}
              className="login-form"
              disabled={loading}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Enter a valid email address" },
                ]}
              >
                <Input
                  size="large"
                  prefix={<Mail size={16} />}
                  placeholder="info@gmail.com"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Password is required" }]}
              >
                <Input.Password
                  size="large"
                  prefix={<Lock size={16} />}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  iconRender={(visible) => (visible ? <EyeOff size={16} /> : <Eye size={16} />)}
                />
              </Form.Item>

              <Form.Item className="login-submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  className="login-submit-btn"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Col>

        {/* ── RIGHT — Brand (hidden on mobile/tablet) ── */}
        <Col md={12} className="login-right">
          <div className="login-dots" aria-hidden="true" />
          <div className="login-brand">
            {/* <img src="/haroon-marbles-logo.png" alt="Haroon Marble" className="login-logo" /> */}
            <div className="login-brand-title">
              Haroon Marble
              <span>Admin Panel</span>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Login;