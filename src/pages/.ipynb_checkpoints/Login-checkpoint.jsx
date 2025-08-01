// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authAxios from "../utils/authAxios";

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await authAxios.post("/token", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("access_token", res.data.access_token);
      setIsAuthenticated(true); // <-- Fix: update state so Navbar appears
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Login failed. Please try again.");
      }
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setResetMsg("");
    setResetErr("");
    try {
      await authAxios.post("/forgot-password", { email: resetEmail });
      setResetMsg("Reset link sent to your email.");
    } catch (err) {
      setResetErr("Failed to send reset email.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "#f4f8fc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        maxWidth: 400,
        width: "100%",
        background: "#fff",
        padding: "36px 32px",
        borderRadius: 16,
        boxShadow: "0 4px 32px rgba(0,0,0,0.09)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h2 style={{
          fontWeight: 800,
          color: "#1565c0",
          letterSpacing: 1,
          marginBottom: 24,
          fontSize: 32,
          textAlign: "center"
        }}>
          Inspection Admin Login
        </h2>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            type="email"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>Login</button>
          {error && <p style={{ color: "red", marginTop: 12, textAlign: "center" }}>{error}</p>}
        </form>

        <div style={{ width: "100%", marginTop: 8, textAlign: "right" }}>
          <button
            type="button"
            style={forgotButtonStyle}
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </button>
        </div>

        {showForgot && (
          <div style={overlayStyle} onClick={() => setShowForgot(false)}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
              <button style={closeBtnStyle} onClick={() => setShowForgot(false)}>&times;</button>
              <h3 style={{ color: "#1565c0", marginBottom: 16, fontWeight: 700, fontSize: 22 }}>Reset Password</h3>
              <form onSubmit={handleForgotSubmit} style={{ width: "100%" }}>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={inputStyle}
                />
                <button type="submit" style={buttonStyle}>Send Reset Email</button>
                {resetMsg && <p style={{ color: "green", marginTop: 10, textAlign: "center" }}>{resetMsg}</p>}
                {resetErr && <p style={{ color: "red", marginTop: 10, textAlign: "center" }}>{resetErr}</p>}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable styles
const inputStyle = {
  width: "100%",
  marginBottom: 16,
  padding: "12px 14px",
  border: "1px solid #b5c4d6",
  borderRadius: 8,
  fontSize: 17,
  outline: "none",
  background: "#f6faff",
  color: "black",
  WebkitTextFillColor: "black",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#1565c0",
  color: "#fff",
  fontWeight: 700,
  fontSize: 17,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  transition: "background 0.2s",
  marginBottom: 6
};

const forgotButtonStyle = {
  background: "none",
  border: "none",
  color: "#1565c0",
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: 15,
  padding: 0
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.13)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 20
};

const modalStyle = {
  minWidth: 320,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
  padding: "32px 24px 24px 24px",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const closeBtnStyle = {
  position: "absolute",
  right: 10,
  top: 10,
  background: "none",
  border: "none",
  fontSize: 20,
  color: "#888",
  cursor: "pointer"
};

export default Login;
