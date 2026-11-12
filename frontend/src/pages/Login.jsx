
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Building2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const loggedInUser = await login(
        email.trim().toLowerCase(),
        password
      );

      if (loggedInUser.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-icon">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h2>VisitPro</h2>
            <span>Visitor Management System</span>
          </div>
        </div>

        <div className="login-illustration">
          <div className="illustration-icon">
            <Building2 size={65} />
          </div>

          <h1>Welcome to smarter visitor management.</h1>

          <p>
            Manage visitor registrations, approvals, appointments
            and secure office entry from one place.
          </p>

          <div className="login-features">
            <span><ShieldCheck size={17} /> Secure Access</span>
            <span><ShieldCheck size={17} /> Real-time Tracking</span>
            <span><ShieldCheck size={17} /> Smart Visitor Passes</span>
          </div>
        </div>

        <div className="login-footer">
          © {new Date().getFullYear()} VisitPro. All rights reserved.
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <div className="mobile-brand">
            <ShieldCheck size={30} />
            <h2>VisitPro</h2>
          </div>

          <div className="login-heading">
            <span className="login-welcome">WELCOME BACK</span>
            <h1>Sign in to your account</h1>
            <p>Enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email">Email Address</label>

              <div className="login-input-wrapper">
                <Mail size={19} />

                <input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>

              <div className="login-input-wrapper">
                <Lock size={19} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="login-security">
            <ShieldCheck size={17} />
            <span>Your account is protected with secure authentication.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
