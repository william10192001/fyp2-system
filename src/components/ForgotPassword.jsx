import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setError("");
    setLoading(true);
    try {
      let res;
      for (let i = 0; i < 3; i++) {
        try {
          res = await fetch("https://fyp2-backend-gihc.onrender.com/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim() })
          });
          break;
        } catch (err) {
          if (i === 2) throw err;
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      if (!res) { setError("Server is waking up, please try again in 15 seconds"); setLoading(false); return; }
      const data = await res.json();
      if (!res.ok) { setError(data.msg || "Something went wrong"); setLoading(false); return; }
      setSent(true);
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", fontFamily: "Inter, sans-serif",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)"
    }}>
      <div style={{ margin: "auto", width: "100%", maxWidth: 420, padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: "white", boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
            marginBottom: 16
          }}>AI</div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 18 }}>AI Recruit</div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "40px 36px"
        }}>
          {!sent ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>
                  Forgot Password?
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  No worries! Enter your email and we'll send you a reset link.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.08)", border: error ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12, padding: "13px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = error ? "#ef4444" : "rgba(255,255,255,0.15)"}
                />
                {error && (
                  <div style={{ color: "#f87171", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>

              <button
                onClick={submit}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white", borderRadius: "50%", display: "inline-block",
                      animation: "spin 0.8s linear infinite"
                    }}/>
                    Sending...
                  </>
                ) : "Send Reset Link →"}
              </button>

              <div style={{ textAlign: "center", marginTop: 24 }}>
                <span
                  onClick={() => navigate("/")}
                  style={{ color: "#60a5fa", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  ← Back to Sign In
                </span>
              </div>
            </>
          ) : (
            /* Success state */
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>📧</div>
              <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
                Check Your Email
              </h2>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, margin: "0 0 8px" }}>
                We sent a password reset link to:
              </p>
              <p style={{ color: "#60a5fa", fontWeight: 600, fontSize: 15, margin: "0 0 24px" }}>{email}</p>
              <div style={{
                background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)",
                borderRadius: 12, padding: "16px", marginBottom: 28, fontSize: 13, color: "#94a3b8", lineHeight: 1.6
              }}>
                💡 Didn't receive it? Check your spam folder or{" "}
                <span
                  onClick={() => setSent(false)}
                  style={{ color: "#60a5fa", cursor: "pointer", textDecoration: "underline" }}
                >
                  try again
                </span>
              </div>
              <button
                onClick={() => navigate("/")}
                style={{
                  width: "100%", padding: "13px",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer"
                }}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        <p style={{ color: "#475569", fontSize: 12, textAlign: "center", marginTop: 24 }}>
          © 2025 AI Recruit System · NLP-Based Secure Recruitment
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4b5563; }
      `}</style>
    </div>
  );
}

export default ForgotPassword;
