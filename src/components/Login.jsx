import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!email || !password) { alert("Please fill in all fields"); return; }
    setLoading(true);
    await onLogin(email, password);
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
        padding: "60px 40px",
        display: "flex"
      }} className="hidden md:flex">
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72,
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px",
            fontSize: 28, fontWeight: 800, color: "white",
            boxShadow: "0 8px 32px rgba(124,58,237,0.4)"
          }}>AI</div>
          <h1 style={{ color: "white", fontSize: 36, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.2 }}>
            Find Your Dream Job with AI
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.7, margin: "0 0 40px" }}>
            Upload your resume and let our AI match you with the perfect opportunities. Smart, fast, and personalized.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {[
              { icon: "🎯", text: "AI-powered job matching based on your resume" },
              { icon: "📊", text: "Real-time match scores with skill analysis" },
              { icon: "🚀", text: "Apply with one click and track your applications" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Login form */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px 40px"
      }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>AI</div>
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>AI Recruit</span>
          </div>
          <h2 style={{ color: "white", fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>Welcome back</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Sign in to your account to continue</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>Email Address</label>
            <input
              type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "#334155"}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500 }}>Password</label>
              <span onClick={() => navigate("/forgot")} style={{ color: "#60a5fa", fontSize: 12, cursor: "pointer" }}>Forgot password?</span>
            </div>
            <input
              type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "#334155"}
            />
          </div>

          <button
            onClick={submit} disabled={loading}
            style={{ width: "100%", background: loading ? "#4b5563" : "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </div>

        <div style={{ marginTop: 28, textAlign: "center" }}>
          <span style={{ color: "#64748b", fontSize: 14 }}>Don't have an account? </span>
          <span onClick={() => navigate("/register")} style={{ color: "#60a5fa", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Create one free
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;