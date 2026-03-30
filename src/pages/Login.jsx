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

      localStorage.setItem("token", res.data.access_token); // ✅ match what authAxios expects
      localStorage.setItem("refresh_token", res.data.refresh_token);
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
      // Use form data (URLSearchParams) as backend expects Form(...) not JSON!
      const formData = new URLSearchParams();
      formData.append("email", resetEmail);

      await authAxios.post("/forgot-password", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setResetMsg("Reset link sent to your email.");
    } catch (err) {
      setResetErr("Failed to send reset email.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "linear-gradient(135deg, #0f2744 0%, #1a3254 45%, #00896d 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: "absolute",
        top: "-10%",
        right: "-5%",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "rgba(0,160,130,0.12)",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-15%",
        left: "-5%",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "rgba(30,58,95,0.4)",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 440,
        width: "calc(100% - 32px)",
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        padding: "48px 40px",
        borderRadius: 24,
        boxShadow: "0 32px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo area */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "linear-gradient(135deg, #0f2744, #00A082)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 8px 24px rgba(0,160,130,0.35)",
        }}>
          <img src="/glopi.png" alt="logo" style={{ height: 40, borderRadius: 8 }} />
        </div>

        <h2 style={{
          fontWeight: 800,
          color: "#0f2744",
          letterSpacing: -0.5,
          marginBottom: 6,
          marginTop: 0,
          fontSize: 26,
          textAlign: "center",
        }}>
          OPS Watcher
        </h2>
        <p style={{
          color: "#5a6a7e",
          fontSize: 14,
          marginTop: 0,
          marginBottom: 28,
          textAlign: "center",
        }}>
          Connectez-vous à votre espace admin
        </p>
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
  marginBottom: 14,
  padding: "13px 16px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 10,
  fontSize: 15,
  outline: "none",
  background: "#f8fafc",
  color: "#1a2332",
  WebkitTextFillColor: "#1a2332",
  fontFamily: "'Montserrat', sans-serif",
  fontWeight: 500,
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const buttonStyle = {
  width: "100%",
  padding: "13px",
  background: "linear-gradient(135deg, #00A082 0%, #007a63 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  transition: "all 0.2s",
  marginBottom: 6,
  fontFamily: "'Montserrat', sans-serif",
  letterSpacing: 0.3,
  boxShadow: "0 4px 14px rgba(0,160,130,0.35)",
};

const forgotButtonStyle = {
  background: "none",
  border: "none",
  color: "#00A082",
  textDecoration: "none",
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
  fontFamily: "'Montserrat', sans-serif",
  fontWeight: 600,
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 20,
};

const modalStyle = {
  minWidth: 340,
  background: "#fff",
  borderRadius: 20,
  boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
  padding: "36px 28px 28px",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const closeBtnStyle = {
  position: "absolute",
  right: 14,
  top: 14,
  background: "#f1f5f9",
  border: "none",
  width: 30,
  height: 30,
  borderRadius: "50%",
  fontSize: 16,
  color: "#5a6a7e",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

export default Login;