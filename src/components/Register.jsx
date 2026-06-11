import React, { useState } from "react";

function Register({ onRegister, goLogin }) {
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role,            setRole]            = useState("candidate");
  const [loading,         setLoading]         = useState(false);

  const submit = async () => {
    if (!email || !password)             { alert("Please fill in all fields"); return; }
    if (password.length < 6)             { alert("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword)    { alert("Passwords do not match ❌"); return; }
    setLoading(true);
    await onRegister({ email, password, role });
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "Inter, sans-serif"
    }}>
      {/* LEFT: Branding panel */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 40px"
      }} className="hidden md:flex">
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 28, fontWeight: 800, color: "white", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>AI</div>
          <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, margin: "0 0 16px" }}>Start Your Journey Today</h1>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, margin: "0 0 40px" }}>
            Join thousands of job seekers and employers using AI to make smarter hiring decisions.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { icon: "🎓", label: "For Graduates" },
              { icon: "💼", label: "For Professionals" },
              { icon: "🏢", label: "For Companies" },
              { icon: "🤖", label: "AI-Powered" },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Register form */}
      <div style={{ width: "100%", maxWidth: 500, background: "#0f172a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px", overflowY: "auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>AI</div>
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>AI Recruit</span>
          </div>
          <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>Create your account</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Free forever. No credit card required.</p>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 10 }}>I am joining as a...</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { value: "candidate", icon: "🧑‍💻", title: "Job Seeker", desc: "Find jobs that match my skills" },
              { value: "employer",  icon: "🏢",   title: "Employer",   desc: "Find the right candidates" },
            ].map(opt => (
              <div key={opt.value} onClick={() => setRole(opt.value)} style={{
                padding: "16px 14px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                border: role === opt.value ? "2px solid #2563eb" : "2px solid #1e293b",
                background: role === opt.value ? "rgba(37,99,235,0.12)" : "#1e293b",
                transition: "all 0.2s"
              }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{opt.icon}</div>
                <div style={{ color: role === opt.value ? "#60a5fa" : "white", fontSize: 13, fontWeight: 600 }}>{opt.title}</div>
                <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "#334155"} />
          </div>

          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Password</label>
            <input type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "#334155"} />
          </div>

          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 7 }}>Confirm Password</label>
            <input type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "#334155"} />
          </div>

          <button onClick={submit} disabled={loading} style={{
            width: "100%", background: loading ? "#4b5563" : "linear-gradient(135deg, #2563eb, #7c3aed)",
            color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: 15,
            fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: 4
          }}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </div>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span style={{ color: "#64748b", fontSize: 14 }}>Already have an account? </span>
          <span onClick={goLogin} style={{ color: "#60a5fa", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
        </div>
      </div>
    </div>
  );
}

export default Register;
