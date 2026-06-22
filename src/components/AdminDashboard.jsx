import React, { useState, useEffect } from "react";

const BASE = "https://fyp2-backend-gihc.onrender.com";

const S = {
  page:  { minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Inter, sans-serif" },
  nav:   { background: "#111827", borderBottom: "1px solid #1f2937", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tabs:  { background: "#111827", borderBottom: "1px solid #1f2937", padding: "0 32px", display: "flex" },
  card:  { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: "20px 24px", marginBottom: 12 },
  stat:  { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: "24px", flex: 1, minWidth: 160 },
  input: { background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" },
  badge: (c) => ({ background: `${c}20`, color: c, border: `1px solid ${c}40`, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }),
  pill:  (active, c) => ({
    background: active ? `${c}25` : "#1e293b", color: active ? c : "#6b7280",
    border: `1px solid ${active ? c + "60" : "#334155"}`,
    fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 99, cursor: "pointer", transition: "all 0.2s"
  }),
};

export default function AdminDashboard({ user, logout }) {
  const [tab,          setTab]          = useState("overview");
  const [candidates,   setCandidates]   = useState([]);
  const [employers,    setEmployers]    = useState([]);
  const [jobs,         setJobs]         = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [expanded,     setExpanded]     = useState(null);  // expanded candidate email
  const [appFilter,    setAppFilter]    = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [uR, jR, aR] = await Promise.all([
        fetch(`${BASE}/admin/all-users`),
        fetch(`${BASE}/admin/all-jobs`),
        fetch(`${BASE}/admin/all-applications`),
      ]);
      const users = Array.isArray(await uR.json()) ? await (await fetch(`${BASE}/admin/all-users`)).json() : [];
      const jobsD = await (await fetch(`${BASE}/admin/all-jobs`)).json();
      const appsD = await (await fetch(`${BASE}/admin/all-applications`)).json();
      setCandidates(users.filter(u => u.role === "candidate"));
      setEmployers(users.filter(u => u.role === "employer"));
      setJobs(Array.isArray(jobsD) ? jobsD : []);
      setApplications(Array.isArray(appsD) ? appsD : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const delUser = async (email) => {
    if (!window.confirm(`Delete account: ${email}?`)) return;
    const res = await fetch(`${BASE}/admin/delete-user`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    alert((await res.json()).msg); load();
  };
  const delJob = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    await fetch(`${BASE}/admin/delete-job/${id}`, { method: "DELETE" }); load();
  };
  const delApp = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    await fetch(`${BASE}/admin/delete-application/${id}`, { method: "DELETE" }); load();
  };

  // Deduplicated keyword counts
  const candidateKeywords = [...new Set(candidates.flatMap(c => c.resumeKeywords || []))];
  const jobKeywords       = [...new Set(jobs.flatMap(j => j.jobKeywords || []))];

  const pending  = applications.filter(a => a.status === "pending").length;
  const accepted = applications.filter(a => a.status === "accepted").length;
  const rejected = applications.filter(a => a.status === "rejected").length;

  const filteredApps = applications.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !search || a.candidateEmail?.toLowerCase().includes(q) || a.jobTitle?.toLowerCase().includes(q) || a.employerEmail?.toLowerCase().includes(q);
    const matchS = appFilter === "all" || a.status === appFilter;
    return matchQ && matchS;
  });

  const scoreColor = s => s >= 70 ? "#34d399" : s >= 50 ? "#60a5fa" : s >= 30 ? "#fbbf24" : "#9ca3af";

  const TABS = [
    { key: "overview",      label: "📊 Overview"                                                },
    { key: "candidates",    label: `👤 Candidates & Applications (${candidates.length}/${applications.length})` },
    { key: "employers",     label: `🏢 Employers & Jobs (${employers.length}/${jobs.length})`   },
  ];

  return (
    <div style={S.page}>
      {/* NAV */}
      <div style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#dc2626,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>A</div>
          <div><div style={{ fontWeight: 700, fontSize: 18 }}>Admin Panel</div><div style={{ color: "#94a3b8", fontSize: 12 }}>AI Recruit System · {user.email}</div></div>
        </div>
        <button onClick={logout} style={{ background: "#ef4444", color: "white", border: "none", padding: "9px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Logout</button>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); setAppFilter("all"); }} style={{
            padding: "14px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", background: "none", border: "none",
            borderBottom: tab === t.key ? "2px solid #dc2626" : "2px solid transparent",
            color: tab === t.key ? "#f87171" : "#6b7280", whiteSpace: "nowrap"
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ════ OVERVIEW ════ */}
        {tab === "overview" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>System Overview</h2>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
              {[
                { label: "Total Candidates", value: candidates.length,   icon: "👤", color: "#3b82f6" },
                { label: "Total Employers",  value: employers.length,    icon: "🏢", color: "#8b5cf6" },
                { label: "Active Jobs",      value: jobs.length,         icon: "📋", color: "#10b981" },
                { label: "Applications",     value: applications.length, icon: "📥", color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} style={S.stat}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color, marginBottom: 4 }}>{loading ? "…" : s.value}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              {/* Application Status */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📊 Application Status</div>
                {[
                  { label: "Under Review", count: pending,  color: "#60a5fa" },
                  { label: "Accepted",     count: accepted, color: "#34d399" },
                  { label: "Rejected",     count: rejected, color: "#f87171" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                    <span style={{ color: "#94a3b8", fontSize: 13, flex: 1 }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                    <div style={{ width: 80, background: "#1e293b", borderRadius: 99, height: 4 }}>
                      <div style={{ height: 4, borderRadius: 99, background: item.color, width: applications.length > 0 ? `${(item.count / applications.length) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats — split keyword counts */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📈 Quick Stats</div>
                {[
                  { label: "Candidates with Resume",     value: candidates.filter(c => c.resumeText).length },
                  { label: "Candidates without Resume",  value: candidates.filter(c => !c.resumeText).length },
                  { label: "📄 Candidate Resume Keywords (unique)", value: candidateKeywords.length, color: "#60a5fa" },
                  { label: "🔑 Job Posting Keywords (unique)",      value: jobKeywords.length,       color: "#a78bfa" },
                  { label: "Acceptance Rate",            value: applications.length > 0 ? `${Math.round((accepted / applications.length) * 100)}%` : "—" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1f2937", fontSize: 13 }}>
                    <span style={{ color: "#94a3b8" }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color || "#e2e8f0" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate keywords cloud */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📄 Candidate Keyword Cloud ({candidateKeywords.length} unique)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto" }}>
                {candidateKeywords.slice(0, 80).map((kw, i) => <span key={i} style={{ background: "rgba(37,99,235,0.12)", color: "#60a5fa", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>{kw}</span>)}
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🔑 Job Keyword Cloud ({jobKeywords.length} unique)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto" }}>
                {jobKeywords.slice(0, 80).map((kw, i) => <span key={i} style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>{kw}</span>)}
              </div>
            </div>

            {/* Recent users */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🕐 Recently Registered Users</div>
              {[...candidates, ...employers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8).map((u, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1f2937" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{u.name || u.email}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{u.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={S.badge(u.role === "candidate" ? "#3b82f6" : "#8b5cf6")}>{u.role}</span>
                    <span style={{ color: "#374151", fontSize: 11 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-MY") : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ CANDIDATES & APPLICATIONS ════ */}
        {tab === "candidates" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Candidates & Applications</h2>
              <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 260 }} />
            </div>

            {/* ── Candidates ── */}
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>👤 Candidates ({candidates.length})</div>
            {loading ? <div style={{ color: "#475569", textAlign: "center", padding: 32 }}>Loading...</div> :
              candidates
                .filter(c => !search || c.email.toLowerCase().includes(search.toLowerCase()) || (c.name||"").toLowerCase().includes(search.toLowerCase()))
                .map((c, i) => (
                  <div key={i} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{(c.name||c.email)[0].toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{c.name || "—"}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{c.email}</div>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                          {[["📱", "Phone", c.phone||"—"], ["🎓", "Education", c.education||"—"], ["💼", "Experience", c.experience||"—"], ["📄", "Resume", c.resumeText ? "✅ Uploaded" : "❌ None"]].map(([icon,label,val]) => (
                            <div key={label} style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px" }}>
                              <div style={{ color: "#475569", fontSize: 10, marginBottom: 2 }}>{icon} {label}</div>
                              <div style={{ color: "#94a3b8", fontSize: 12 }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
                        <button onClick={() => setExpanded(expanded === c.email ? null : c.email)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>{expanded === c.email ? "Hide" : "Keywords"}</button>
                        <button onClick={() => delUser(c.email)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>🗑️ Delete</button>
                      </div>
                    </div>
                    {expanded === c.email && (
                      <div style={{ marginTop: 14, background: "#0f172a", borderRadius: 10, padding: 14, border: "1px solid #1f2937" }}>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8 }}>RESUME KEYWORDS ({(c.resumeKeywords||[]).length})</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxHeight: 100, overflowY: "auto" }}>
                          {(c.resumeKeywords||[]).map((kw, j) => <span key={j} style={{ background: "#1e293b", color: "#64748b", fontSize: 10, padding: "2px 8px", borderRadius: 99 }}>{kw}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                ))
            }

            {/* ── Applications ── */}
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "28px 0 12px" }}>📥 Applications ({applications.length})</div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { key: "all",      label: `All (${applications.length})`, color: "#94a3b8" },
                { key: "pending",  label: `Pending (${pending})`,         color: "#60a5fa" },
                { key: "accepted", label: `Accepted (${accepted})`,       color: "#34d399" },
                { key: "rejected", label: `Rejected (${rejected})`,       color: "#f87171" },
              ].map(p => (
                <button key={p.key} onClick={() => setAppFilter(p.key)} style={S.pill(appFilter === p.key, p.color)}>
                  {p.label}{appFilter === p.key && <span style={{ marginLeft: 6 }}>✓</span>}
                </button>
              ))}
            </div>

            {filteredApps.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#374151" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p>{applications.length === 0 ? "No applications yet." : `No ${appFilter} applications.`}</p>
                {appFilter !== "all" && <button onClick={() => setAppFilter("all")} style={{ color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontSize: 13, marginTop: 8 }}>Clear filter</button>}
              </div>
            ) : filteredApps.map((app, i) => {
              const cfg = { pending: { color: "#60a5fa", label: "Under Review" }, accepted: { color: "#34d399", label: "✓ Accepted for Future Process" }, rejected: { color: "#f87171", label: "✗ Rejected" } }[app.status] || { color: "#60a5fa", label: "Pending" };
              return (
                <div key={i} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", marginBottom: 4 }}>{app.jobTitle || "Job"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 6 }}>
                      <span>👤 {app.candidateName || app.candidateEmail}</span>
                      <span>📧 {app.candidateEmail}</span>
                      <span>🏢 {app.employerEmail}</span>
                      <span>📅 {app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-MY") : "—"}</span>
                    </div>
                    {app.matchScore > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(app.matchScore) }}>{app.matchScore}% match</span>
                        <div style={{ width: 100, background: "#1e293b", borderRadius: 99, height: 4 }}>
                          <div style={{ height: 4, borderRadius: 99, background: scoreColor(app.matchScore), width: `${app.matchScore}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={S.badge(cfg.color)}>{cfg.label}</span>
                    <button onClick={() => delApp(app._id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ════ EMPLOYERS & JOBS ════ */}
        {tab === "employers" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Employers & Jobs</h2>
              <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 260 }} />
            </div>

            {/* ── Employers ── */}
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🏢 Employers ({employers.length})</div>
            {loading ? <div style={{ color: "#475569", textAlign: "center", padding: 32 }}>Loading...</div> :
              employers.filter(e => !search || e.email.toLowerCase().includes(search.toLowerCase()))
                .map((emp, i) => {
                  const empJobs = jobs.filter(j => j.employerEmail === emp.email);
                  return (
                    <div key={i} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: empJobs.length > 0 ? 12 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{emp.email}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{empJobs.length} job{empJobs.length !== 1 ? "s" : ""} posted{emp.createdAt && ` · Joined ${new Date(emp.createdAt).toLocaleDateString("en-MY")}`}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={S.badge("#8b5cf6")}>{empJobs.length} jobs</span>
                          <button onClick={() => delUser(emp.email)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>🗑️ Delete</button>
                        </div>
                      </div>
                      {empJobs.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {empJobs.map((j, k) => <span key={k} style={{ background: "#1e293b", color: "#94a3b8", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>📋 {j.jobTitle}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })
            }

            {/* ── Jobs ── */}
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "28px 0 12px" }}>📋 All Job Postings ({jobs.length})</div>
            {loading ? <div style={{ color: "#475569", textAlign: "center", padding: 32 }}>Loading...</div> :
              jobs.filter(j => !search || j.jobTitle?.toLowerCase().includes(search.toLowerCase()) || j.employerEmail?.includes(search))
                .map((job, i) => (
                  <div key={i} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0", marginBottom: 4 }}>{job.jobTitle}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
                          <span>🏢 {job.companyName || job.employerEmail}</span>
                          <span>📍 {job.location || "Not set"}</span>
                          {job.jobType && <span>💼 {job.jobType}</span>}
                          {job.salary  && <span>💰 {job.salary}</span>}
                          <span>📅 {job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-MY") : "—"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>Posted by: <span style={{ color: "#94a3b8" }}>{job.employerEmail}</span></div>
                        {/* Keyword library */}
                        {(job.jobKeywords||[]).length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>🔑 Keywords ({job.jobKeywords.length})</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {job.jobKeywords.slice(0, 10).map((kw, j) => <span key={j} style={{ background: "#1e293b", color: "#64748b", fontSize: 10, padding: "2px 8px", borderRadius: 99 }}>{kw}</span>)}
                              {job.jobKeywords.length > 10 && <span style={{ color: "#374151", fontSize: 10 }}>+{job.jobKeywords.length - 10}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                      <button onClick={() => delJob(job._id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>🗑️ Delete</button>
                    </div>
                  </div>
                ))
            }
          </>
        )}
      </div>
    </div>
  );
}
