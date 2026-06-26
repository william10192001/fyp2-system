import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE = "https://fyp2-backend-gihc.onrender.com";

function ForgotPassword() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("mfa");

  /* ── Tab 1: MFA OTP flow ── */
  const [step,        setStep]        = useState(1);
  const [mfaEmail,    setMfaEmail]    = useState("");
  const [otp,         setOtp]         = useState(["","","","","",""]);
  const [resetToken,  setResetToken]  = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [mfaLoading,  setMfaLoading]  = useState(false);
  const [mfaError,    setMfaError]    = useState("");
  const [mfaDone,     setMfaDone]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendTimer(60);
    const t = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!mfaEmail.trim()) { setMfaError("Please enter your email address"); return; }
    setMfaError(""); setMfaLoading(true);
    try {
      const res  = await fetch(`${BASE}/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mfaEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setMfaError(data.msg || "Failed to send code");
      } else {
        setStep(2);
        startResendTimer();
      }
    } catch { setMfaError("Cannot connect to server. Please try again."); }
    setMfaLoading(false);
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setMfaError("Please enter the complete 6-digit code"); return; }
    setMfaError(""); setMfaLoading(true);
    try {
      const res  = await fetch(`${BASE}/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mfaEmail.trim(), otp: code })
      });
      const data = await res.json();
      if (!res.ok) { setMfaError(data.msg || "Invalid or expired code. Please request a new one."); }
      else { setResetToken(data.resetToken); setStep(3); }
    } catch { setMfaError("Cannot connect to server."); }
    setMfaLoading(false);
  };

  const submitNewPass = async () => {
    if (newPass.length < 6) { setMfaError("Password must be at least 6 characters"); return; }
    if (newPass !== confirmPass) { setMfaError("Passwords do not match"); return; }
    setMfaError(""); setMfaLoading(true);
    try {
      const res  = await fetch(`${BASE}/reset-password/${resetToken}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPass })
      });
      const data = await res.json();
      if (!res.ok) { setMfaError(data.msg || "Reset failed"); }
      else { setMfaDone(true); setTimeout(() => navigate("/"), 2500); }
    } catch { setMfaError("Cannot connect to server."); }
    setMfaLoading(false);
  };

  const handleOtpInput = (val, idx) => {
    const next = [...otp];
    next[idx] = val.replace(/\D/g, "").slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus();
    setMfaError("");
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) document.getElementById(`otp-${idx-1}`)?.focus();
    if (e.key === "Enter") verifyOtp();
  };

  /* ── Tab 2: Change with old password ── */
  const [changeEmail,   setChangeEmail]   = useState("");
  const [oldPass,       setOldPass]       = useState("");
  const [chNewPass,     setChNewPass]     = useState("");
  const [chConfirm,     setChConfirm]     = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeDone,    setChangeDone]    = useState(false);
  const [changeError,   setChangeError]   = useState("");
  const [showOld,       setShowOld]       = useState(false);
  const [showChNew,     setShowChNew]     = useState(false);

  const submitChange = async () => {
    if (!changeEmail || !oldPass || !chNewPass || !chConfirm) { setChangeError("All fields are required"); return; }
    if (chNewPass.length < 6)    { setChangeError("New password must be at least 6 characters"); return; }
    if (chNewPass !== chConfirm) { setChangeError("Passwords do not match"); return; }
    setChangeError(""); setChangeLoading(true);
    try {
      const res  = await fetch(`${BASE}/change-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: changeEmail.trim(), oldPassword: oldPass, newPassword: chNewPass })
      });
      const data = await res.json();
      if (!res.ok) { setChangeError(data.msg || "Change failed"); }
      else { setChangeDone(true); setTimeout(() => navigate("/"), 2500); }
    } catch { setChangeError("Cannot connect to server."); }
    setChangeLoading(false);
  };

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3;
  const strengthColor = ["", "#ef4444", "#f59e0b", "#10b981"][strength];
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];

  const iStyle = {
    width: "100%", background: "#1e293b", border: "1px solid #334155",
    borderRadius: 10, padding: "12px 16px", color: "white", fontSize: 14,
    outline: "none", boxSizing: "border-box"
  };
  const iStyleRel = { ...iStyle, padding: "12px 44px 12px 16px" };

  const EyeBtn = ({ show, toggle }) => (
    <button onClick={toggle} type="button" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" }}>
      {show ? "🙈" : "👁️"}
    </button>
  );

  const Spinner = () => (
    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, sans-serif" }}>

      {/* LEFT branding */}
      <div style={{ flex: 1, background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#312e81 100%)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 40px" }} className="hidden md:flex">
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 28, fontWeight: 800, color: "white", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>AI</div>
          <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, margin: "0 0 16px" }}>Account Recovery</h1>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            Secure your account with email verification or change via old password.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {[
              { icon: "📧", text: "6-digit code sent to your email" },
              { icon: "⏱️", text: "Code expires in 10 minutes" },
              { icon: "🔑", text: "Or change using old password — no email needed" },
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
      <div style={{ width: "100%", maxWidth: 500, background: "#0f172a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px", overflowY: "auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>AI</div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>AI Recruit</span>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "#1e293b", borderRadius: 12, padding: 4, marginBottom: 32 }}>
          {[{ key: "mfa", label: "📧 Email Code" }, { key: "change", label: "🔑 Change Password" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "10px", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: tab === t.key ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "transparent",
              color: tab === t.key ? "white" : "#64748b", transition: "all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>

        {/* ══ TAB 1: OTP ══ */}
        {tab === "mfa" && (
          <>
            {mfaDone ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h3 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Password Reset!</h3>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>Redirecting to login...</p>
              </div>
            ) : (
              <>
                {/* Step indicator */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
                  {[{ n: 1, label: "Email" }, { n: 2, label: "Code" }, { n: 3, label: "New Password" }].map((s, i) => (
                    <React.Fragment key={s.n}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                          background: step > s.n ? "#10b981" : step === s.n ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "#1e293b",
                          color: step >= s.n ? "white" : "#475569",
                          border: step < s.n ? "1px solid #334155" : "none"
                        }}>{step > s.n ? "✓" : s.n}</div>
                        <span style={{ fontSize: 10, color: step === s.n ? "#60a5fa" : "#475569" }}>{s.label}</span>
                      </div>
                      {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? "#10b981" : "#1f2937", margin: "0 4px", marginBottom: 18 }} />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 1: Email */}
                {step === 1 && (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Forgot Password?</h2>
                      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Enter your email and we'll send a 6-digit verification code.</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>Email Address</label>
                        <input type="email" placeholder="you@example.com" value={mfaEmail}
                          onChange={e => { setMfaEmail(e.target.value); setMfaError(""); }}
                          onKeyDown={e => e.key === "Enter" && sendOtp()}
                          style={iStyle}
                          onFocus={e => e.target.style.borderColor = "#2563eb"}
                          onBlur={e => e.target.style.borderColor = "#334155"}
                        />
                      </div>
                      {mfaError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>⚠️ {mfaError}</div>}
                      <button onClick={sendOtp} disabled={mfaLoading} style={{
                        width: "100%", background: mfaLoading ? "#334155" : "linear-gradient(135deg,#2563eb,#7c3aed)",
                        color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600,
                        cursor: mfaLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                      }}>
                        {mfaLoading ? <><Spinner />Sending...</> : "Send Verification Code →"}
                      </button>
                    </div>
                  </>
                )}

                {/* Step 2: Enter OTP */}
                {step === 2 && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Check Your Email</h2>
                      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                        We sent a 6-digit code to <strong style={{ color: "#60a5fa" }}>{mfaEmail}</strong>
                      </p>
                      <p style={{ color: "#475569", fontSize: 12, margin: "6px 0 0" }}>
                        Check your inbox and spam folder. Code expires in 10 minutes.
                      </p>
                    </div>

                    {/* Info box */}
                    <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: "#94a3b8" }}>
                      💡 Didn't receive the code? Check spam folder, then click <strong style={{ color: "#60a5fa" }}>Resend</strong>. If email still doesn't arrive, use the <strong style={{ color: "#60a5fa" }}>🔑 Change Password</strong> tab instead.
                    </div>

                    {/* OTP boxes */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
                      {otp.map((digit, idx) => (
                        <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric"
                          maxLength={1} value={digit}
                          onChange={e => handleOtpInput(e.target.value, idx)}
                          onKeyDown={e => handleOtpKey(e, idx)}
                          style={{
                            width: 52, height: 60, textAlign: "center", fontSize: 24, fontWeight: 700,
                            background: digit ? "rgba(37,99,235,0.15)" : "#1e293b",
                            border: digit ? "2px solid #2563eb" : "2px solid #334155",
                            borderRadius: 10, color: "white", outline: "none", transition: "all 0.15s"
                          }}
                        />
                      ))}
                    </div>

                    {mfaError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>⚠️ {mfaError}</div>}

                    <button onClick={verifyOtp} disabled={mfaLoading || otp.join("").length < 6} style={{
                      width: "100%", background: (mfaLoading || otp.join("").length < 6) ? "#334155" : "linear-gradient(135deg,#2563eb,#7c3aed)",
                      color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600,
                      cursor: (mfaLoading || otp.join("").length < 6) ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16
                    }}>
                      {mfaLoading ? <><Spinner />Verifying...</> : "Verify Code →"}
                    </button>

                    <div style={{ textAlign: "center" }}>
                      {resendTimer > 0
                        ? <span style={{ color: "#475569", fontSize: 13 }}>Resend code in {resendTimer}s</span>
                        : <button onClick={sendOtp} style={{ color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Resend Code</button>
                      }
                    </div>
                  </>
                )}

                {/* Step 3: New password */}
                {step === 3 && (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>🔑</div>
                      <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Set New Password</h2>
                      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Code verified! Choose a strong new password.</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>New Password</label>
                        <div style={{ position: "relative" }}>
                          <input type={showNew ? "text" : "password"} placeholder="At least 6 characters" value={newPass}
                            onChange={e => { setNewPass(e.target.value); setMfaError(""); }}
                            style={iStyleRel}
                            onFocus={e => e.target.style.borderColor = "#2563eb"}
                            onBlur={e => e.target.style.borderColor = "#334155"}
                          />
                          <EyeBtn show={showNew} toggle={() => setShowNew(!showNew)} />
                        </div>
                        {newPass.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                              {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strengthColor : "#1e293b", transition: "background 0.3s" }} />)}
                            </div>
                            <span style={{ fontSize: 11, color: strengthColor }}>{strengthLabel} password</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>Confirm Password</label>
                        <input type="password" placeholder="Re-enter password" value={confirmPass}
                          onChange={e => { setConfirmPass(e.target.value); setMfaError(""); }}
                          onKeyDown={e => e.key === "Enter" && submitNewPass()}
                          style={{ ...iStyle, borderColor: confirmPass && confirmPass !== newPass ? "#ef4444" : "#334155" }}
                          onFocus={e => e.target.style.borderColor = "#2563eb"}
                          onBlur={e => e.target.style.borderColor = confirmPass && confirmPass !== newPass ? "#ef4444" : "#334155"}
                        />
                        {confirmPass && newPass !== confirmPass && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>⚠️ Passwords don't match</div>}
                        {confirmPass && newPass === confirmPass && <div style={{ color: "#34d399", fontSize: 12, marginTop: 5 }}>✅ Passwords match</div>}
                      </div>
                      {mfaError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>⚠️ {mfaError}</div>}
                      <button onClick={submitNewPass} disabled={mfaLoading} style={{
                        width: "100%", background: mfaLoading ? "#334155" : "linear-gradient(135deg,#2563eb,#7c3aed)",
                        color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600,
                        cursor: mfaLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                      }}>
                        {mfaLoading ? <><Spinner />Resetting...</> : "Reset Password →"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ══ TAB 2: Change with old password ══ */}
        {tab === "change" && (
          <>
            {changeDone ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h3 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Password Changed!</h3>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>Redirecting to login...</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Change Password</h2>
                  <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Enter your old password to set a new one. No email needed.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={changeEmail}
                      onChange={e => { setChangeEmail(e.target.value); setChangeError(""); }}
                      style={iStyle}
                      onFocus={e => e.target.style.borderColor = "#2563eb"}
                      onBlur={e => e.target.style.borderColor = "#334155"}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Current Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showOld ? "text" : "password"} placeholder="Your current password" value={oldPass}
                        onChange={e => { setOldPass(e.target.value); setChangeError(""); }}
                        style={iStyleRel}
                        onFocus={e => e.target.style.borderColor = "#2563eb"}
                        onBlur={e => e.target.style.borderColor = "#334155"}
                      />
                      <EyeBtn show={showOld} toggle={() => setShowOld(!showOld)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>New Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showChNew ? "text" : "password"} placeholder="At least 6 characters" value={chNewPass}
                        onChange={e => { setChNewPass(e.target.value); setChangeError(""); }}
                        style={iStyleRel}
                        onFocus={e => e.target.style.borderColor = "#2563eb"}
                        onBlur={e => e.target.style.borderColor = "#334155"}
                      />
                      <EyeBtn show={showChNew} toggle={() => setShowChNew(!showChNew)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Confirm New Password</label>
                    <input type="password" placeholder="Re-enter new password" value={chConfirm}
                      onChange={e => { setChConfirm(e.target.value); setChangeError(""); }}
                      onKeyDown={e => e.key === "Enter" && submitChange()}
                      style={{ ...iStyle, borderColor: chConfirm && chConfirm !== chNewPass ? "#ef4444" : "#334155" }}
                    />
                    {chConfirm && chNewPass !== chConfirm && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>⚠️ Passwords don't match</div>}
                    {chConfirm && chNewPass === chConfirm && chConfirm.length > 0 && <div style={{ color: "#34d399", fontSize: 12, marginTop: 5 }}>✅ Passwords match</div>}
                  </div>
                  {changeError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>⚠️ {changeError}</div>}
                  <button onClick={submitChange} disabled={changeLoading} style={{
                    width: "100%", background: changeLoading ? "#334155" : "linear-gradient(135deg,#2563eb,#7c3aed)",
                    color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600,
                    cursor: changeLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}>
                    {changeLoading ? <><Spinner />Changing...</> : "Change Password →"}
                  </button>
                </div>
              </>
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
