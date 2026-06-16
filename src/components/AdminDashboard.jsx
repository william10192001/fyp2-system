import React, { useState, useEffect } from "react";

const BASE = "https://fyp2-backend-gihc.onrender.com";

const S = {
  page:     { minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Inter, sans-serif" },
  nav:      { background: "#111827", borderBottom: "1px solid #1f2937", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tabBar:   { background: "#111827", borderBottom: "1px solid #1f2937", padding: "0 32px", display: "flex" },
  card:     { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: "20px 24px", marginBottom: 12 },
  statCard: { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: "24px", flex: 1 },
  input:    { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" },
  badge:    (color) => ({ background: `${color}20`, color, border: `1px solid ${color}40`, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, display: "inline-block" }),
  filterPill: (active, color) => ({
    background: active ? `${color}25` : "#1e293b",
    color: active ? color : "#6b7280",
    border: `1px solid ${active ? color + "60" : "#334155"}`,
    fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 99,
    cursor: "pointer", transition: "all 0.2s"
  }),
};

function AdminDashboard({ user, logout }) {
  const [activeTab,    setActiveTab]    = useState("overview");
  const [candidates,   setCandidates]   = useState([]);
  const [employers,    setEmployers]    = useState([]);
  const [jobs,         setJobs]         = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Applications filter state — THIS IS THE FIX
  const [appFilter, setAppFilter] = useState("all");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, jobsRes, appsRes] = await Promise.all([
        fetch(`${BASE}/admin/all-users`),
        fetch(`${BASE}/admin/all-jobs`),
        fetch(`${BASE}/admin/all-applications`),
      ]);
      const usersData = await usersRes.json();
      const jobsData  = await jobsRes.json();
      const appsData  = await appsRes.json();
      const allUsers  = Array.isArray(usersData) ? usersData : [];
      setCandidates(allUsers.filter(u => u.role === "candidate"));
      setEmployers(allUsers.filter(u => u.role === "employer"));
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === "applications") fetchAll(); }, [activeTab]);

  const deleteUser = async (email, role) => {
    if (!window.confirm(`Delete ${role} account: ${email}?`)) return;
    try {
      const res  = await fetch(`${BASE}/admin/delete-user`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      alert(data.msg); fetchAll();
    } catch { alert("Delete failed"); }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Delete this job posting?")) return;
    try {
      await fetch(`${BASE}/admin/delete-job/${jobId}`, { method: "DELETE" });
      fetchAll();
    } catch { alert("Delete failed"); }
  };

  const deleteApp = async (appId) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await fetch(`${BASE}/admin/delete-application/${appId}`, { method: "DELETE" });
      fetchAll();
    } catch { alert("Delete failed"); }
  };

  const pending  = applications.filter(a => a.status === "pending").length;
  const accepted = applications.filter(a => a.status === "accepted").length;
  const rejected = applications.filter(a => a.status === "rejected").length;

  // Filtered applications based on clicked pill
  const filteredApps = applications.filter(a => {
    const matchSearch = !search ||
      a.candidateEmail?.toLowerCase().includes(search.toLowerCase()) ||
      a.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
      a.employerEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = appFilter === "all" || a.status === appFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { key: "overview",     label: "📊 Overview"                             },
    { key: "candidates",   label: `👤 Candidates (${candidates.length})`    },
    { key: "employers",    label: `🏢 Employers (${employers.length})`      },
    { key: "jobs",         label: `📋 Jobs (${jobs.length})`                },
    { key: "applications", label: `📥 Applications (${applications.length})` },
  ];

  return (
    <div style={S.page}>

      {/* NAVBAR */}
      <div style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#dc2626,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>A</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Admin Panel</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>AI Recruit System · {user.email}</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: "#ef4444", color: "white", border: "none", padding: "9px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Logout</button>
      </div>

      {/* TABS */}
      <div style={S.tabBar}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(""); }} style={{
            padding: "14px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "none", border: "none",
            borderBottom: activeTab === t.key ? "2px solid #dc2626" : "2px solid transparent",
            color: activeTab === t.key ? "#f87171" : "#6b7280", whiteSpace: "nowrap"
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ════ OVERVIEW ════ */}
        {activeTab === "overview" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>System Overview</h2>
            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              {[
                { label: "Total Candidates", value: candidates.length, icon: "👤", color: "#3b82f6" },
                { label: "Total Employers",  value: employers.length,  icon: "🏢", color: "#8b5cf6" },
                { label: "Active Jobs",      value: jobs.length,       icon: "📋", color: "#10b981" },
                { label: "Applications",     value: applications.length,icon: "📥", color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{ ...S.statCard, minWidth: 180 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color, marginBottom: 4 }}>{loading ? "…" : s.value}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
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
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📈 Quick Stats</div>
                {[
                  { label: "Candidates with Resume",    value: candidates.filter(c => c.resumeText).length },
                  { label: "Candidates without Resume", value: candidates.filter(c => !c.resumeText).length },
                  { label: "Total Job Keywords",        value: jobs.reduce((s, j) => s + (j.jobKeywords?.length || 0), 0) },
                  { label: "Acceptance Rate",           value: applications.length > 0 ? `${Math.round((accepted / applications.length) * 100)}%` : "—" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1f2937", fontSize: 13 }}>
                    <span style={{ color: "#94a3b8" }}>{item.label}</span>
                    <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🕐 Recently Registered Users</div>
              {loading ? <div style={{ color: "#475569" }}>Loading...</div> :
                [...candidates, ...employers]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 8).map((u, i) => (
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
                  ))
              }
            </div>
          </>
        )}

        {/* ════ CANDIDATES ════ */}
        {activeTab === "candidates" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Candidates ({candidates.length})</h2>
              <input placeholder="🔍 Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 260 }} />
            </div>
            {loading ? <div style={{ color: "#475569", textAlign: "center", padding: 40 }}>Loading...</div> :
              candidates.filter(c => !search || c.email.toLowerCase().includes(search.toLowerCase()) || (c.name||"").toLowerCase().includes(search.toLowerCase()))
                .map((c, i) => (
                  <div key={i} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {(c.name || c.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{c.name || "—"}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{c.email}</div>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 10 }}>
                          {[["📱 Phone", c.phone||"—"], ["🎓 Education", c.education||"—"], ["💼 Experience", c.experience||"—"], ["📄 Resume", c.resumeText ? "✅ Uploaded" : "❌ None"]].map(([label, val]) => (
                            <div key={label} style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px" }}>
                              <div style={{ color: "#475569", fontSize: 10, marginBottom: 2 }}>{label}</div>
                              <div style={{ color: "#94a3b8", fontSize: 12 }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
                        <button onClick={() => setSelectedUser(selectedUser?.email === c.email ? null : c)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                          {selectedUser?.email === c.email ? "Hide" : "Details"}
                        </button>
                        <button onClick={() => deleteUser(c.email, "candidate")} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>🗑️ Delete</button>
                      </div>
                    </div>
                    {selectedUser?.email === c.email && (
                      <div style={{ marginTop: 16, background: "#0f172a", borderRadius: 10, padding: 16, border: "1px solid #1f2937" }}>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 10 }}>RESUME KEYWORDS ({(c.resumeKeywords || []).length})</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 80, overflowY: "auto" }}>
                          {(c.resumeKeywords || []).slice(0, 40).map((kw, j) => (
                            <span key={j} style={{ background: "#1e293b", color: "#64748b", fontSize: 10, padding: "2px 8px", borderRadius: 99 }}>{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
            }
          </>
        )}

        {/* ════ EMPLOYERS ════ */}
        {activeTab === "employers" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Employers ({employers.length})</h2>
              <input placeholder="🔍 Search by email..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 260 }} />
            </div>
            {loading ? <div style={{ color: "#475569", textAlign: "center", padding: 40 }}>Loading...</div> :
              employers.filter(e => !search || e.email.toLowerCase().includes(search.toLowerCase()))
                .map((emp, i) => {
                  const empJobs = jobs.filter(j => j.employerEmail === emp.email);
                  return (
                    <div key={i} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏢</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{emp.email}</div>
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                              {empJobs.length} job{empJobs.length !== 1 ? "s" : ""} posted
                              {emp.createdAt && ` · Joined ${new Date(emp.createdAt).toLocaleDateString("en-MY")}`}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={S.badge("#8b5cf6")}>{empJobs.length} jobs</span>
                          <button onClick={() => deleteUser(emp.email, "employer")} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>🗑️ Delete</button>
                        </div>
                      </div>
                      {empJobs.length > 0 && (
                        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {empJobs.map((j, k) => <span key={k} style={{ background: "#1e293b", color: "#94a3b8", fontSize: 11, padding: "3px 10px", borderRadius: 99 }}>📋 {j.jobTitle}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </>
        )}

        {/* ════ JOBS ════ */}
        {activeTab === "jobs" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>All Job Postings ({jobs.length})</h2>
              <input placeholder="🔍 Search by title or employer..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 280 }} />
            </div>
            {loading ? <div style={{ color: "#475569", textAlign: "center", padding: 40 }}>Loading...</div> :
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
                        <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>
                          Posted by: <span style={{ color: "#94a3b8" }}>{job.employerEmail}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {(job.jobKeywords || []).slice(0, 8).map((kw, j) => <span key={j} style={{ background: "#1e293b", color: "#64748b", fontSize: 10, padding: "2px 8px", borderRadius: 99 }}>{kw}</span>)}
                          {(job.jobKeywords || []).length > 8 && <span style={{ color: "#374151", fontSize: 10 }}>+{job.jobKeywords.length - 8}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteJob(job._id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>🗑️ Delete</button>
                    </div>
                  </div>
                ))
            }
          </>
        )}

        {/* ════ APPLICATIONS ════ */}
        {activeTab === "applications" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>All Applications ({applications.length})</h2>
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 220 }} />
                <button onClick={fetchAll} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>🔄 Refresh</button>
              </div>
            </div>

            {/* ── CLICKABLE Filter Pills (THE FIX) ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { key: "all",      label: `All (${applications.length})`, color: "#94a3b8" },
                { key: "pending",  label: `Pending (${pending})`,         color: "#60a5fa" },
                { key: "accepted", label: `Accepted (${accepted})`,       color: "#34d399" },
                { key: "rejected", label: `Rejected (${rejected})`,       color: "#f87171" },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setAppFilter(p.key)}
                  style={S.filterPill(appFilter === p.key, p.color)}
                >
                  {p.label}
                  {appFilter === p.key && <span style={{ marginLeft: 6 }}>✓</span>}
                </button>
              ))}
            </div>

            {filteredApps.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
                <p>{applications.length === 0 ? "No applications yet." : `No ${appFilter} applications found.`}</p>
                {appFilter !== "all" && (
                  <button onClick={() => setAppFilter("all")} style={{ marginTop: 8, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Clear filter</button>
                )}
              </div>
            ) : filteredApps.map((app, i) => {
              const statusCfg = {
                pending:  { color: "#60a5fa", label: "Under Review" },
                accepted: { color: "#34d399", label: "✓ Accepted"   },
                rejected: { color: "#f87171", label: "✗ Rejected"   },
              }[app.status] || { color: "#60a5fa", label: "Pending" };
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
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: app.matchScore >= 70 ? "#34d399" : app.matchScore >= 50 ? "#60a5fa" : "#fbbf24" }}>{app.matchScore}% match</span>
                        <div style={{ flex: 1, maxWidth: 120, background: "#1e293b", borderRadius: 99, height: 4 }}>
                          <div style={{ height: 4, borderRadius: 99, background: app.matchScore >= 70 ? "#34d399" : app.matchScore >= 50 ? "#60a5fa" : "#fbbf24", width: `${app.matchScore}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={S.badge(statusCfg.color)}>{statusCfg.label}</span>
                    <button onClick={() => deleteApp(app._id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
