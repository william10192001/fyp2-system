import React, { useEffect, useState } from "react";
import CandidateProfile from "./CandidateProfile";
import ResumeUpload from "./ResumeUpload";

const BASE = "https://fyp2-backend-gihc.onrender.com";

const MS = {
  "Perfect Match": { hex: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", text: "#34d399" },
  "Good Match":    { hex: "#2563eb", bg: "rgba(37,99,235,0.12)",  border: "rgba(37,99,235,0.3)",  text: "#60a5fa" },
  "Partial Match": { hex: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#fbbf24" },
  "Weak Match":    { hex: "#6b7280", bg: "rgba(107,114,128,0.12)",border: "rgba(107,114,128,0.3)",text: "#9ca3af" },
};

const S = {
  page:   { minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Inter, sans-serif" },
  nav:    { background: "#111827", borderBottom: "1px solid #1f2937", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tabBar: { background: "#111827", borderBottom: "1px solid #1f2937", padding: "0 32px", display: "flex" },
  card:   { background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: "18px 22px", marginBottom: 12 },
};

function CandidateDashboard({ user, logout }) {
  const [activeTab,    setActiveTab]    = useState("jobs");
  const [jobs,         setJobs]         = useState([]);
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [aiAnalysis,   setAiAnalysis]   = useState(null);
  const [loadingJobs,  setLoadingJobs]  = useState(false);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [myData,       setMyData]       = useState(null);
  const [activeDetail, setActiveDetail] = useState("description");
  const [savedJobs,    setSavedJobs]    = useState([]);
  const [appliedJobs,  setAppliedJobs]  = useState([]);
  const [rejectedJobs, setRejectedJobs] = useState([]);
  const [applyingId,   setApplyingId]   = useState(null);
  const [filterLevel,  setFilterLevel]  = useState("All");
  const [sortOrder,    setSortOrder]    = useState("score");
  const [showFilter,   setShowFilter]   = useState(false);

  const fetchMyData = () => {
    fetch(`${BASE}/candidates`)
      .then(r => r.json())
      .then(data => setMyData(data.find(c => c.email === user.email)));
  };

  const fetchAppliedAndSaved = async () => {
    try {
      const [appRes, savedRes] = await Promise.all([
        fetch(`${BASE}/my-applications/${user.email}`),
        fetch(`${BASE}/saved-jobs/${user.email}`)
      ]);
      const appData   = await appRes.json();
      const savedData = await savedRes.json();
      const apps = Array.isArray(appData) ? appData : [];
      setAppliedJobs(apps.filter(a => a.status !== "rejected").map(a => a.jobId));
      setRejectedJobs(apps.filter(a => a.status === "rejected").map(a => a.jobId));
      setSavedJobs(Array.isArray(savedData) ? savedData.map(j => j._id.toString()) : []);
    } catch (err) { console.log(err); }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res  = await fetch(`${BASE}/match-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateEmail: user.email })
      });
      const data = await res.json();
      setJobs(data);
      if (data.length > 0) selectJob(data[0]);
    } catch (e) { console.log(e); }
    setLoadingJobs(false);
  };

  const selectJob = async (job) => {
    setSelectedJob(job);
    setAiAnalysis(null);
    setActiveDetail("description");
    setAnalyzing(true);
    try {
      const res  = await fetch(`${BASE}/analyze-job-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateEmail: user.email, jobId: job.jobId })
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (e) { console.log(e); }
    setAnalyzing(false);
  };

  const applyToJob = async (job) => {
    if (appliedJobs.includes(job.jobId)) return;
    setApplyingId(job.jobId);
    try {
      const res  = await fetch(`${BASE}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.jobId, candidateEmail: user.email })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedJobs(prev => [...prev, job.jobId]);
        setRejectedJobs(prev => prev.filter(id => id !== job.jobId));
        setApplyingId(null);
        alert(`Successfully applied to "${job.jobTitle}" ✅`);
      } else {
        setApplyingId(null);
        alert(data.msg);
      }
    } catch {
      setApplyingId(null);
      alert("Apply failed ❌");
    }
  };

  const toggleSaveJob = async (jobId) => {
    const isSaved = savedJobs.includes(jobId);
    try {
      await fetch(`${BASE}/toggle-save-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, candidateEmail: user.email, action: isSaved ? "unsave" : "save" })
      });
      setSavedJobs(prev => isSaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    fetchMyData();
    fetchJobs();
    fetchAppliedAndSaved();
  }, [user]);

  const displayedJobs = jobs
    .filter(job => filterLevel === "All" || job.recommendation === filterLevel)
    .sort((a, b) => sortOrder === "score" ? b.score - a.score : a.daysAgo - b.daysAgo);

  const candidateName = myData?.name || user.email.split("@")[0];
  const hasResume     = !!myData?.resumeText;

  const getApplyState = (jobId) => {
    if (appliedJobs.includes(jobId)) return "applied";
    if (rejectedJobs.includes(jobId)) return "rejected";
    return "none";
  };

  return (
    <div style={S.page}>

      {/* NAVBAR */}
      <div style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>AI</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Recruit System</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Candidate Portal</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{candidateName}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{user.email}</div>
          </div>
          <button onClick={logout} style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {/* BANNER */}
      {hasResume && (
        <div style={{ background: "linear-gradient(90deg, #111827, #1e293b)", padding: "13px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2937" }}>
          <p style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 500, margin: 0 }}>
            Hello {candidateName}! Showing personalized job recommendations sorted by your resume match.
          </p>
          <div style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)", padding: "5px 14px", borderRadius: 99, color: "#60a5fa", fontSize: 12 }}>
            📄 Resume uploaded ✓
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={S.tabBar}>
        {[
          { key: "jobs",    label: "🎯 Job Matches"    },
          { key: "applied", label: "✅ My Applications" },
          { key: "saved",   label: "🔖 Saved Jobs"      },
          { key: "profile", label: "👤 My Profile"      },
          { key: "resume",  label: "📄 Resume Upload"   },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "14px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "none", border: "none",
            borderBottom: activeTab === t.key ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === t.key ? "#60a5fa" : "#6b7280"
          }}>{t.label}</button>
        ))}
      </div>

      {/* ════ JOB MATCHES ════ */}
      {activeTab === "jobs" && (
        <>
          {/* Filter bar */}
          <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "10px 32px", display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowFilter(p => !p)} style={{
                fontSize: 13, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                border: showFilter ? "1px solid #2563eb" : "1px solid #334155",
                background: showFilter ? "rgba(37,99,235,0.15)" : "#1e293b",
                color: showFilter ? "#60a5fa" : "#94a3b8",
                display: "flex", alignItems: "center", gap: 6
              }}>
                ⚡ Filters
                {filterLevel !== "All" && <span style={{ background: "#2563eb", color: "white", borderRadius: 99, padding: "0px 7px", fontSize: 11 }}>1</span>}
              </button>
              {showFilter && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, background: "#1e293b", border: "1px solid #334155", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.4)", padding: 8, minWidth: 200 }}>
                  <div style={{ padding: "4px 12px 8px", fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Match Level</div>
                  {["All", "Perfect Match", "Good Match", "Partial Match", "Weak Match"].map(level => (
                    <div key={level} onClick={() => { setFilterLevel(level); setShowFilter(false); }} style={{
                      padding: "9px 12px", cursor: "pointer", borderRadius: 8, fontSize: 13,
                      background: filterLevel === level ? "rgba(37,99,235,0.15)" : "transparent",
                      color: filterLevel === level ? "#60a5fa" : "#94a3b8",
                      fontWeight: filterLevel === level ? 600 : 400
                    }}>
                      {level === "All" ? "All Matches" : level}
                      {filterLevel === level && <span style={{ float: "right" }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { setFilterLevel("All"); setSortOrder("score"); }} style={{ fontSize: 13, color: filterLevel !== "All" ? "#ef4444" : "#475569", background: "none", border: "none", cursor: "pointer" }}>Clear All</button>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#6b7280" }}>
              <span><strong style={{ color: "#e2e8f0" }}>{displayedJobs.length}</strong> Jobs</span>
              <button onClick={() => setSortOrder(p => p === "score" ? "date" : "score")} style={{ fontSize: 12, cursor: "pointer", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "5px 12px", color: "#94a3b8" }}>
                Sort: {sortOrder === "score" ? "Match Score ↓" : "Newest First"} ⇅
              </button>
            </div>
          </div>

          <div style={{ display: "flex", height: "calc(100vh - 220px)" }} onClick={() => showFilter && setShowFilter(false)}>

            {/* LEFT: Job List */}
            <div style={{ width: 360, flexShrink: 0, overflowY: "auto", borderRight: "1px solid #1f2937", background: "#111827" }}>
              {loadingJobs && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                  <p style={{ fontSize: 13 }}>Finding your best matches...</p>
                </div>
              )}
              {!loadingJobs && displayedJobs.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p style={{ fontSize: 13 }}>{jobs.length === 0 ? "No jobs yet — upload your resume first" : "No jobs match this filter"}</p>
                </div>
              )}
              {!loadingJobs && displayedJobs.map((job, i) => {
                const ms    = MS[job.recommendation] || MS["Weak Match"];
                const sel   = selectedJob?.jobId === job.jobId;
                const state = getApplyState(job.jobId);
                return (
                  <div key={i} onClick={() => selectJob(job)} style={{
                    padding: "16px 20px", borderBottom: "1px solid #1f2937", cursor: "pointer",
                    background: sel ? "rgba(37,99,235,0.1)" : "transparent",
                    borderLeft: sel ? "3px solid #2563eb" : "3px solid transparent"
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sel ? "#60a5fa" : "#a78bfa", marginBottom: 4 }}>
                      {job.jobTitle}
                      {state === "applied" && <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>Applied</span>}
                      {state === "rejected" && <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>Rejected</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>📍 {job.location}</div>
                    <div style={{ fontSize: 11, color: "#374151", marginBottom: 12 }}>
                      Posted {job.daysAgo === 0 ? "today" : job.daysAgo === 1 ? "yesterday" : `${job.daysAgo} days ago`}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="18" height="18" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="9" fill="none" stroke={ms.hex} strokeWidth="1.5" opacity="0.2"/>
                        <circle cx="10" cy="10" r="6" fill="none" stroke={ms.hex} strokeWidth="1.5" opacity="0.45"/>
                        <circle cx="10" cy="10" r="3" fill={ms.hex}/>
                      </svg>
                      <span style={{ fontSize: 12, fontWeight: 600, color: ms.text }}>{job.recommendation}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: Job Detail */}
            {selectedJob ? (
              <div style={{ flex: 1, overflowY: "auto", background: "#0f172a" }}>

                {/* Header */}
                <div style={{ padding: "28px 36px 22px", borderBottom: "1px solid #1f2937" }}>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 6 }}>{selectedJob.jobTitle}</h1>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>📍 {selectedJob.location}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>🏢 {selectedJob.companyName || selectedJob.employerEmail}</div>

                  {getApplyState(selectedJob.jobId) === "rejected" && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#f87171" }}>
                      ✗ Your previous application was rejected. You may re-apply below.
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12 }}>
                    {(() => {
                      const state = getApplyState(selectedJob.jobId);
                      const isApplying = applyingId === selectedJob.jobId;
                      const cfg = {
                        applied:  { label: "✓ Applied",  bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", color: "#34d399",  disabled: true  },
                        rejected: { label: "Re-Apply",   bg: "#7c3aed",               border: "#7c3aed",              color: "white",     disabled: false },
                        none:     { label: "Apply Now",  bg: "#7c3aed",               border: "#7c3aed",              color: "white",     disabled: false },
                      }[state];
                      return (
                        <button onClick={() => applyToJob(selectedJob)} disabled={cfg.disabled || isApplying} style={{
                          padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                          cursor: cfg.disabled ? "default" : "pointer",
                          border: `2px solid ${cfg.border}`, color: cfg.color,
                          background: isApplying ? "#374151" : cfg.bg, opacity: isApplying ? 0.7 : 1
                        }}>
                          {isApplying ? "Applying..." : cfg.label}
                        </button>
                      );
                    })()}

                    <button onClick={() => toggleSaveJob(selectedJob.jobId)} style={{
                      padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      border: savedJobs.includes(selectedJob.jobId) ? "2px solid rgba(37,99,235,0.5)" : "2px solid #334155",
                      color: savedJobs.includes(selectedJob.jobId) ? "#60a5fa" : "#94a3b8",
                      background: savedJobs.includes(selectedJob.jobId) ? "rgba(37,99,235,0.1)" : "#1e293b"
                    }}>
                      {savedJobs.includes(selectedJob.jobId) ? "🔖 Saved" : "🔖 Save Job"}
                    </button>
                  </div>
                </div>

                {/* Match Visualization */}
                <div style={{ padding: "20px 36px", borderBottom: "1px solid #1f2937" }}>
                  {analyzing ? (
                    <div style={{ color: "#6b7280", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 14, height: 14, border: "2px solid #334155", borderTopColor: "#2563eb", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                      AI is analyzing your match...
                    </div>
                  ) : (() => {
                    const d       = aiAnalysis || selectedJob;
                    const rec     = d.recommendation || selectedJob.recommendation;
                    const ms      = MS[rec] || MS["Weak Match"];
                    const matched = d.matchedSkills || selectedJob.matchedSkills || [];
                    const missing = d.missingSkills || [];
                    return (
                      <div style={{ display: "flex", gap: 18, padding: 16, borderRadius: 14, background: ms.bg, border: `1px solid ${ms.border}` }}>
                        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <svg width="56" height="56" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="25" fill="none" stroke={ms.hex} strokeWidth="2" opacity="0.15"/>
                            <circle cx="28" cy="28" r="17" fill="none" stroke={ms.hex} strokeWidth="2" opacity="0.35"/>
                            <circle cx="28" cy="28" r="9"  fill={ms.hex} opacity="0.5"/>
                            <circle cx="28" cy="28" r="5"  fill={ms.hex}/>
                          </svg>
                          <span style={{ fontSize: 12, fontWeight: 700, color: ms.text }}>{d.score || selectedJob.score}%</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: ms.text, marginBottom: 10 }}>{rec}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {matched.map((s, i) => (
                              <span key={i} style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>✓ {s}</span>
                            ))}
                            {missing.slice(0, 6).map((s, i) => (
                              <span key={i} style={{ background: "rgba(107,114,128,0.15)", color: "#9ca3af", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>○ {s}</span>
                            ))}
                          </div>
                          {aiAnalysis?.summary && (
                            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10, lineHeight: 1.7 }}>{aiAnalysis.summary}</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Detail Tabs */}
                <div style={{ borderBottom: "1px solid #1f2937", paddingLeft: 36, display: "flex" }}>
                  {[{ key: "description", label: "Job Description" }, { key: "company", label: "Company & Benefits" }].map(t => (
                    <button key={t.key} onClick={() => setActiveDetail(t.key)} style={{
                      padding: "12px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                      background: "none", border: "none",
                      borderBottom: activeDetail === t.key ? "2px solid #2563eb" : "2px solid transparent",
                      color: activeDetail === t.key ? "#60a5fa" : "#6b7280"
                    }}>{t.label}</button>
                  ))}
                </div>

                <div style={{ padding: "24px 36px" }}>
                  {activeDetail === "description" ? (
                    <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{selectedJob.jobDescription || "No description provided."}</div>
                  ) : (
                    /* ── COMPANY & BENEFITS — updated to show new fields ── */
                    <div style={{ fontSize: 13 }}>

                      {/* Company Info Grid */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>🏢 Company Information</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                          {[
                            ["🏢 Company",   selectedJob.companyName  || selectedJob.employerEmail || "—"],
                            ["📍 Location",  selectedJob.location     || "Not specified"],
                            ["💼 Job Type",  selectedJob.jobType      || "Not specified"],
                            ["🏠 Work Mode", selectedJob.workMode     || "Not specified"],
                            ["💰 Salary",    selectedJob.salary       || "Not disclosed"],
                            ["📧 Contact",   selectedJob.contactEmail || selectedJob.employerEmail || "—"],
                          ].map(([label, val]) => (
                            <div key={label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ color: "#475569", fontSize: 11, marginBottom: 4 }}>{label.split(" ")[0]} <span style={{ color: "#64748b" }}>{label.split(" ").slice(1).join(" ")}</span></div>
                              <div style={{ color: "#e2e8f0", fontWeight: 500, fontSize: 13 }}>{val}</div>
                            </div>
                          ))}
                        </div>

                        {/* About Company */}
                        {selectedJob.companyDescription ? (
                          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ color: "#475569", fontSize: 11, marginBottom: 8 }}>About the Company</div>
                            <div style={{ color: "#94a3b8", lineHeight: 1.8 }}>{selectedJob.companyDescription}</div>
                          </div>
                        ) : (
                          <div style={{ color: "#374151", fontSize: 12, fontStyle: "italic" }}>No company description provided.</div>
                        )}
                      </div>

                      {/* Benefits */}
                      <div>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>🎁 Benefits & Perks</div>
                        {selectedJob.benefits ? (
                          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "16px 18px" }}>
                            <div style={{ color: "#94a3b8", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{selectedJob.benefits}</div>
                          </div>
                        ) : (
                          <div style={{ color: "#374151", fontSize: 12, fontStyle: "italic" }}>No benefits information provided.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>👈</div>
                  <p style={{ fontSize: 14 }}>Select a job to view details</p>
                </div>
              </div>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {activeTab === "applied" && <AppliedTab email={user.email} onAppliedChange={fetchAppliedAndSaved} />}
      {activeTab === "saved"   && <SavedTab   email={user.email} />}

      {activeTab === "profile" && (
        <div style={{ maxWidth: 600, margin: "32px auto", background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: "white" }}>My Profile</h2>
          <CandidateProfile user={user} refresh={fetchMyData} />
        </div>
      )}
      {activeTab === "resume" && (
        <div style={{ maxWidth: 600, margin: "32px auto", background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: "white" }}>Resume Upload</h2>
          <ResumeUpload user={user} />
        </div>
      )}
    </div>
  );
}

/* ── My Applications Tab ── */
function AppliedTab({ email, onAppliedChange }) {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = () => {
    setLoading(true);
    fetch(`${BASE}/my-applications/${email}`)
      .then(r => r.json())
      .then(data => { setApps(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, [email]);

  const cancelApp = async (appId) => {
    if (!window.confirm("Cancel this application?")) return;
    try {
      const res = await fetch(`${BASE}/cancel-application/${appId}`, { method: "DELETE" });
      if (res.ok) { fetchApps(); if (onAppliedChange) onAppliedChange(); }
    } catch { alert("Failed to cancel ❌"); }
  };

  const statusCfg = {
    pending:  { bg: "rgba(37,99,235,0.15)",   color: "#60a5fa", border: "rgba(37,99,235,0.3)",   label: "Under Review" },
    accepted: { bg: "rgba(16,185,129,0.15)",  color: "#34d399", border: "rgba(16,185,129,0.3)",  label: "✓ Accepted"   },
    rejected: { bg: "rgba(239,68,68,0.15)",   color: "#f87171", border: "rgba(239,68,68,0.3)",   label: "✗ Rejected"   },
  };

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "white" }}>My Applications ({apps.length})</h2>
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>Loading...</div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <p>No applications yet. Go to Job Matches and click "Apply Now"!</p>
        </div>
      ) : apps.map((a, i) => {
        const s = statusCfg[a.status] || statusCfg.pending;
        return (
          <div key={i} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: "20px 24px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600, color: "white", fontSize: 15 }}>{a.jobTitle || "Job Position"}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>🏢 {a.employerEmail}</div>
              <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>
                📅 {new Date(a.createdAt).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}
              </div>
              {a.status === "rejected" && (
                <div style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>💡 You can re-apply from Job Matches</div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 16 }}>
              <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 99 }}>
                {s.label}
              </span>
              {a.status === "pending" && (
                <button onClick={() => cancelApp(a._id)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 11, padding: "4px 12px", borderRadius: 8, cursor: "pointer" }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Saved Jobs Tab ── */
function SavedTab({ email }) {
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    fetch(`${BASE}/saved-jobs/${email}`)
      .then(r => r.json()).then(data => setSaved(Array.isArray(data) ? data : []));
  }, [email]);

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "white" }}>Saved Jobs ({saved.length})</h2>
      {saved.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔖</div>
          <p>No saved jobs yet.</p>
        </div>
      ) : saved.map((job, i) => (
        <div key={i} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: "16px 20px", marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: "#a78bfa", fontSize: 14 }}>{job.jobTitle}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>📍 {job.location || "Not specified"}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>🏢 {job.companyName || job.employerEmail}</div>
        </div>
      ))}
    </div>
  );
}

export default CandidateDashboard;
