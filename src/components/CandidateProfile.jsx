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
    { key: "name",       label: "Full Name",   placeholder: "e.g. Liew Yong Zheng",              icon: "👤" },
    { key: "phone",      label: "Phone",        placeholder: "e.g. +60 12-345 6789",              icon: "📱" },
    { key: "skills",     label: "Skills",       placeholder: "e.g. React, Node.js, Python",       icon: "💡" },
    { key: "experience", label: "Experience",   placeholder: "e.g. 2 years as Frontend Developer", icon: "💼" },
    { key: "education",  label: "Education",    placeholder: "e.g. BSc Computer Science, UTM",    icon: "🎓" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {fields.map(f => (
        <div key={f.key}>
          <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>{f.icon} {f.label}</label>
          <input
            placeholder={f.placeholder}
            value={form[f.key]}
            onChange={e => setForm({ ...form, [f.key]: e.target.value })}
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      ))}
      <button onClick={save} disabled={loading} style={{
        background: loading ? "#93c5fd" : "#2563eb", color: "white", border: "none",
        padding: "11px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 4
      }}>
        {loading ? "Saving..." : "Save Profile"}
      </button>
      {saved && <div style={{ color: "#16a34a", fontSize: 13, textAlign: "center" }}>✅ Profile saved!</div>}
    </div>
  );
}

export default CandidateProfile;