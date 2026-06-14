import React, { useState, useEffect } from "react";

function CandidateProfile({ user, refresh }) {
  const [form, setForm] = useState({ name: "", phone: "", skills: "", experience: "", education: "" });
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("https://fyp2-backend-gihc.onrender.com/candidates")
      .then(r => r.json())
      .then(data => {
        const me = data.find(u => u.email === user.email);
        if (me) setForm({ name: me.name||"", phone: me.phone||"", skills: me.skills||"", experience: me.experience||"", education: me.education||"" });
      });
  }, [user]);

  const save = async () => {
    setLoading(true);
    await fetch("https://fyp2-backend-gihc.onrender.com/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, email: user.email })
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (refresh) refresh();
  };

  const fields = [
    { key: "name",       label: "Full Name",   placeholder: "e.g. Liew Yong Zheng",               icon: "👤" },
    { key: "phone",      label: "Phone",        placeholder: "e.g. +60 12-345 6789",               icon: "📱" },
    { key: "skills",     label: "Skills",       placeholder: "e.g. React, Node.js, Python",        icon: "💡" },
    { key: "experience", label: "Experience",   placeholder: "e.g. 2 years as Frontend Developer", icon: "💼" },
    { key: "education",  label: "Education",    placeholder: "e.g. BSc Computer Science, UTM",     icon: "🎓" },
  ];

  const inputStyle = {
    width: "100%", background: "#1e293b", border: "1px solid #334155",
    borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "white",
    outline: "none", boxSizing: "border-box"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {fields.map(f => (
        <div key={f.key}>
          <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>{f.icon} {f.label}</label>
          <input
            placeholder={f.placeholder}
            value={form[f.key]}
            onChange={e => setForm({ ...form, [f.key]: e.target.value })}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = "#2563eb"}
            onBlur={e => e.target.style.borderColor = "#334155"}
          />
        </div>
      ))}

      <button onClick={save} disabled={loading} style={{
        background: loading ? "#334155" : "linear-gradient(135deg, #2563eb, #7c3aed)",
        color: "white", border: "none", padding: "12px 0", borderRadius: 10,
        fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4,
        opacity: loading ? 0.7 : 1
      }}>
        {loading ? "Saving..." : "Save Profile"}
      </button>

      {saved && (
        <div style={{ color: "#34d399", fontSize: 13, textAlign: "center", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 0" }}>
          ✅ Profile saved successfully!
        </div>
      )}
    </div>
  );
}

export default CandidateProfile;
