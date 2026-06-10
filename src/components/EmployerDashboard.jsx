import React, { useState, useEffect } from "react";

const BASE = "https://fyp2-backend-gihc.onrender.com";

const BADGE = {
  "Perfect Match": { bg: "#f0fdfa", color: "#0f766e", border: "#99f6e4" },
  "Good Match":    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Partial Match": { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  "Weak Match":    { bg: "#f9fafb", color: "#4b5563", border: "#e5e7eb" },
};

function EmployerDashboard({ user, logout }) {
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

  const fetchJobs = async () => {
    try {
      const res  = await fetch(`${BASE}/jobs/${user.email}`);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchJobs(); }, [user]);

  const openCreate = () => {
    setEditingJob(null);
    setForm({ jobTitle: "", companyName: "", location: "", jobDescription: "" });
    setPdfFile(null);
    setShowForm(true);
    setResults([]);
  };

  const openEdit = (job) => {
    setEditingJob(job);
    setForm({ jobTitle: job.jobTitle, companyName: job.companyName, location: job.location, jobDescription: job.jobDescription });
    setPdfFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => { setShowForm(false); setEditingJob(null); setPdfFile(null); };

  const handlePdfUpload = async (file) => {
    setPdfFile(file);
    setExtracting(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res  = await fetch(`${BASE}/upload-job-pdf`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setForm(prev => ({ ...prev, jobDescription: data.text }));
      else alert(data.msg || "PDF upload failed");
    } catch (err) { alert("Error uploading PDF"); }
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
      alert(data.msg);
      setShowForm(false);
      setEditingJob(null);
      fetchJobs();
    } catch (err) { alert("Save failed"); }
    setSaving(false);
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Delete this job posting?")) return;
    await fetch(`${BASE}/job/${jobId}`, { method: "DELETE" });
    fetchJobs();
    if (activeMatchJob === jobId) { setResults([]); setActiveMatchJob(null); }
  };

  const runMatching = async (job) => {
    setLoading(true);
    setResults([]);
    setActiveMatchJob(job._id);
    setShowForm(false);
    try {
      const res  = await fetch(`${BASE}/match`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: job._id }) });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) { alert("Matching failed"); }
    setLoading(false);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 200);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-gray-800 bg-[#111827]">
        <div>
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-gray-400 mt-1">AI Recruitment System · {user.email}</p>
        </div>
        <button onClick={logout} className="bg-red-500 hover:bg-red-600 transition px-5 py-2 rounded-xl font-semibold">Logout</button>
      </div>

      <div className="p-8 max-w-5xl mx-auto">

        {/* ── JOB LIST HEADER ── */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-2xl font-bold">My Job Postings</h2>
            <p className="text-gray-500 text-sm mt-0.5">{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p>
          </div>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-xl font-semibold">
            + Post New Job
          </button>
        </div>

        {/* ── JOB FORM ── */}
        {showForm && (
          <div className="bg-[#111827] border border-blue-500/40 rounded-2xl p-6 mb-6 shadow-xl">
            <h2 className="text-xl font-bold mb-5">{editingJob ? "✏️ Edit Job" : "📝 Post New Job"}</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Job Title *</label>
                <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})}
                  placeholder="e.g. Frontend Developer"
                  className="w-full bg-[#1e293b] border border-gray-700 focus:border-blue-500 outline-none rounded-xl p-3 text-white text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Company Name</label>
                <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})}
                  placeholder="e.g. Tech Corp Sdn Bhd"
                  className="w-full bg-[#1e293b] border border-gray-700 focus:border-blue-500 outline-none rounded-xl p-3 text-white text-sm" />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-1 block">Location</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                placeholder="e.g. Johor Bahru, Malaysia"
                className="w-full bg-[#1e293b] border border-gray-700 focus:border-blue-500 outline-none rounded-xl p-3 text-white text-sm" />
            </div>

            {/* PDF UPLOAD */}
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-1 block">
                Upload Job Description PDF
                <span className="text-gray-600 ml-1">(optional — auto-fills description)</span>
              </label>
              <label className="flex items-center gap-4 border-2 border-dashed border-gray-700 hover:border-blue-500 transition rounded-xl p-4 cursor-pointer">
                <div className="text-2xl">📄</div>
                <div>
                  {pdfFile
                    ? <span className="text-blue-400 font-medium text-sm">{pdfFile.name}</span>
                    : <span className="text-gray-400 text-sm">Click to upload PDF job description</span>
                  }
                  {extracting && <span className="text-yellow-400 text-xs ml-2 animate-pulse">⏳ Extracting text...</span>}
                </div>
                <input type="file" accept=".pdf" className="hidden"
                  onChange={e => { if (e.target.files[0]) handlePdfUpload(e.target.files[0]); }} />
              </label>
            </div>

            <div className="mb-5">
              <label className="text-gray-400 text-xs mb-1 block">Job Description *</label>
              <textarea rows="8" value={form.jobDescription} onChange={e => setForm({...form, jobDescription: e.target.value})}
                placeholder="e.g. Looking for a React developer with 3 years experience in JavaScript, Node.js..."
                className="w-full bg-[#1e293b] border border-gray-700 focus:border-blue-500 outline-none rounded-xl p-4 text-white text-sm resize-none" />
            </div>

            <div className="flex gap-3">
              <button onClick={saveJob} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 transition px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50">
                {saving ? "Saving..." : editingJob ? "💾 Update Job" : "💾 Save Job"}
              </button>
              <button onClick={cancelForm} className="bg-gray-700 hover:bg-gray-600 transition px-6 py-2.5 rounded-xl font-semibold">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {jobs.length === 0 && !showForm && (
          <div className="text-center py-20 text-gray-600">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg">No jobs posted yet.</p>
            <p className="text-sm mt-2">Click <strong className="text-white">+ Post New Job</strong> to get started.</p>
          </div>
        )}

        {/* ── JOB CARDS ── */}
        <div className="grid gap-4">
          {jobs.map(job => (
            <div key={job._id}
              className={`bg-[#111827] border rounded-2xl p-5 shadow-lg transition-all ${activeMatchJob === job._id ? "border-purple-500/50" : "border-gray-800"}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold">{job.jobTitle}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {job.companyName && <span>{job.companyName} · </span>}📍 {job.location || "Location not set"}
                  </p>
                  <p className="text-gray-600 text-xs mt-2 truncate">{job.jobDescription?.substring(0, 120)}...</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(job.jobKeywords || []).slice(0, 6).map((kw, i) => (
                      <span key={i} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{kw}</span>
                    ))}
                    {(job.jobKeywords || []).length > 6 && (
                      <span className="text-gray-600 text-xs self-center">+{job.jobKeywords.length - 6} more</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => runMatching(job)}
                    className="bg-purple-600 hover:bg-purple-700 transition px-4 py-1.5 rounded-lg text-xs font-semibold">
                    🚀 Run AI Match
                  </button>
                  <button onClick={() => openEdit(job)}
                    className="bg-gray-700 hover:bg-gray-600 transition px-4 py-1.5 rounded-lg text-xs font-medium">
                    ✏️ Edit
                  </button>
                  <button onClick={() => deleteJob(job._id)}
                    className="bg-red-900/30 hover:bg-red-700/50 transition px-4 py-1.5 rounded-lg text-xs font-medium text-red-400">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MATCHING RESULTS ── */}
        {loading && (
          <div className="mt-12 text-center text-gray-400 animate-pulse text-lg">
            🤖 AI is analyzing all candidates... this may take a moment.
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-1">Matching Results</h2>
            <p className="text-gray-400 text-sm mb-5">
              {results.length} candidates matched for:{" "}
              <strong className="text-white">{jobs.find(j => j._id === activeMatchJob)?.jobTitle}</strong>
            </p>

            <div className="grid gap-5">
              {results.map((c, i) => {
                const badge = BADGE[c.recommendation] || BADGE["Weak Match"];
                return (
                  <div key={i} className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-lg">

                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-bold">{c.name || "Unnamed"}</h3>
                          {c.recommendation && (
                            <span className="text-xs px-3 py-1 rounded-full font-semibold"
                              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {c.recommendation}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 mt-1 text-sm">{c.email}</p>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <div className="text-4xl font-extrabold text-green-400">{c.score}%</div>
                        <div className="text-gray-500 text-xs mt-1">AI Score</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-400"
                          style={{ width: `${c.score}%` }} />
                      </div>
                    </div>

                    {/* AI summary */}
                    {c.summary && (
                      <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-purple-300 text-sm">
                        🤖 <strong>AI Analysis:</strong> {c.summary}
                      </div>
                    )}

                    {/* Skills */}
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-[#1e293b] p-4 rounded-xl">
                        <div className="text-gray-400 text-xs mb-2">✅ Matched Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.matchedKeywords?.length > 0
                            ? c.matchedKeywords.map((w, j) => (
                                <span key={j} className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">{w}</span>
                              ))
                            : <span className="text-gray-500 text-sm">None identified</span>}
                        </div>
                      </div>
                      <div className="bg-[#1e293b] p-4 rounded-xl">
                        <div className="text-gray-400 text-xs mb-2">❌ Missing Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.missingSkills?.length > 0
                            ? c.missingSkills.map((w, j) => (
                                <span key={j} className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{w}</span>
                              ))
                            : <span className="text-gray-500 text-sm">None identified</span>}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="grid md:grid-cols-3 gap-3 mt-4">
                      {[["📞 Phone", c.phone], ["💼 Experience", c.experience], ["🎓 Education", c.education]].map(([label, val]) => (
                        <div key={label} className="bg-[#1e293b] p-3 rounded-xl">
                          <div className="text-gray-500 text-xs">{label}</div>
                          <div className="text-sm mt-0.5 text-gray-300">{val || "N/A"}</div>
                        </div>
                      ))}
                    </div>

                    {/* Resume Preview */}
                    {c.resumeText && (
                      <details className="mt-4">
                        <summary className="text-gray-400 text-sm cursor-pointer hover:text-white transition select-none">
                          📄 Resume Preview (click to expand)
                        </summary>
                        <div className="mt-3 bg-[#0f172a] border border-gray-700 rounded-xl p-5 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-400 leading-6 whitespace-pre-wrap font-mono">
                            {c.resumeText}
                          </pre>
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
          <div className="mt-16 text-center text-gray-700">
            <div className="text-5xl mb-4">🤖</div>
            <p>Click <strong className="text-gray-400">🚀 Run AI Match</strong> on any job above to find matching candidates.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployerDashboard;