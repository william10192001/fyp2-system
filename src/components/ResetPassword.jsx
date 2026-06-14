import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ResetPassword() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#10b981"][strength];

  const submit = async () => {
    if (!password)           { setError("Please enter a new password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`https://fyp2-backend-gihc.onrender.com/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.msg || "Reset failed. Link may have expired."); setLoading(false); return; }
      setDone(true);
    } catch { setError("Cannot connect to server. Please try again."); }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", background: "#1e293b", border: "1px solid #334155",
    borderRadius: 10, padding: "12px 44px 12px 16px", color: "white",
    fontSize: 14, outline: "none", boxSizing: "border-box"
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, sans-serif" }}>

      {/* LEFT: Branding */}
      <div style={{
        flex: 1, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 40px"
      }} className="hidden md:flex">
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 28, fontWeight: 800, color: "white", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>AI</div>
          <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, margin: "0 0 16px" }}>Secure Password Reset</h1>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            Choose a strong new password to keep your account safe.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {[
              { icon: "🔒", text: "Password is encrypted before saving" },
              { icon: "✅", text: "All active sessions will remain valid" },
              { icon: "🔑", text: "Use a mix of letters, numbers, symbols" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div style={{ width: "100%", maxWidth: 480, background: "#0f172a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>AI</div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>AI Recruit</span>
        </div>

        {!done ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
              <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>Set New Password</h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Choose a strong password for your account.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* New Password */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} placeholder="At least 6 characters" value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "#334155"}
                  />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strengthColor : "#1e293b", transition: "background 0.3s" }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: strengthColor }}>{strengthLabel} password</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showConfirm ? "text" : "password"} placeholder="Re-enter your password" value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    style={{ ...inputStyle, borderColor: confirm && confirm !== password ? "#ef4444" : "#334155" }}
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = confirm && confirm !== password ? "#ef4444" : "#334155"}
                  />
                  <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" }}>
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
                {confirm && password !== confirm && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>⚠️ Passwords don't match</div>}
                {confirm && password === confirm && confirm.length > 0 && <div style={{ color: "#34d399", fontSize: 12, marginTop: 6 }}>✅ Passwords match</div>}
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={submit} disabled={loading} style={{
                width: "100%", padding: "13px",
                background: loading ? "#334155" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                    Resetting...
                  </>
                ) : "Reset Password →"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
            <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Password Reset!</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Your password has been successfully updated.<br />You can now sign in with your new password.
            </p>
            <button onClick={() => navigate("/")} style={{
              width: "100%", padding: "13px",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer"
            }}>
              Sign In Now →
            </button>
          </div>
        )}

        <p style={{ color: "#1e293b", fontSize: 12, textAlign: "center", marginTop: 32 }}>
          © 2025 AI Recruit System · NLP-Based Secure Recruitment
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: #4b5563; }`}</style>
    </div>
  );
}

export default ResetPassword;
