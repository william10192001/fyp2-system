import React, { useState, useEffect } from "react";

const BASE = "https://fyp2-backend-gihc.onrender.com";

const BADGE = {
  "Perfect Match": { bg: "rgba(16,185,129,0.15)", color: "#34d399", border: "rgba(16,185,129,0.3)" },
  "Good Match":    { bg: "rgba(37,99,235,0.15)",  color: "#60a5fa", border: "rgba(37,99,235,0.3)"  },
  "Partial Match": { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  "Weak Match":    { bg: "rgba(107,114,128,0.15)",color: "#9ca3af", border: "rgba(107,114,128,0.3)"},
};

const S = {
  page:    { minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Inter, sans-serif" },
  nav:     { background: "#111827", borderBottom: "1px solid #1f2937", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tabBar:  { background: "#111827", borderBottom: "1px solid #1f2937", padding: "0 32px", display: "flex" },
  card:    { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: "20px 24px", marginBottom: 12 },
  input:   { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "12px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" },
  label:   { color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 },
  btnPrimary: { background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnGray:    { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};

function EmployerDashboard({ user, logout }) {
  const [activeTab,      setActiveTab]      = useState("jobs");
  const [jobs,           setJobs]           = useState([]);
  const [showForm,       setShowForm]       = useState(false);
  const [editingJob,     setEditingJob]     = useState(null);
  const [form,           setForm]           = useState({ jobTitle: "", companyName: "", location: "", jobDescription: "" });
  const [pdfFile,        setPdfFile]        = useState(null);
  const [extracting,     setExtracting]     = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [results,        setResults]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [activeMatchJob, setActiveMatchJob] = useState(null);
  const [applications,   setApplications]   = useState([]);
  const [loadingApps,    setLoadingApps]    = useState(false);

  const fetchJobs = async () => {
    try {
      const res  = await fetch(`${BASE}/jobs/${user.email}`);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) { console.log(err); }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res  = await fetch(`${BASE}/employer-applications/${user.email}`);
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) { console.log(err); }
    setLoadingApps(false);
  };

  useEffect(() => { fetchJobs(); }, [user]);
  useEffect(() => { if (activeTab === "applications") fetchApplications(); }, [activeTab]);

  const openCreate = () => { setEditingJob(null); setForm({ jobTitle: "", companyName: "", location: "", jobDescription: "" }); setPdfFile(null); setShowForm(true); setResults([]); };
  const openEdit   = (job) => { setEditingJob(job); setForm({ jobTitle: job.jobTitle, companyName: job.companyName, location: job.location, jobDescription: job.jobDescription }); setPdfFile(null); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const cancelForm = () => { setShowForm(false); setEditingJob(null); setPdfFile(null); };

  const handlePdfUpload = async (file) => {
    setPdfFile(file); setExtracting(true);
    const formData = new FormData(); formData.append("file", file);
    try {
      const res  = await fetch(`${BASE}/upload-job-pdf`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setForm(prev => ({ ...prev, jobDescription: data.text }));
      else alert(data.msg || "PDF upload failed");
    } catch { alert("Error uploading PDF"); }
    setExtracting(false);
  };

  const saveJob = async () => {
    if (!form.jobTitle.trim())       { alert("Job Title is required");       return; }
    if (!form.jobDescription.trim()) { alert("Job Description is required"); return; }
    setSaving(true);
    const url    = editingJob ? `${BASE}/job/${editingJob._id}` : `${BASE}/job/create`;
    const method = editingJob ? "PUT" : "POST";
    try {
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, employerEmail: user.email }) });
      const data = await res.json();
      alert(data.msg); setShowForm(false); setEditingJob(null); fetchJobs();
    } catch { alert("Save failed"); }
    setSaving(false);
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Delete this job posting?")) return;
    await fetch(`${BASE}/job/${jobId}`, { method: "DELETE" });
    fetchJobs();
    if (activeMatchJob === jobId) { setResults([]); setActiveMatchJob(null); }
  };

  const runMatching = async (job) => {
    setLoading(true); setResults([]); setActiveMatchJob(job._id); setShowForm(false);
    try {
      const res  = await fetch(`${BASE}/match`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: job._id }) });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch { alert("Matching failed"); }
    setLoading(false);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 200);
  };

  const updateAppStatus = async (appId, status) => {
    try {
      await fetch(`${BASE}/application/${appId}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      fetchApplications();
    } catch (err) { console.log(err); }
  };

  const scoreColor = (score) => score >= 70 ? "#34d399" : score >= 50 ? "#60a5fa" : score >= 30 ? "#fbbf24" : "#9ca3af";

  return (
    <div style={S.page}>

      {/* NAVBAR */}
      <div style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>AI</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Employer Dashboard</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>AI Recruitment System · {user.email}</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: "#ef4444", color: "white", border: "none", padding: "9px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Logout</button>
      </div>

      {/* TABS */}
      <div style={S.tabBar}>
        {[
          { key: "jobs",         label: "📋 My Job Postings" },
          { key: "applications", label: `📥 Applications${applications.length > 0 ? ` (${applications.length})` : ""}` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "14px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "none", border: "none",
            borderBottom: activeTab === t.key ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === t.key ? "#60a5fa" : "#6b7280"
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "32px", maxWidth: 960, margin: "0 auto" }}>

        {/* ════ JOBS TAB ════ */}
        {activeTab === "jobs" && (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Job Postings</h2>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p>
              </div>
              <button onClick={openCreate} style={S.btnPrimary}>+ Post New Job</button>
            </div>

            {/* JOB FORM */}
            {showForm && (
              <div style={{ background: "#111827", border: "1px solid #2563eb40", borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>{editingJob ? "✏️ Edit Job" : "📝 Post New Job"}</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div><label style={S.label}>Job Title *</label><input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} placeholder="e.g. Frontend Developer" style={S.input} /></div>
                  <div><label style={S.label}>Company Name</label><input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="e.g. Tech Corp Sdn Bhd" style={S.input} /></div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Location</label>
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Johor Bahru, Malaysia" style={S.input} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Upload Job Description PDF <span style={{ color: "#475569" }}>(optional — auto-fills description)</span></label>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, border: "2px dashed #334155", borderRadius: 12, padding: "14px 18px", cursor: "pointer" }}>
                    <span style={{ fontSize: 22 }}>📄</span>
                    <span style={{ color: pdfFile ? "#60a5fa" : "#475569", fontSize: 13 }}>
                      {pdfFile ? pdfFile.name : "Click to upload PDF job description"}
                      {extracting && <span style={{ color: "#fbbf24", marginLeft: 8 }}>⏳ Extracting...</span>}
                    </span>
                    <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handlePdfUpload(e.target.files[0]); }} />
                  </label>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>Job Description *</label>
                  <textarea rows="7" value={form.jobDescription} onChange={e => setForm({...form, jobDescription: e.target.value})} placeholder="e.g. Looking for a React developer with 3 years experience..." style={{ ...S.input, resize: "none" }} />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={saveJob} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Saving..." : editingJob ? "💾 Update Job" : "💾 Save Job"}
                  </button>
                  <button onClick={cancelForm} style={S.btnGray}>Cancel</button>
                </div>
              </div>
            )}

            {/* EMPTY */}
            {jobs.length === 0 && !showForm && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#374151" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
                <p style={{ fontSize: 16 }}>No jobs posted yet.</p>
                <p style={{ fontSize: 13, marginTop: 8, color: "#4b5563" }}>Click <strong style={{ color: "white" }}>+ Post New Job</strong> to get started.</p>
              </div>
            )}

            {/* JOB CARDS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {jobs.map(job => (
                <div key={job._id} style={{ ...S.card, border: activeMatchJob === job._id ? "1px solid #7c3aed60" : "1px solid #1f2937" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{job.jobTitle}</div>
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>
                        {job.companyName && <span>{job.companyName} · </span>}📍 {job.location || "Location not set"}
                      </div>
                      <div style={{ color: "#475569", fontSize: 12, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.jobDescription?.substring(0, 120)}...</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {(job.jobKeywords || []).slice(0, 6).map((kw, i) => (
                          <span key={i} style={{ background: "#1e293b", color: "#94a3b8", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>{kw}</span>
                        ))}
                        {(job.jobKeywords || []).length > 6 && <span style={{ color: "#475569", fontSize: 11 }}>+{job.jobKeywords.length - 6} more</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => runMatching(job)} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🚀 Run AI Match</button>
                      <button onClick={() => openEdit(job)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>✏️ Edit</button>
                      <button onClick={() => deleteJob(job._id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* MATCHING RESULTS */}
            {loading && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
                <p style={{ fontSize: 15 }}>AI is analyzing all candidates...</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Matching Results</h2>
                <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>
                  {results.length} candidates matched for: <strong style={{ color: "white" }}>{jobs.find(j => j._id === activeMatchJob)?.jobTitle}</strong>
                  <span style={{ marginLeft: 8, color: "#475569", fontSize: 11 }}>(showing ≥ 60% match only)</span>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {results.map((c, i) => {
                    const badge = BADGE[c.recommendation] || BADGE["Weak Match"];
                    return (
                      <div key={i} style={S.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                              <span style={{ fontSize: 17, fontWeight: 700 }}>{c.name || "Unnamed"}</span>
                              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>{c.recommendation}</span>
                            </div>
                            <div style={{ color: "#94a3b8", fontSize: 13 }}>{c.email}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(c.score) }}>{c.score}%</div>
                            <div style={{ color: "#475569", fontSize: 11 }}>Match Score</div>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div style={{ marginTop: 12, background: "#1e293b", borderRadius: 99, height: 4 }}>
                          <div style={{ height: 4, borderRadius: 99, background: `linear-gradient(90deg, #2563eb, ${scoreColor(c.score)})`, width: `${c.score}%` }} />
                        </div>

                        {c.summary && (
                          <div style={{ marginTop: 12, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, padding: "12px 14px", color: "#c4b5fd", fontSize: 13 }}>
                            🤖 <strong>AI Analysis:</strong> {c.summary}
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                          <div style={{ background: "#1e293b", borderRadius: 10, padding: 14 }}>
                            <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 8 }}>✅ Matched Skills</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {c.matchedKeywords?.length > 0
                                ? c.matchedKeywords.map((w, j) => <span key={j} style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>{w}</span>)
                                : <span style={{ color: "#475569", fontSize: 12 }}>None identified</span>}
                            </div>
                          </div>
                          <div style={{ background: "#1e293b", borderRadius: 10, padding: 14 }}>
                            <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 8 }}>❌ Missing Skills</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {c.missingSkills?.length > 0
                                ? c.missingSkills.map((w, j) => <span key={j} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>{w}</span>)
                                : <span style={{ color: "#475569", fontSize: 12 }}>None identified</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                          {[["📞 Phone", c.phone], ["💼 Experience", c.experience], ["🎓 Education", c.education]].map(([label, val]) => (
                            <div key={label} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px" }}>
                              <div style={{ color: "#475569", fontSize: 11 }}>{label}</div>
                              <div style={{ color: "#e2e8f0", fontSize: 13, marginTop: 3 }}>{val || "N/A"}</div>
                            </div>
                          ))}
                        </div>

                        {c.resumeText && (
                          <details style={{ marginTop: 12 }}>
                            <summary style={{ color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>📄 Resume Preview (click to expand)</summary>
                            <div style={{ marginTop: 10, background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 16, maxHeight: 200, overflowY: "auto" }}>
                              <pre style={{ fontSize: 11, color: "#64748b", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0 }}>{c.resumeText}</pre>
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && results.length === 0 && jobs.length > 0 && !showForm && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🤖</div>
                <p>Click <strong style={{ color: "#94a3b8" }}>🚀 Run AI Match</strong> on any job above to find matching candidates.</p>
              </div>
            )}
          </>
        )}

        {/* ════ APPLICATIONS TAB ════ */}
        {activeTab === "applications" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Applications Received</h2>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>Candidates who applied to your job postings</p>
              </div>
              <button onClick={fetchApplications} style={S.btnGray}>🔄 Refresh</button>
            </div>

            {loadingApps && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📥</div>
                <p>Loading applications...</p>
              </div>
            )}

            {!loadingApps && applications.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
                <p style={{ fontSize: 15 }}>No applications yet.</p>
                <p style={{ fontSize: 13, color: "#4b5563", marginTop: 8 }}>Applications will appear here when candidates apply to your jobs.</p>
              </div>
            )}

            {!loadingApps && applications.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {applications.map((app, i) => {
                  const score = app.matchScore || 0;
                  const rec   = score >= 70 ? "Perfect Match" : score >= 50 ? "Good Match" : score >= 30 ? "Partial Match" : "Weak Match";
                  const badge = BADGE[rec];
                  return (
                    <div key={i} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>

                        {/* LEFT: candidate info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 16 }}>{app.candidateName || "Candidate"}</span>
                            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600,
                              background: app.status === "accepted" ? "rgba(16,185,129,0.15)" : app.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(37,99,235,0.15)",
                              color:      app.status === "accepted" ? "#34d399"               : app.status === "rejected" ? "#f87171"               : "#60a5fa",
                              border:     `1px solid ${app.status === "accepted" ? "rgba(16,185,129,0.3)" : app.status === "rejected" ? "rgba(239,68,68,0.3)" : "rgba(37,99,235,0.3)"}`
                            }}>
                              {app.status === "pending" ? "Under Review" : app.status === "accepted" ? "✓ Accepted" : "✗ Rejected"}
                            </span>
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>{app.candidateEmail}</div>
                          <div style={{ color: "#475569", fontSize: 12, marginBottom: 4 }}>
                            Applied for: <strong style={{ color: "#94a3b8" }}>{app.jobTitle}</strong>
                          </div>
                          <div style={{ color: "#374151", fontSize: 11, marginBottom: 12 }}>
                            {new Date(app.createdAt).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}
                          </div>

                          {/* Match score row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(score) }}>{score}%</span>
                              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>{rec}</span>
                            </div>
                            {/* Score bar */}
                            <div style={{ flex: 1, background: "#1e293b", borderRadius: 99, height: 5 }}>
                              <div style={{ height: 5, borderRadius: 99, background: `linear-gradient(90deg, #2563eb, ${scoreColor(score)})`, width: `${score}%`, transition: "width 0.5s" }} />
                            </div>
                          </div>

                          {/* Matched keywords */}
                          {app.matchedKeywords?.length > 0 && (
                            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {app.matchedKeywords.map((kw, j) => (
                                <span key={j} style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>✓ {kw}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* RIGHT: action buttons */}
                        {app.status === "pending" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                            <button onClick={() => updateAppStatus(app._id, "accepted")} style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Accept</button>
                            <button onClick={() => updateAppStatus(app._id, "rejected")} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✗ Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployerDashboard;
