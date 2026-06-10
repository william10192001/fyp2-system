import React, { useEffect, useState } from "react";
import CandidateProfile from "./CandidateProfile";
import ResumeUpload from "./ResumeUpload";

const MS = {
  "Perfect Match": { hex: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", text: "#0f766e" },
  "Good Match":    { hex: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  "Partial Match": { hex: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  "Weak Match":    { hex: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", text: "#4b5563" },
};

function CandidateDashboard({ user, logout }) {
  const [activeTab,      setActiveTab]      = useState("jobs");
  const [jobs,           setJobs]           = useState([]);
  const [selectedJob,    setSelectedJob]    = useState(null);
  const [aiAnalysis,     setAiAnalysis]     = useState(null);
  const [loadingJobs,    setLoadingJobs]    = useState(false);
  const [analyzing,      setAnalyzing]      = useState(false);
  const [myData,         setMyData]         = useState(null);
  const [activeDetail,   setActiveDetail]   = useState("description");
  const [savedJobs,      setSavedJobs]      = useState([]);
  const [appliedJobs,    setAppliedJobs]    = useState([]);

  const fetchMyData = () => {
    fetch("https://fyp2-backend-gihc.onrender.com/candidates")
      .then(r => r.json())
      .then(data => setMyData(data.find(c => c.email === user.email)));
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res  = await fetch("https://fyp2-backend-gihc.onrender.com/match-jobs", {
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
      const res  = await fetch("https://fyp2-backend-gihc.onrender.com/analyze-job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateEmail: user.email, jobId: job.jobId })
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (e) { console.log(e); }
    setAnalyzing(false);
  };

  useEffect(() => { fetchMyData(); fetchJobs(); }, [user]);

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
            {candidateName}，您好。根据您的简历排序显示个性化职位建议。
          </p>
          <div style={{ background: "rgba(255,255,255,0.12)", padding: "6px 14px", borderRadius: 6, color: "rgba(255,255,255,0.85)", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
            📄 简历已上传 ✓
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 32px", display: "flex" }}>
        {[
          { key: "jobs",    label: "🎯 Job Matches"  },
          { key: "profile", label: "👤 My Profile"   },
          { key: "resume",  label: "📄 Resume Upload" },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "14px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "none", border: "none",
            borderBottom: activeTab === t.key ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === t.key ? "#2563eb" : "#6b7280"
          }}>{t.label}</button>
        ))}
      </div>

      {/* ════ JOB MATCHES ════ */}
      {activeTab === "jobs" && (
        <>
          {/* Filter bar */}
          <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "10px 32px", display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", cursor: "pointer", color: "#374151" }}>
              ⚡ 所有筛选器
            </button>
            <button style={{ fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>清除所有</button>
            <div style={{ marginLeft: "auto", display: "flex", gap: 24, fontSize: 13, color: "#6b7280" }}>
              <span><strong style={{ color: "#111827" }}>{jobs.length}</strong> 工作</span>
              <span>排序：匹配分 ↓</span>
            </div>
          </div>

          {/* Split panel */}
          <div style={{ display: "flex", height: "calc(100vh - 210px)" }}>

            {/* LEFT list */}
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
                const ms = MS[job.recommendation] || MS["Weak Match"];
                const sel = selectedJob?.jobId === job.jobId;
                return (
                  <div key={i} onClick={() => selectJob(job)} style={{
                    padding: "16px 20px", borderBottom: "1px solid #f3f4f6", cursor: "pointer",
                    background: sel ? "#eff6ff" : "white",
                    borderLeft: sel ? "3px solid #2563eb" : "3px solid transparent"
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sel ? "#1d4ed8" : "#7c3aed", marginBottom: 4 }}>{job.jobTitle}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>📍 {job.location}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>
                      已发布 {job.daysAgo === 0 ? "今天" : `${job.daysAgo} 天前`}
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

            {/* RIGHT detail */}
            {selectedJob ? (
              <div style={{ flex: 1, overflowY: "auto", background: "white" }}>

                {/* Header */}
                <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #f3f4f6" }}>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{selectedJob.jobTitle}</h1>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>📍 {selectedJob.location}</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={() => {
                        if (!appliedJobs.includes(selectedJob.jobId)) {
                          setAppliedJobs(p => [...p, selectedJob.jobId]);
                          alert(`Applied to ${selectedJob.jobTitle} ✅`);
                        }
                      }}
                      style={{
                        padding: "8px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        border: appliedJobs.includes(selectedJob.jobId) ? "2px solid #16a34a" : "2px solid #7c3aed",
                        color: appliedJobs.includes(selectedJob.jobId) ? "#16a34a" : "#7c3aed",
                        background: appliedJobs.includes(selectedJob.jobId) ? "#f0fdf4" : "white"
                      }}>
                      {appliedJobs.includes(selectedJob.jobId) ? "✓ Applied" : "立即申请"}
                    </button>
                    <button
                      onClick={() => setSavedJobs(p => p.includes(selectedJob.jobId) ? p.filter(x => x !== selectedJob.jobId) : [...p, selectedJob.jobId])}
                      style={{
                        padding: "8px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        border: savedJobs.includes(selectedJob.jobId) ? "2px solid #2563eb" : "2px solid #d1d5db",
                        color: savedJobs.includes(selectedJob.jobId) ? "#2563eb" : "#6b7280",
                        background: savedJobs.includes(selectedJob.jobId) ? "#eff6ff" : "white"
                      }}>
                      {savedJobs.includes(selectedJob.jobId) ? "✓ Saved" : "添加至购物车"}
                    </button>
                  </div>
                </div>

                {/* Match viz */}
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

                {/* Detail tabs */}
                <div style={{ borderBottom: "1px solid #e5e7eb", paddingLeft: 40, display: "flex" }}>
                  {[{ key: "description", label: "工作描述" }, { key: "company", label: "公司与福利" }].map(t => (
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

export default CandidateDashboard;