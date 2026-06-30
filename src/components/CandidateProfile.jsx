import React, { useState } from "react";

const BASE = "https://fyp2-backend-gihc.onrender.com";

const S = {
  input:        { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "11px 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" },
  label:        { color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 },
  sectionLabel: { fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1f2937" },
};

const EMPTY = { name: "", phone: "", skills: "", experience: "", education: "" };

function CandidateProfile({ user, myData, refresh }) {
  const [form,        setForm]        = useState(EMPTY);
  const [loaded,      setLoaded]      = useState(false);
  const [pdfFile,     setPdfFile]     = useState(null);
  const [extracting,  setExtracting]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [keywords,    setKeywords]    = useState([]);
  const [autoFilled,  setAutoFilled]  = useState([]);
  const [saved,       setSaved]       = useState(false);
  const [drag,        setDrag]        = useState(false);

  // Initialize form from myData once on first load
  React.useEffect(() => {
    if (myData && !loaded) {
      setForm({
        name: myData.name || "", phone: myData.phone || "",
        skills: myData.skills || "", experience: myData.experience || "",
        education: myData.education || ""
      });
      setKeywords(myData.resumeKeywords || []);
      setLoaded(true);
    }
  }, [myData, loaded]);

  /* Smart resume upload — AI auto-fills profile fields */
  const handlePdfUpload = async (file) => {
    if (file.type !== "application/pdf") { alert("Please upload a PDF file"); return; }
    setPdfFile(file); setExtracting(true); setAutoFilled([]);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("email", user.email);
    try {
      const res  = await fetch(`${BASE}/upload-resume`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        const filled = [];
        const updates = {};
        [["name", data.name], ["phone", data.phone], ["skills", data.skills],
         ["experience", data.experience], ["education", data.education]].forEach(([key, val]) => {
          if (val && val.trim()) { updates[key] = val.trim(); filled.push(key); }
        });
        setForm(prev => ({ ...prev, ...updates }));
        setAutoFilled(filled);
        setKeywords(data.keywords || []);
        // Refresh parent state (job matches, myData) so stale scores disappear immediately
        if (refresh) refresh();
      } else {
        alert(data.msg || "Resume upload failed");
      }
    } catch { alert("Error uploading resume"); }
    setExtracting(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handlePdfUpload(dropped);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/profile`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: user.email })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (refresh) refresh();
    } catch { alert("Save failed ❌"); }
    setSaving(false);
  };

  const fieldLabel = (key, label, icon) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <label style={{ ...S.label, margin: 0 }}>{icon} {label}</label>
      {autoFilled.includes(key) && (
        <span style={{ fontSize: 10, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", padding: "1px 6px", borderRadius: 99 }}>✨ Auto-filled</span>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Section 1: Resume Upload ── */}
      <div>
        <div style={S.sectionLabel}>📄 Resume Upload</div>
        <label
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            border: `2px dashed ${drag ? "#2563eb" : pdfFile || myData?.resumeText ? "#10b981" : "#334155"}`,
            borderRadius: 12, padding: "16px 18px", cursor: "pointer",
            background: drag ? "rgba(37,99,235,0.08)" : (pdfFile || myData?.resumeText) ? "rgba(16,185,129,0.05)" : "#1e293b",
            transition: "all 0.2s"
          }}>
          <span style={{ fontSize: 28 }}>📄</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: pdfFile ? "#34d399" : "#94a3b8", fontSize: 13, fontWeight: 600 }}>
              {pdfFile ? pdfFile.name : myData?.resumeText ? "Resume on file — click to replace" : "Click or drag your PDF resume here"}
            </div>
            {extracting && (
              <div style={{ color: "#fbbf24", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, border: "2px solid rgba(251,191,36,0.3)", borderTopColor: "#fbbf24", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                AI is extracting and auto-filling your profile...
              </div>
            )}
            {!extracting && autoFilled.length > 0 && (
              <div style={{ color: "#34d399", fontSize: 12, marginTop: 4 }}>✅ {autoFilled.length} fields auto-filled · {keywords.length} keywords extracted</div>
            )}
            {!extracting && autoFilled.length === 0 && !pdfFile && (
              <div style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>Name, phone, skills, experience & education will be auto-filled</div>
            )}
          </div>
          <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handlePdfUpload(e.target.files[0]); }} />
        </label>
      </div>

      {/* ── Section 2: Profile Fields ── */}
      <div>
        <div style={S.sectionLabel}>👤 Profile Information</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            {fieldLabel("name", "Full Name", "👤")}
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Liew Yong Zheng"
              style={{ ...S.input, borderColor: autoFilled.includes("name") ? "rgba(16,185,129,0.4)" : "#334155" }} />
          </div>
          <div>
            {fieldLabel("phone", "Phone", "📱")}
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +60 12-345 6789"
              style={{ ...S.input, borderColor: autoFilled.includes("phone") ? "rgba(16,185,129,0.4)" : "#334155" }} />
          </div>
          <div>
            {fieldLabel("skills", "Skills", "💡")}
            <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. React, Node.js, Python"
              style={{ ...S.input, borderColor: autoFilled.includes("skills") ? "rgba(16,185,129,0.4)" : "#334155" }} />
          </div>
          <div>
            {fieldLabel("experience", "Experience", "💼")}
            <input value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 2 years as Frontend Developer"
              style={{ ...S.input, borderColor: autoFilled.includes("experience") ? "rgba(16,185,129,0.4)" : "#334155" }} />
          </div>
          <div>
            {fieldLabel("education", "Education", "🎓")}
            <input value={form.education} onChange={e => setForm({ ...form, education: e.target.value })} placeholder="e.g. BSc Computer Science, UTM"
              style={{ ...S.input, borderColor: autoFilled.includes("education") ? "rgba(16,185,129,0.4)" : "#334155" }} />
          </div>

          <button onClick={saveProfile} disabled={saving} style={{
            background: saving ? "#334155" : "linear-gradient(135deg, #2563eb, #7c3aed)",
            color: "white", border: "none", padding: "12px 0", borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4
          }}>
            {saving ? "Saving..." : "💾 Save Profile"}
          </button>

          {saved && (
            <div style={{ color: "#34d399", fontSize: 13, textAlign: "center", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 0" }}>
              ✅ Profile saved successfully!
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Keyword Library ── */}
      {keywords.length > 0 && (
        <div>
          <div style={S.sectionLabel}>🔑 Resume Keyword Library — used for job matching ({keywords.length} total)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 160, overflowY: "auto", background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 14 }}>
            {keywords.map((kw, i) => (
              <span key={i} style={{ background: "#1e293b", color: "#94a3b8", fontSize: 11, padding: "3px 10px", borderRadius: 99, border: "1px solid #334155" }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default CandidateProfile;
