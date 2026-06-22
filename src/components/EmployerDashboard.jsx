import React, { useState, useEffect, useRef } from "react";

const BASE = "https://fyp2-backend-gihc.onrender.com";

const BADGE = {
  "Perfect Match": { bg: "rgba(16,185,129,0.15)", color: "#34d399", border: "rgba(16,185,129,0.3)" },
  "Good Match":    { bg: "rgba(37,99,235,0.15)",  color: "#60a5fa", border: "rgba(37,99,235,0.3)"  },
  "Partial Match": { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  "Weak Match":    { bg: "rgba(107,114,128,0.15)",color: "#9ca3af", border: "rgba(107,114,128,0.3)"},
};

const S = {
  page:       { minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Inter, sans-serif" },
  nav:        { background: "#111827", borderBottom: "1px solid #1f2937", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tabBar:     { background: "#111827", borderBottom: "1px solid #1f2937", padding: "0 32px", display: "flex" },
  card:       { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: "20px 24px", marginBottom: 12 },
  input:      { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "11px 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" },
  select:     { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "11px 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" },
  label:      { color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 },
  btnPrimary: { background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnGray:    { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  sectionLabel: { fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1f2937" },
};

const EMPTY = { jobTitle:"", companyName:"", location:"", jobDescription:"", salary:"", jobType:"", workMode:"", benefits:"", companyDescription:"", contactEmail:"" };

function EmployerDashboard({ user, logout }) {
  const [activeTab,    setActiveTab]    = useState("jobs");
  const [jobs,         setJobs]         = useState([]);
  const [showForm,     setShowForm]     = useState(false);
  const [editingJob,   setEditingJob]   = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [pdfFile,      setPdfFile]      = useState(null);
  const [extracting,   setExtracting]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [pdfKeywords,  setPdfKeywords]  = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingApps,  setLoadingApps]  = useState(false);
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const [newAppBadge,  setNewAppBadge]  = useState(false);
  const prevCount      = useRef(0);
  const timer          = useRef(null);

  const fetchJobs = async () => {
    try { const res = await fetch(`${BASE}/jobs/${user.email}`); setJobs(Array.isArray(await res.json()) ? await (await fetch(`${BASE}/jobs/${user.email}`)).json() : []); }
    catch (err) { console.log(err); }
  };

  const fetchApplications = async (silent = false) => {
    if (!silent) setLoadingApps(true);
    try {
      const res  = await fetch(`${BASE}/employer-applications/${user.email}`);
      const apps = Array.isArray(await res.json()) ? await (await fetch(`${BASE}/employer-applications/${user.email}`)).json() : [];
      if (apps.length > prevCount.current && prevCount.current > 0) setNewAppBadge(true);
      prevCount.current = apps.length;
      setApplications(apps); setLastRefresh(new Date());
    } catch (err) { console.log(err); }
    if (!silent) setLoadingApps(false);
  };

  useEffect(() => {
    fetch(`${BASE}/jobs/${user.email}`).then(r=>r.json()).then(d=>setJobs(Array.isArray(d)?d:[]));
  }, [user]);

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications(); setNewAppBadge(false);
      timer.current = setInterval(() => fetchApplications(true), 30000);
    } else { clearInterval(timer.current); }
    return () => clearInterval(timer.current);
  }, [activeTab]);

  const openCreate = () => { setEditingJob(null); setForm(EMPTY); setPdfFile(null); setPdfKeywords([]); setShowForm(true); };
  const openEdit   = (job) => {
    setEditingJob(job);
    setForm({ jobTitle: job.jobTitle||"", companyName: job.companyName||"", location: job.location||"", jobDescription: job.jobDescription||"", salary: job.salary||"", jobType: job.jobType||"", workMode: job.workMode||"", benefits: job.benefits||"", companyDescription: job.companyDescription||"", contactEmail: job.contactEmail||"" });
    setPdfFile(null); setPdfKeywords(job.jobKeywords||[]); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelForm = () => { setShowForm(false); setEditingJob(null); setPdfFile(null); setPdfKeywords([]); };

  const handlePdfUpload = async (file) => {
    setPdfFile(file); setExtracting(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res  = await fetch(`${BASE}/upload-job-pdf`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) { setForm(prev => ({ ...prev, jobDescription: data.text })); setPdfKeywords(data.keywords || []); }
      else alert(data.msg || "PDF upload failed");
    } catch { alert("Error uploading PDF"); }
    setExtracting(false);
  };

  const saveJob = async () => {
    if (!form.jobTitle.trim())       { alert("Job Title is required");       return; }
    if (!form.jobDescription.trim()) { alert("Job Description is required"); return; }
    setSaving(true);
    try {
      const res  = await fetch(editingJob ? `${BASE}/job/${editingJob._id}` : `${BASE}/job/create`, {
        method: editingJob ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, employerEmail: user.email })
      });
      const data = await res.json();
      alert(data.msg); setShowForm(false); setEditingJob(null); setPdfKeywords([]);
      fetch(`${BASE}/jobs/${user.email}`).then(r=>r.json()).then(d=>setJobs(Array.isArray(d)?d:[]));
    } catch { alert("Save failed"); }
    setSaving(false);
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Delete this job posting?")) return;
    await fetch(`${BASE}/job/${jobId}`, { method: "DELETE" });
    fetch(`${BASE}/jobs/${user.email}`).then(r=>r.json()).then(d=>setJobs(Array.isArray(d)?d:[]));
  };

  const updateStatus = async (appId, status) => {
    try {
      await fetch(`${BASE}/application/${appId}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      fetchApplications();
    } catch (err) { console.log(err); }
  };

  const scoreColor = (s) => s >= 70 ? "#34d399" : s >= 50 ? "#60a5fa" : s >= 30 ? "#fbbf24" : "#9ca3af";

  return (
    <div style={S.page}>
      {/* NAVBAR */}
      <div style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>AI</div>
          <div><div style={{ fontWeight: 700, fontSize: 18 }}>Employer Dashboard</div><div style={{ color: "#94a3b8", fontSize: 12 }}>AI Recruitment System · {user.email}</div></div>
        </div>
        <button onClick={logout} style={{ background: "#ef4444", color: "white", border: "none", padding: "9px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Logout</button>
      </div>

      {/* TABS */}
      <div style={S.tabBar}>
        {[
          { key: "jobs",         label: "📋 My Job Postings" },
          { key: "applications", label: `📥 Applications${applications.length > 0 ? ` (${applications.length})` : ""}${newAppBadge ? " 🔴" : ""}` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: "14px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", background: "none", border: "none", borderBottom: activeTab === t.key ? "2px solid #2563eb" : "2px solid transparent", color: activeTab === t.key ? "#60a5fa" : "#6b7280" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "32px", maxWidth: 960, margin: "0 auto" }}>

        {/* ════ JOBS TAB ════ */}
        {activeTab === "jobs" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div><h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Job Postings</h2><p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p></div>
              <button onClick={openCreate} style={S.btnPrimary}>+ Post New Job</button>
            </div>

            {/* JOB FORM */}
            {showForm && (
              <div style={{ background: "#111827", border: "1px solid #2563eb40", borderRadius: 16, padding: 28, marginBottom: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24 }}>{editingJob ? "✏️ Edit Job" : "📝 Post New Job"}</h3>

                {/* Section 1 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={S.sectionLabel}>📋 Basic Information</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div><label style={S.label}>Job Title *</label><input value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} placeholder="e.g. Frontend Developer" style={S.input}/></div>
                    <div><label style={S.label}>Company Name</label><input value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})} placeholder="e.g. Tech Corp Sdn Bhd" style={S.input}/></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div><label style={S.label}>Location</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Johor Bahru" style={S.input}/></div>
                    <div><label style={S.label}>Job Type</label><select value={form.jobType} onChange={e=>setForm({...form,jobType:e.target.value})} style={S.select}><option value="">Select...</option>{["Full-time","Part-time","Internship","Contract","Freelance"].map(o=><option key={o}>{o}</option>)}</select></div>
                    <div><label style={S.label}>Work Mode</label><select value={form.workMode} onChange={e=>setForm({...form,workMode:e.target.value})} style={S.select}><option value="">Select...</option>{["On-site","Remote","Hybrid"].map(o=><option key={o}>{o}</option>)}</select></div>
                  </div>
                  <div><label style={S.label}>Salary Range</label><input value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} placeholder="e.g. RM 3,000 – RM 5,000 / month" style={S.input}/></div>
                </div>

                {/* Section 2 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={S.sectionLabel}>📄 Job Description</div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Upload Job Description PDF <span style={{ color: "#475569" }}>(auto-extracts keywords + fills description)</span></label>
                    <label style={{ display: "flex", alignItems: "center", gap: 12, border: "2px dashed #334155", borderRadius: 12, padding: "14px 18px", cursor: "pointer", background: pdfFile ? "rgba(37,99,235,0.05)" : "transparent" }}>
                      <span style={{ fontSize: 22 }}>📄</span>
                      <span style={{ color: pdfFile ? "#60a5fa" : "#475569", fontSize: 13 }}>
                        {pdfFile ? pdfFile.name : "Click to upload PDF"}
                        {extracting && <span style={{ color: "#fbbf24", marginLeft: 8 }}>⏳ Extracting keywords...</span>}
                      </span>
                      <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handlePdfUpload(e.target.files[0]); }} />
                    </label>
                    {/* Show extracted keywords from PDF */}
                    {pdfKeywords.length > 0 && (
                      <div style={{ marginTop: 10, background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>🔑 Extracted Keywords ({pdfKeywords.length})</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxHeight: 80, overflowY: "auto" }}>
                          {pdfKeywords.slice(0, 60).map((kw, i) => <span key={i} style={{ background: "#1e293b", color: "#94a3b8", fontSize: 10, padding: "2px 8px", borderRadius: 99, border: "1px solid #334155" }}>{kw}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div><label style={S.label}>Job Description *</label><textarea rows="6" value={form.jobDescription} onChange={e=>setForm({...form,jobDescription:e.target.value})} placeholder="Describe the role, responsibilities, and requirements..." style={{ ...S.input, resize: "vertical" }} /></div>
                </div>

                {/* Section 3 */}
                <div style={{ marginBottom: 24 }}>
                  <div style={S.sectionLabel}>🏢 Company & Benefits</div>
                  <div style={{ marginBottom: 14 }}><label style={S.label}>About the Company</label><textarea rows={3} value={form.companyDescription} onChange={e=>setForm({...form,companyDescription:e.target.value})} placeholder="e.g. We are a fast-growing tech startup..." style={{ ...S.input, resize: "none" }}/></div>
                  <div style={{ marginBottom: 14 }}><label style={S.label}>Benefits / Perks</label><textarea rows={3} value={form.benefits} onChange={e=>setForm({...form,benefits:e.target.value})} placeholder="e.g. EPF, SOCSO, Medical Insurance, Annual Leave..." style={{ ...S.input, resize: "none" }}/></div>
                  <div><label style={S.label}>HR / Contact Email</label><input value={form.contactEmail} onChange={e=>setForm({...form,contactEmail:e.target.value})} placeholder="e.g. hr@company.com" style={S.input}/></div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={saveJob} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : editingJob ? "💾 Update Job" : "💾 Save Job"}</button>
                  <button onClick={cancelForm} style={S.btnGray}>Cancel</button>
                </div>
              </div>
            )}

            {jobs.length === 0 && !showForm && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#374151" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
                <p>No jobs posted yet. Click <strong style={{ color: "white" }}>+ Post New Job</strong> to get started.</p>
              </div>
            )}

            {/* JOB CARDS — no Run AI Match, only Edit + Delete */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {jobs.map(job => (
                <div key={job._id} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{job.jobTitle}</div>
                      <div style={{ color: "#94a3b8", fontSize: 13, display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                        {job.companyName && <span>🏢 {job.companyName}</span>}
                        <span>📍 {job.location || "Location not set"}</span>
                        {job.jobType  && <span>💼 {job.jobType}</span>}
                        {job.workMode && <span>🏠 {job.workMode}</span>}
                        {job.salary   && <span>💰 {job.salary}</span>}
                      </div>
                      <div style={{ color: "#475569", fontSize: 12, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.jobDescription?.substring(0, 120)}...</div>
                      {/* Keyword Library per job */}
                      {(job.jobKeywords||[]).length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>🔑 Keyword Library ({job.jobKeywords.length})</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {job.jobKeywords.slice(0, 12).map((kw, i) => <span key={i} style={{ background: "#1e293b", color: "#94a3b8", fontSize: 11, padding: "3px 10px", borderRadius: 99, border: "1px solid #334155" }}>{kw}</span>)}
                            {job.jobKeywords.length > 12 && <span style={{ color: "#475569", fontSize: 11, padding: "3px 8px" }}>+{job.jobKeywords.length - 12} more</span>}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Only Edit + Delete, no AI Match */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => openEdit(job)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>✏️ Edit</button>
                      <button onClick={() => deleteJob(job._id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ APPLICATIONS TAB ════ */}
        {activeTab === "applications" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Applications Received</h2>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>Candidates who applied to your job postings{lastRefresh && <span style={{ marginLeft: 8, color: "#374151" }}>· Updated {lastRefresh.toLocaleTimeString()}</span>}</p>
              </div>
              <button onClick={() => fetchApplications()} style={S.btnGray}>🔄 Refresh</button>
            </div>

            {loadingApps && <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📥</div><p>Loading applications...</p></div>}

            {!loadingApps && applications.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
                <p>No applications yet. Applications will appear here when candidates apply.</p>
              </div>
            )}

            {!loadingApps && applications.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {applications.map((app, i) => {
                  const score = app.matchScore || 0;
                  const rec   = score >= 70 ? "Perfect Match" : score >= 50 ? "Good Match" : score >= 30 ? "Partial Match" : "Weak Match";
                  const badge = BADGE[rec];
                  const statusLabel = app.status === "accepted" ? "✓ Accepted for Future Process" : app.status === "rejected" ? "✗ Rejected" : "Under Review";
                  const statusStyle = {
                    bg:     app.status === "accepted" ? "rgba(16,185,129,0.15)"  : app.status === "rejected" ? "rgba(239,68,68,0.15)"  : "rgba(37,99,235,0.15)",
                    color:  app.status === "accepted" ? "#34d399"                : app.status === "rejected" ? "#f87171"                : "#60a5fa",
                    border: app.status === "accepted" ? "rgba(16,185,129,0.3)"  : app.status === "rejected" ? "rgba(239,68,68,0.3)"  : "rgba(37,99,235,0.3)",
                  };
                  return (
                    <div key={i} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          {/* Candidate name + status */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 16 }}>{app.candidateName || "Candidate"}</span>
                            <span style={{ fontSize: 11, padding: "3px 12px", borderRadius: 99, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>{statusLabel}</span>
                          </div>
                          {/* Contact info — email + phone */}
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ color: "#94a3b8", fontSize: 13 }}>📧 {app.candidateEmail}</span>
                            {app.candidatePhone && <span style={{ color: "#94a3b8", fontSize: 13 }}>📞 {app.candidatePhone}</span>}
                          </div>
                          <div style={{ color: "#475569", fontSize: 12, marginBottom: 10 }}>
                            Applied for: <strong style={{ color: "#94a3b8" }}>{app.jobTitle}</strong> · {new Date(app.createdAt).toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                          {/* Match score */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(score) }}>{score}%</span>
                            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>{rec}</span>
                            <div style={{ flex: 1, maxWidth: 140, background: "#1e293b", borderRadius: 99, height: 4 }}>
                              <div style={{ height: 4, borderRadius: 99, background: `linear-gradient(90deg,#2563eb,${scoreColor(score)})`, width: `${score}%` }} />
                            </div>
                          </div>
                          {/* Matched keywords */}
                          {app.matchedKeywords?.length > 0 && (
                            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {app.matchedKeywords.map((kw, j) => <span key={j} style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>✓ {kw}</span>)}
                            </div>
                          )}
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                          {app.status === "pending" && (
                            <>
                              <button onClick={() => updateStatus(app._id, "accepted")} style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Accept</button>
                              <button onClick={() => updateStatus(app._id, "rejected")} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✗ Reject</button>
                            </>
                          )}
                          {app.status !== "pending" && (
                            <button onClick={() => updateStatus(app._id, "pending")} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 16px", fontSize: 12, cursor: "pointer" }}>↩ Reset</button>
                          )}
                        </div>
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
