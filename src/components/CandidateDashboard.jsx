import React, { useEffect, useState } from "react";
import CandidateProfile from "./CandidateProfile";
import ResumeUpload from "./ResumeUpload";

const BASE = "https://fyp2-backend-gihc.onrender.com";

const MS = {
  "Perfect Match": { hex: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", text: "#0f766e" },
  "Good Match":    { hex: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  "Partial Match": { hex: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  "Weak Match":    { hex: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", text: "#4b5563" },
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
  const [applyingId,   setApplyingId]   = useState(null);

  /* ── Fetch candidate's own data ── */
  const fetchMyData = () => {
    fetch(`${BASE}/candidates`)
      .then(r => r.json())
      .then(data => setMyData(data.find(c => c.email === user.email)));
  };

  /* ── Load applied + saved from DB ── */
  const fetchAppliedAndSaved = async () => {
    try {
      const [appRes, savedRes] = await Promise.all([
        fetch(`${BASE}/my-applications/${user.email}`),
        fetch(`${BASE}/saved-jobs/${user.email}`)
      ]);
      const appData   = await appRes.json();
      const savedData = await savedRes.json();
      setAppliedJobs(Array.isArray(appData)   ? appData.map(a => a.jobId)          : []);
      setSavedJobs(Array.isArray(savedData)   ? savedData.map(j => j._id.toString()) : []);
    } catch (err) { console.log(err); }
  };

  /* ── Fetch matched jobs ── */
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

  /* ── Select + AI-analyze a job ── */
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

  /* ── Apply to job ── */
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
        alert(`Successfully applied to "${job.jobTitle}" ✅\nThe employer has been notified.`);
      } else {
        alert(data.msg);
      }
    } catch (err) { alert("Apply failed ❌"); }
    setApplyingId(null);
  };

  /* ── Save / unsave job ── */
  const toggleSaveJob = async (jobId) => {
    const isSaved = savedJobs.includes(jobId);
    const action  = isSaved ? "unsave" : "save";
    try {
      await fetch(`${BASE}/toggle-save-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, candidateEmail: user.email, action })
      });
      setSavedJobs(prev => isSaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    fetchMyData();
    fetchJobs();
    fetchAppliedAndSaved();
  }, [user]);

  const candidateName = myData?.name || user.email.split("@")[0];
  const hasResume     = !!myData?.resumeText;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Inter, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>AI</div>
          <div>
            <div style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>AI Recruit System</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Candidate Portal</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{candidateName}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{user.email}</div>
          </div>
          <button onClick={logout} style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── PERSONALIZED BANNER ── */}
      {hasResume && (
        <div style={{ background: "linear-gradient(90deg,#111827,#1f2937)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "white", fontSize: 14, fontWeight: 500, margin: 0 }}>
            Hello {candidateName}! Showing personalized job recommendations sorted by your resume match.
          </p>
          <div style={{ background: "rgba(255,255,255,0.12)", padding: "6px 14px", borderRadius: 6, color: "rgba(255,255,255,0.85)", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
            📄 Resume uploaded ✓
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 32px", display: "flex" }}>
        {[
          { key: "jobs",       label: "🎯 Job Matches"    },
          { key: "applied",    label: "✅ My Applications" },
          { key: "saved",      label: "🔖 Saved Jobs"      },
          { key: "profile",    label: "👤 My Profile"      },
          { key: "resume",     label: "📄 Resume Upload"   },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "14px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "none", border: "none",
            borderBottom: activeTab === t.key ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === t.key ? "#2563eb" : "#6b7280"
          }}>{t.label}</button>
        ))}
      </div>

      {/* ════ JOB MATCHES ════ */}
      {activeTab === "jobs" && (
        <>
          <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "10px 32px", display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", cursor: "pointer", color: "#374151" }}>
              ⚡ All Filters
            </button>
            <button style={{ fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Clear All</button>
            <div style={{ marginLeft: "auto", display: "flex", gap: 24, fontSize: 13, color: "#6b7280" }}>
              <span><strong style={{ color: "#111827" }}>{jobs.length}</strong> Jobs</span>
              <span>Sort: Match Score ↓</span>
            </div>
          </div>

          <div style={{ display: "flex", height: "calc(100vh - 220px)" }}>

            {/* LEFT: Job List */}
            <div style={{ width: 360, flexShrink: 0, overflowY: "auto", borderRight: "1px solid #e5e7eb", background: "white" }}>
              {loadingJobs && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                  <p style={{ fontSize: 13 }}>Finding your best matches...</p>
                </div>
              )}
              {!loadingJobs && jobs.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                  <p style={{ fontSize: 13 }}>No jobs yet — upload your resume first</p>
                </div>
              )}
              {!loadingJobs && jobs.map((job, i) => {
                const ms  = MS[job.recommendation] || MS["Weak Match"];
                const sel = selectedJob?.jobId === job.jobId;
                return (
                  <div key={i} onClick={() => selectJob(job)} style={{
                    padding: "16px 20px", borderBottom: "1px solid #f3f4f6", cursor: "pointer",
                    background: sel ? "#eff6ff" : "white",
                    borderLeft: sel ? "3px solid #2563eb" : "3px solid transparent"
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sel ? "#1d4ed8" : "#7c3aed", marginBottom: 4 }}>
                      {job.jobTitle}
                      {appliedJobs.includes(job.jobId) && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "2px 6px", borderRadius: 99, fontWeight: 600 }}>Applied</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>📍 {job.location}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>
                      Posted {job.daysAgo === 0 ? "today" : job.daysAgo === 1 ? "yesterday" : `${job.daysAgo} days ago`}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="20" height="20" viewBox="0 0 20 20">
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
              <div style={{ flex: 1, overflowY: "auto", background: "white" }}>

                <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #f3f4f6" }}>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{selectedJob.jobTitle}</h1>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>📍 {selectedJob.location}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>
                    🏢 {selectedJob.companyName || selectedJob.employerEmail}
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    {/* Apply Button */}
                    <button
                      onClick={() => applyToJob(selectedJob)}
                      disabled={appliedJobs.includes(selectedJob.jobId) || applyingId === selectedJob.jobId}
                      style={{
                        padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: appliedJobs.includes(selectedJob.jobId) ? "default" : "pointer",
                        border: appliedJobs.includes(selectedJob.jobId) ? "2px solid #16a34a" : "2px solid #7c3aed",
                        color: appliedJobs.includes(selectedJob.jobId) ? "#16a34a" : "white",
                        background: appliedJobs.includes(selectedJob.jobId) ? "#f0fdf4" : "#7c3aed",
                        opacity: applyingId === selectedJob.jobId ? 0.7 : 1
                      }}>
                      {applyingId === selectedJob.jobId ? "Applying..." : appliedJobs.includes(selectedJob.jobId) ? "✓ Applied" : "Apply Now"}
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={() => toggleSaveJob(selectedJob.jobId)}
                      style={{
                        padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        border: savedJobs.includes(selectedJob.jobId) ? "2px solid #2563eb" : "2px solid #d1d5db",
                        color: savedJobs.includes(selectedJob.jobId) ? "#2563eb" : "#6b7280",
                        background: savedJobs.includes(selectedJob.jobId) ? "#eff6ff" : "white"
                      }}>
                      {savedJobs.includes(selectedJob.jobId) ? "🔖 Saved" : "🔖 Save Job"}
                    </button>
                  </div>
                </div>

                {/* Match Visualization */}
                <div style={{ padding: "20px 40px", borderBottom: "1px solid #f3f4f6" }}>
                  {analyzing ? (
                    <div style={{ color: "#9ca3af", fontSize: 13 }}>🤖 AI is analyzing your match...</div>
                  ) : (() => {
                    const d   = aiAnalysis || selectedJob;
                    const rec = d.recommendation || selectedJob.recommendation;
                    const ms  = MS[rec] || MS["Weak Match"];
                    const matched = d.matchedSkills || selectedJob.matchedSkills || [];
                    const missing = d.missingSkills || [];
                    return (
                      <div style={{ display: "flex", gap: 20, padding: 16, borderRadius: 12, background: ms.bg, border: `1px solid ${ms.border}` }}>
                        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <svg width="56" height="56" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="25" fill="none" stroke={ms.hex} strokeWidth="2" opacity="0.15"/>
                            <circle cx="28" cy="28" r="17" fill="none" stroke={ms.hex} strokeWidth="2" opacity="0.35"/>
                            <circle cx="28" cy="28" r="9"  fill={ms.hex} opacity="0.5"/>
                            <circle cx="28" cy="28" r="5"  fill={ms.hex}/>
                          </svg>
                          <span style={{ fontSize: 11, fontWeight: 700, color: ms.text }}>{d.score || selectedJob.score}%</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: ms.text, marginBottom: 10 }}>{rec}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {matched.map((s, i) => (
                              <span key={i} style={{ background: "#ccfbf1", color: "#0f766e", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>✓ {s}</span>
                            ))}
                            {missing.slice(0, 6).map((s, i) => (
                              <span key={i} style={{ background: "#f3f4f6", color: "#6b7280", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>○ {s}</span>
                            ))}
                          </div>
                          {aiAnalysis?.summary && (
                            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10, lineHeight: 1.7 }}>{aiAnalysis.summary}</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Detail Tabs */}
                <div style={{ borderBottom: "1px solid #e5e7eb", paddingLeft: 40, display: "flex" }}>
                  {[{ key: "description", label: "Job Description" }, { key: "company", label: "Company & Benefits" }].map(t => (
                    <button key={t.key} onClick={() => setActiveDetail(t.key)} style={{
                      padding: "12px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                      background: "none", border: "none",
                      borderBottom: activeDetail === t.key ? "2px solid #2563eb" : "2px solid transparent",
                      color: activeDetail === t.key ? "#2563eb" : "#6b7280"
                    }}>{t.label}</button>
                  ))}
                </div>

                <div style={{ padding: "24px 40px" }}>
                  {activeDetail === "description" ? (
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                      {selectedJob.jobDescription || "No description provided."}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13 }}>
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, color: "#374151" }}>Company: </span>
                        <span style={{ color: "#6b7280" }}>{selectedJob.companyName || selectedJob.employerEmail}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, color: "#374151" }}>Location: </span>
                        <span style={{ color: "#6b7280" }}>{selectedJob.location}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
                  <p style={{ fontSize: 14 }}>Select a job to view details</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════ MY APPLICATIONS ════ */}
      {activeTab === "applied" && (
        <AppliedTab email={user.email} />
      )}

      {/* ════ SAVED JOBS ════ */}
      {activeTab === "saved" && (
        <SavedTab email={user.email} onSelect={(job) => { setActiveTab("jobs"); setTimeout(() => selectJob(job), 100); }} />
      )}

      {/* ════ PROFILE ════ */}
      {activeTab === "profile" && (
        <div style={{ maxWidth: 640, margin: "32px auto", background: "white", borderRadius: 16, padding: 32, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: "#111827" }}>My Profile</h2>
          <CandidateProfile user={user} refresh={fetchMyData} />
        </div>
      )}

      {/* ════ RESUME ════ */}
      {activeTab === "resume" && (
        <div style={{ maxWidth: 640, margin: "32px auto", background: "white", borderRadius: 16, padding: 32, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: "#111827" }}>Resume Upload</h2>
          <ResumeUpload user={user} />
        </div>
      )}
    </div>
  );
}

/* ── Applied Jobs Tab ── */
function AppliedTab({ email }) {
  const [apps, setApps] = useState([]);
  useEffect(() => {
    fetch(`https://fyp2-backend-gihc.onrender.com/my-applications/${email}`)
      .then(r => r.json()).then(data => setApps(Array.isArray(data) ? data : []));
  }, [email]);

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111827" }}>My Applications ({apps.length})</h2>
      {apps.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <p>You haven't applied to any jobs yet.</p>
        </div>
      ) : apps.map((a, i) => (
        <div key={i} style={{ background: "white", borderRadius: 12, padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{a.jobTitle}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Employer: {a.employerEmail}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Applied: {new Date(a.createdAt).toLocaleDateString()}</div>
          </div>
          <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 99 }}>
            {a.status === "pending" ? "Under Review" : a.status}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Saved Jobs Tab ── */
function SavedTab({ email }) {
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    fetch(`https://fyp2-backend-gihc.onrender.com/saved-jobs/${email}`)
      .then(r => r.json()).then(data => setSaved(Array.isArray(data) ? data : []));
  }, [email]);

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111827" }}>Saved Jobs ({saved.length})</h2>
      {saved.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔖</div>
          <p>No saved jobs yet. Bookmark jobs you're interested in!</p>
        </div>
      ) : saved.map((job, i) => (
        <div key={i} style={{ background: "white", borderRadius: 12, padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 600, color: "#7c3aed", fontSize: 14 }}>{job.jobTitle}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📍 {job.location || "Not specified"}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>🏢 {job.companyName || job.employerEmail}</div>
        </div>
      ))}
    </div>
  );
}

export default CandidateDashboard;
