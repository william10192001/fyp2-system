import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE = "https://fyp2-backend-gihc.onrender.com";

function ForgotPassword() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("reset"); // "reset" | "change"

  // ── Tab 1: Forgot password (get reset link on page) ──
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent,    setResetSent]    = useState(false);
  const [resetLink,    setResetLink]    = useState("");
  const [resetError,   setResetError]   = useState("");

  const submitReset = async () => {
    if (!resetEmail.trim()) { setResetError("Please enter your email"); return; }
    setResetError(""); setResetLoading(true);
    try {
      const res  = await fetch(`${BASE}/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.msg || "Something went wrong"); }
      else         { setResetLink(data.resetLink || ""); setResetSent(true); }
    } catch { setResetError("Cannot connect to server. Please try again."); }
    setResetLoading(false);
  };

  // ── Tab 2: Change password with old password ──
  const [changeEmail,   setChangeEmail]   = useState("");
  const [oldPass,       setOldPass]       = useState("");
  const [newPass,       setNewPass]       = useState("");
  const [confirmPass,   setConfirmPass]   = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeDone,    setChangeDone]    = useState(false);
  const [changeError,   setChangeError]   = useState("");
  const [showOld,       setShowOld]       = useState(false);
  const [showNew,       setShowNew]       = useState(false);

  const submitChange = async () => {
    if (!changeEmail || !oldPass || !newPass || !confirmPass) { setChangeError("All fields are required"); return; }
    if (newPass.length < 6)   { setChangeError("New password must be at least 6 characters"); return; }
    if (newPass !== confirmPass) { setChangeError("New passwords do not match"); return; }
    setChangeError(""); setChangeLoading(true);
    try {
      const res  = await fetch(`${BASE}/change-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: changeEmail.trim(), oldPassword: oldPass, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok) { setChangeError(data.msg || "Change failed"); }
      else         { setChangeDone(true); setTimeout(() => navigate("/"), 2500); }
    } catch { setChangeError("Cannot connect to server. Please try again."); }
    setChangeLoading(false);
  };

  const inputStyle = {
    width: "100%", background: "#1e293b", border: "1px solid #334155",
    borderRadius: 10, padding: "12px 16px", color: "white",
    fontSize: 14, outline: "none", boxSizing: "border-box"
  };
  const inputRelStyle = { ...inputStyle, padding: "12px 44px 12px 16px" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, sans-serif" }}>

      {/* LEFT: Branding */}
      <div style={{
        flex: 1, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 40px"
      }} className="hidden md:flex">
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 28, fontWeight: 800, color: "white", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>AI</div>
          <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, margin: "0 0 16px" }}>Account Recovery</h1>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            Two ways to reset your password — by email link or by entering your old password directly.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {[
              { icon: "🔗", text: "Get reset link instantly on this page" },
              { icon: "🔑", text: "Change password using old password — no email needed" },
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

      {/* RIGHT: Form */}
      <div style={{ width: "100%", maxWidth: 500, background: "#0f172a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>AI</div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>AI Recruit</span>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", background: "#1e293b", borderRadius: 12, padding: 4, marginBottom: 32 }}>
          {[
            { key: "reset",  label: "🔗 Forgot Password" },
            { key: "change", label: "🔑 Change Password"  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "10px", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: tab === t.key ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "transparent",
              color: tab === t.key ? "white" : "#64748b",
              transition: "all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── TAB 1: Forgot Password (Get reset link) ── */}
        {tab === "reset" && (
          <>
            {!resetSent ? (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Forgot Password?</h2>
                  <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Enter your email and we'll generate a reset link for you instantly.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={resetEmail}
                      onChange={e => { setResetEmail(e.target.value); setResetError(""); }}
                      onKeyDown={e => e.key === "Enter" && submitReset()}
                      style={{ ...inputStyle, borderColor: resetError ? "#ef4444" : "#334155" }}
                      onFocus={e => e.target.style.borderColor = "#2563eb"}
                      onBlur={e => e.target.style.borderColor = resetError ? "#ef4444" : "#334155"}
                    />
                    {resetError && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>⚠️ {resetError}</div>}
                  </div>
                  <button onClick={submitReset} disabled={resetLoading} style={{
                    width: "100%", background: resetLoading ? "#334155" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                    color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600,
                    cursor: resetLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}>
                    {resetLoading ? (
                      <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Generating...</>
                    ) : "Get Reset Link →"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
                <h3 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Reset Link Ready!</h3>
                <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
                  Click the button below to reset your password for<br />
                  <strong style={{ color: "white" }}>{resetEmail}</strong>
                </p>
                {/* Direct link button — always shown */}
                {resetLink ? (
                  <a href={resetLink} style={{
                    display: "block", background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                    color: "white", textDecoration: "none", padding: "14px", borderRadius: 10,
                    fontSize: 15, fontWeight: 600, marginBottom: 12, textAlign: "center"
                  }}>
                    Reset My Password →
                  </a>
                ) : (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px", color: "#f87171", fontSize: 13, marginBottom: 12 }}>
                    ⚠️ Could not generate link. Please try the "Change Password" tab instead.
                  </div>
                )}
                <p style={{ color: "#475569", fontSize: 11, marginBottom: 16 }}>Link expires in 1 hour.</p>
                <button onClick={() => { setResetSent(false); setResetEmail(""); setResetLink(""); }} style={{
                  background: "#1e293b", color: "#94a3b8", border: "1px solid #334155",
                  borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer"
                }}>← Try another email</button>
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: Change Password with old password ── */}
        {tab === "change" && (
          <>
            {!changeDone ? (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Change Password</h2>
                  <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Enter your old password to set a new one. No email needed.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={changeEmail}
                      onChange={e => { setChangeEmail(e.target.value); setChangeError(""); }}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#2563eb"}
                      onBlur={e => e.target.style.borderColor = "#334155"}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Current Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showOld ? "text" : "password"} placeholder="Your current password" value={oldPass}
                        onChange={e => { setOldPass(e.target.value); setChangeError(""); }}
                        style={inputRelStyle}
                        onFocus={e => e.target.style.borderColor = "#2563eb"}
                        onBlur={e => e.target.style.borderColor = "#334155"}
                      />
                      <button onClick={() => setShowOld(!showOld)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" }}>
                        {showOld ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>New Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showNew ? "text" : "password"} placeholder="At least 6 characters" value={newPass}
                        onChange={e => { setNewPass(e.target.value); setChangeError(""); }}
                        style={inputRelStyle}
                        onFocus={e => e.target.style.borderColor = "#2563eb"}
                        onBlur={e => e.target.style.borderColor = "#334155"}
                      />
                      <button onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" }}>
                        {showNew ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Confirm New Password</label>
                    <input type="password" placeholder="Re-enter new password" value={confirmPass}
                      onChange={e => { setConfirmPass(e.target.value); setChangeError(""); }}
                      onKeyDown={e => e.key === "Enter" && submitChange()}
                      style={{ ...inputStyle, borderColor: confirmPass && confirmPass !== newPass ? "#ef4444" : "#334155" }}
                      onFocus={e => e.target.style.borderColor = "#2563eb"}
                      onBlur={e => e.target.style.borderColor = confirmPass && confirmPass !== newPass ? "#ef4444" : "#334155"}
                    />
                    {confirmPass && newPass !== confirmPass && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>⚠️ Passwords don't match</div>}
                    {confirmPass && newPass === confirmPass && confirmPass.length > 0 && <div style={{ color: "#34d399", fontSize: 12, marginTop: 5 }}>✅ Passwords match</div>}
                  </div>

                  {changeError && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
                      ⚠️ {changeError}
                    </div>
                  )}

                  <button onClick={submitChange} disabled={changeLoading} style={{
                    width: "100%", background: changeLoading ? "#334155" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                    color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600,
                    cursor: changeLoading ? "not-allowed" : "pointer", marginTop: 4,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}>
                    {changeLoading ? (
                      <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Changing...</>
                    ) : "Change Password →"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h3 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Password Changed!</h3>
                <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Redirecting to login page...</p>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <span onClick={() => navigate("/")} style={{ color: "#60a5fa", fontSize: 14, cursor: "pointer" }}>← Back to Login</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: #4b5563; }`}</style>
    </div>
  );
}

export default ForgotPassword;
