import React, { useState } from "react";

function ResumeUpload({ user }) {
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [drag,    setDrag]    = useState(false);

  const upload = async () => {
    if (!file) { alert("Please select a PDF file first"); return; }
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", user.email);
    try {
      const res  = await fetch("https://fyp2-backend-gihc.onrender.com/upload-resume", {
        method: "POST", body: formData
      });
      const data = await res.json();
      if (!res.ok) { alert(data.msg || "Upload failed ❌"); return; }
      setResult(data);
    } catch { alert("Error uploading ❌"); }
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") setFile(dropped);
    else alert("Please upload a PDF file");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Drop Zone */}
      <label
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          display: "block", border: `2px dashed ${drag ? "#2563eb" : "#334155"}`,
          borderRadius: 14, padding: "40px 20px", textAlign: "center", cursor: "pointer",
          background: drag ? "rgba(37,99,235,0.08)" : "#1e293b", transition: "all 0.2s"
        }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
        {file ? (
          <div>
            <p style={{ color: "#60a5fa", fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>{file.name}</p>
            <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>Click to change file</p>
          </div>
        ) : (
          <div>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 6px" }}>Drag & drop your PDF resume here</p>
            <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>or click to select a file</p>
          </div>
        )}
        <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
      </label>

      <button
        onClick={upload}
        disabled={loading || !file}
        style={{
          background: !file ? "#1e293b" : loading ? "#334155" : "linear-gradient(135deg, #2563eb, #7c3aed)",
          color: !file ? "#475569" : "white", border: "none", padding: "13px 0",
          borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: !file ? "not-allowed" : "pointer",
          transition: "all 0.2s"
        }}>
        {loading ? "⏳ Processing..." : "Upload & Analyze Resume"}
      </button>

      {/* Result */}
      {result && (
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: 20 }}>
          <div style={{ color: "#34d399", fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
            ✅ Resume analyzed! {result.totalKeywords} keywords extracted.
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>Top extracted keywords:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 160, overflowY: "auto" }}>
            {result.keywords?.slice(0, 60).map((kw, i) => (
              <span key={i} style={{ background: "#1e293b", color: "#94a3b8", fontSize: 11, padding: "3px 10px", borderRadius: 99, border: "1px solid #334155" }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
