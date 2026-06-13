import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate   = useNavigate();
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState("");
  const [resetLink, setResetLink] = useState("");

  const submit = async () => {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("https://fyp2-backend-gihc.onrender.com/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || "Something went wrong");
      } else {
        setResetLink(data.resetLink || "");
        setSent(true);
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, sans-serif" }}>

      {/* LEFT branding */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 40px"
      }} className="hidden md:flex">
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 28, fontWeight: 800, color: "white", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>AI</div>
          <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, margin: "0 0 16px" }}>Account Recovery</h1>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            Enter your registered email and we'll generate a secure link to reset your password.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {[
              { icon: "🔐", text: "Secure password reset link" },
              { icon: "⏱️", text: "Reset link expires in 1 hour" },
              { icon: "✅", text: "Your data stays safe and encrypted" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT form */}
      <div style={{ width: "100%", maxWidth: 480, background: "#0f172a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>AI</div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>AI Recruit</span>
        </div>

        {!sent ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>Forgot Password?</h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Enter your email to get a reset link.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>Email Address</label>
                <input
                  type="email" placeholder="you@example.com" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  style={{
                    width: "100%", background: "#1e293b",
                    border: error ? "1px solid #ef4444" : "1px solid #334155",
                    borderRadius: 10, padding: "12px 16px", color: "white", fontSize: 14,
                    outline: "none", boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = error ? "#ef4444" : "#334155"}
                />
                {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>⚠️ {error}</div>}
              </div>

              <button onClick={submit} disabled={loading} style={{
                width: "100%",
                background: loading ? "#4b5563" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "white", border: "none", borderRadius: 10, padding: "13px",
                fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                    Generating link...
                  </>
                ) : "Get Reset Link →"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🔗</div>
            <h3 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Reset Link Ready!</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
              Click the button below to reset your password for<br />
              <strong style={{ color: "white" }}>{email}</strong>
            </p>
            {resetLink && (
              <a href={resetLink} style={{
                display: "block",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "white", textDecoration: "none",
                padding: "13px", borderRadius: 10,
                fontSize: 15, fontWeight: 600,
                marginBottom: 16
              }}>
                Reset My Password →
              </a>
            )}
            <p style={{ color: "#475569", fontSize: 11 }}>This link expires in 1 hour.</p>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <span onClick={() => navigate("/")} style={{ color: "#60a5fa", fontSize: 14, cursor: "pointer" }}>
            ← Back to Login
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default ForgotPassword;
